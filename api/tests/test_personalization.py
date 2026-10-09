from io import BytesIO

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.settings import service
from app.modules.users import service as users
from app.modules.users.schemas import UserCreate
from app.modules.identity import service as identity


def test_public_branding_excludes_technical_settings(db):
    response = TestClient(app).get("/api/settings/branding")
    assert response.status_code == 200
    assert set(response.json()) == {"org_name", "logo_url", "icon_url", "palette"}


def test_branding_write_requires_admin(db):
    client = TestClient(app, headers={"x-requested-with": "opendesk"})
    assert client.put("/api/settings/branding", json={"preset": "opendesk", "primary": "#0b1d3a", "accent": "#ff8e3c"}).status_code == 401


def test_branding_default_and_palette_validation(db):
    from app.modules.settings import branding
    from app.modules.settings.branding import BrandingIn
    users.ensure_root(db, "root@acme.com")
    root = users.get_by_email(db, "root@acme.com")
    result = branding.save(db, root, BrandingIn(preset="custom", primary="#ffcc00", accent="#123456"))
    assert result.palette.primary == "#ffcc00"
    with pytest.raises(ValueError):
        BrandingIn(preset="custom", primary="url(x)", accent="#123456")
    with pytest.raises(service.Forbidden):
        branding.save(db, type("Actor", (), {"role": "gestor"})(), BrandingIn())


def test_asset_reencodes_and_rejects_invalid_images(db, monkeypatch):
    from PIL import Image
    from app.modules.settings import branding
    from app.shared import storage
    stored = {}
    monkeypatch.setattr(storage, "put", lambda key, data, content_type: stored.update({key: data}))
    users.ensure_root(db, "root@acme.com")
    root = users.get_by_email(db, "root@acme.com")
    original = BytesIO()
    Image.new("RGBA", (64, 64)).save(original, format="PNG")
    resource = branding.upload(db, root, original.getvalue())
    assert resource["url"].endswith(resource["id"])
    assert stored
    with pytest.raises(ValueError):
        branding.upload(db, root, b"<svg></svg>")
    small = BytesIO()
    Image.new("RGB", (16, 16)).save(small, format="PNG")
    with pytest.raises(ValueError):
        branding.upload(db, root, small.getvalue())
    with pytest.raises(ValueError):
        branding.upload(db, root, b"x" * (1024 * 1024 + 1))


def test_operational_roles_read_form_but_cannot_change_identity_or_fields(db):
    users.ensure_root(db, "root@acme.com")
    root = users.get_by_email(db, "root@acme.com")
    gestor = users.create_user(db, root, UserCreate(email="g@acme.com", name="Gestora", role="gestor"))
    client = TestClient(app, headers={"x-requested-with": "opendesk"})
    assert client.get("/api/settings/ticket-form").status_code == 401
    client.cookies.set("opendesk_session", identity.login(db, gestor.email, None, None))
    assert client.get("/api/settings/ticket-form").status_code == 200
    assert client.put("/api/settings/ticket-form", json={"revision": 0, "fields": []}).status_code == 403
    assert client.put("/api/settings/branding", json={}).status_code == 403
    assert client.post("/api/settings/branding/assets", files={"file": ("fake.png", b"fake")}).status_code == 403
    client.cookies.set("opendesk_session", identity.login(db, root.email, None, None))
    assert client.put("/api/settings/branding", json={"preset": "green"}).status_code == 200
    assert client.put("/api/settings/ticket-form", json={"revision": 0, "fields": []}).status_code == 200
    assert client.put("/api/settings/ticket-form", json={"revision": 0, "fields": []}).status_code == 409
