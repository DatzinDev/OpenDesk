from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.areas import service as areas
from app.modules.areas.schemas import AreaIn
from app.modules.audit import service as audit
from app.modules.identity import service as identity
from app.modules.notifications import service as notif
from app.modules.settings import service as settings
from app.modules.settings.schemas import SettingsIn, Technical
from app.modules.tickets import service as t
from app.modules.tickets.schemas import TicketIn
from app.modules.users import service as users
from app.modules.users.schemas import UserCreate
from app.shared import storage


@pytest.fixture
def env(db, monkeypatch):
    monkeypatch.setattr(storage, "put", lambda *a: None)
    users.ensure_root(db, "root@acme.com")
    root = users.get_by_email(db, "root@acme.com")
    gestor = users.create_user(db, root, UserCreate(email="g@acme.com", name="Gestora", role="gestor"))
    area = areas.save_area(db, root.id, AreaIn(name="Soporte", sla_hours=10))
    ana = users.create_user(db, root, UserCreate(email="ana@acme.com", name="ana", role="usuario", area_id=area.uuid))
    return root, gestor, area, ana


def _set(db, actor, **values):
    current = settings.read(db)
    data = SettingsIn(functional=current.functional.model_copy(update=values))
    return settings.save(db, actor, data)


def test_defaults_save_and_permissions(db, env):
    root, gestor, *_ = env
    assert settings.read(db).functional.sla_warning_pct == 80
    assert _set(db, gestor, org_name="Acme").functional.org_name == "Acme"
    with pytest.raises(settings.Forbidden):
        settings.save(db, gestor, SettingsIn(technical=Technical(allowed_domain="acme.com", timezone="UTC")))
    settings.save(db, root, SettingsIn(technical=Technical(allowed_domain="acme.com", timezone="UTC")))
    assert identity.login(db, "intruso@otra.com", None, None) is None
    assert identity.login(db, "ana@acme.com", None, None)


def test_sweep_uses_warning_pct(db, env):
    root, gestor, area, ana = env
    _set(db, root, sla_warning_pct=50)
    tk = t.create(db, root, TicketIn(title="x", description="x", area_id=area.uuid, assignee_id=ana.uuid))
    t.sweep(db, tk.due_from + (tk.due_at - tk.due_from) * 0.55)
    assert notif.inbox(db, ana.id).items[0].title.startswith("Se consumió el 50 %")


def test_audit_filters_paging_and_admin_only(db, env):
    root, gestor, area, _ = env
    for i in range(3):
        _set(db, root, org_name=f"Org {i}")
    page = audit.entries(db, action="settings.", limit=2)
    assert len(page["items"]) == 2 and page["more"]
    rest = audit.entries(db, action="settings.", limit=2, before=page["items"][-1]["id"])
    assert len(rest["items"]) == 1 and not rest["more"]
    assert all(e["actor"] == root.name for e in page["items"])
    client = TestClient(app)
    for who, code in ((gestor, 403), (root, 200)):
        client.cookies.set("opendesk_session", identity.login(db, who.email, None, None))
        assert client.get("/api/audit").status_code == code
