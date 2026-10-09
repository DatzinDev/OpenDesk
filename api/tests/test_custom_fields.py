from uuid import uuid4

import pytest

from app.modules.settings import service
from app.modules.users import service as users


@pytest.fixture
def admin(db):
    users.ensure_root(db, "root@acme.com")
    return users.get_by_email(db, "root@acme.com")


def field(kind="text", **kwargs):
    return {"id": str(uuid4()), "label": "Dato", "type": kind, **kwargs}


def test_form_revision_preserves_identifiers(db, admin):
    from app.modules.settings import form
    definition = form.FormDefinition(revision=0, fields=[field(required=True)])
    saved = form.save(db, admin, definition)
    assert saved.revision == 1
    with pytest.raises(form.Conflict):
        form.save(db, admin, definition)
    with pytest.raises(ValueError, match="[Dd]esactiv"):
        form.save(db, admin, form.FormDefinition(revision=1, fields=[]))
    with pytest.raises(ValueError, match="tipo"):
        form.save(db, admin, saved.model_copy(update={"fields": [saved.fields[0].model_copy(update={"type": "number"})]}))
    with pytest.raises(service.Forbidden):
        form.save(db, type("Actor", (), {"role": "gestor"})(), saved)


def test_values_accept_zero_false_and_reject_invalid_types(db, admin):
    from app.modules.settings import form
    number, boolean, date = field("number", required=True), field("boolean", required=True), field("date")
    saved = form.save(db, admin, form.FormDefinition(revision=0, fields=[number, boolean, date]))
    values = {number["id"]: 0, boolean["id"]: False, date["id"]: "2026-10-09"}
    assert form.validate_values(db, values, saved.revision) == values
    for bad in (True, float("inf"), 10**400, "3"):
        with pytest.raises(ValueError):
            form.validate_values(db, {**values, number["id"]: bad}, saved.revision)
    with pytest.raises(ValueError):
        form.validate_values(db, {}, saved.revision)
    with pytest.raises(ValueError):
        form.validate_values(db, {**values, date["id"]: "2026-02-31"}, saved.revision)
    with pytest.raises(form.Conflict):
        form.validate_values(db, values, 0)


def test_archived_values_survive_partial_edits(db, admin):
    from app.modules.settings import form
    a, b = field(), field(required=True)
    saved = form.save(db, admin, form.FormDefinition(revision=0, fields=[a, b]))
    old = {a["id"]: "histórico"}
    saved.fields[0].active = False
    saved = form.save(db, admin, saved)
    assert form.validate_values(db, {b["id"]: "nuevo"}, saved.revision, old) == {**old, b["id"]: "nuevo"}
    assert form.validate_values(db, {}, saved.revision, old) == old
    with pytest.raises(ValueError, match="inactivo"):
        form.validate_values(db, {a["id"]: "cambio"}, saved.revision, old)
    with pytest.raises(ValueError):
        form.validate_values(db, {str(uuid4()): "intruso"}, saved.revision, old)


def test_list_option_archive_is_preserved(db, admin):
    from app.modules.settings import form
    option = {"id": str(uuid4()), "label": "Primera"}
    f = field("select", options=[option, {"id": str(uuid4()), "label": "Segunda"}])
    saved = form.save(db, admin, form.FormDefinition(revision=0, fields=[f]))
    old = {f["id"]: option["id"]}
    saved.fields[0].options[0].active = False
    saved = form.save(db, admin, saved)
    assert form.validate_values(db, {}, saved.revision, old) == old
    with pytest.raises(ValueError):
        form.validate_values(db, old, saved.revision)


def test_csv_includes_archived_fields_and_neutralizes_formulas(db, admin, monkeypatch):
    from datetime import date
    from app.modules.settings import form
    from app.modules.areas import service as areas
    from app.modules.areas.schemas import AreaIn
    from app.modules.users.schemas import UserCreate
    from app.modules.tickets import service as tickets
    from app.modules.tickets.schemas import TicketIn
    from app.modules.analytics import service as analytics
    from app.shared import storage
    monkeypatch.setattr(storage, "put", lambda *args: None)
    area = areas.save_area(db, admin.id, AreaIn(name="Atención"))
    agent = users.create_user(db, admin, UserCreate(email="agent@acme.com", name="Agente", role="usuario", area_id=area.uuid))
    f = field(label="=Campo")
    saved = form.save(db, admin, form.FormDefinition(fields=[f]))
    tickets.create(db, admin, TicketIn(title="=Fórmula", description="x", area_id=area.uuid, assignee_id=agent.uuid,
                                     form_revision=saved.revision, custom_values={f["id"]: "=1+1"}))
    saved.fields[0].active = False
    form.save(db, admin, saved)
    rows = list(analytics.export_rows(db, analytics.Filters.from_dates(date(2026, 1, 1), date(2026, 12, 31), analytics.ZoneInfo("UTC"))))
    assert rows[0][-1].startswith("'=Campo")
    assert rows[1][1] == "'=Fórmula"
    assert rows[1][-1] == "'=1+1"
