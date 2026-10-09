from datetime import timedelta

import pytest

from app.core.db import now
from app.modules.areas import service as areas
from app.modules.areas.schemas import AreaIn
from app.modules.tickets import service as t
from app.modules.tickets.schemas import (CloseIn, DecisionIn, ProposalIn, ReopenIn, SetStatusIn, StatusIn, TicketIn,
                                         TicketUpdate)
from app.modules.users import service as users
from app.modules.users.schemas import UserCreate
from app.shared import storage


@pytest.fixture
def env(db, monkeypatch):
    monkeypatch.setattr(storage, "put", lambda *a: None)
    users.ensure_root(db, "root@acme.com")
    root = users.get_by_email(db, "root@acme.com")
    sop = areas.save_area(db, root.id, AreaIn(name="Soporte", levels=3))
    ven = areas.save_area(db, root.id, AreaIn(name="Ventas", levels=2))
    mk = lambda email, area, level=1: users.create_user(
        db, root, UserCreate(email=email, name=email.split("@")[0], role="usuario", area_id=area.uuid, level=level))
    ana, beto, caro, dani = mk("ana@acme.com", sop), mk("beto@acme.com", sop, 2), mk("caro@acme.com", sop, 2), mk("dani@acme.com", ven)
    area_of = {sop.id: sop.uuid, ven.id: ven.uuid}
    new = lambda who=ana: t.create(db, root, TicketIn(title="Falla", description="No entra", area_id=area_of[who.area_id], assignee_id=who.uuid))
    return root, ana, beto, caro, dani, ven, new


def test_one_pending_proposal_and_reject_needs_comment(db, env):
    root, ana, *_, new = env
    tk = new()
    tk = t.propose(db, ana, tk.id, ProposalIn(kind="escalate", comment="No es mío"))
    assert tk.status == "pendiente"
    with pytest.raises(t.Conflict, match="pendiente"):
        t.propose(db, ana, tk.id, ProposalIn(kind="close", comment="Listo"))
    with pytest.raises(t.Conflict, match="motivo"):
        t.reject(db, root, tk.id, tk.pending.id, DecisionIn())
    assert t.reject(db, root, tk.id, tk.pending.id, DecisionIn(comment="Revisa otra vez")).status == "asignado"


def test_accepted_update_becomes_commitment(db, env):
    root, ana, *_, new = env
    due = now() + timedelta(days=2)
    tk = t.propose(db, ana, new().id, ProposalIn(kind="update", comment="Reviso logs", due_at=due))
    tk = t.accept(db, root, tk.id, tk.pending.id, DecisionIn())
    assert tk.status == "seguimiento" and tk.committed and abs(tk.due_at - due) < timedelta(seconds=1)


def test_escalate_picks_least_loaded_then_flags_manager(db, env):
    root, ana, beto, caro, *_, new = env
    new(beto)  # beto ya tiene un ticket abierto
    tk = t.propose(db, ana, new().id, ProposalIn(kind="escalate", comment="Requiere nivel 2"))
    tk = t.accept(db, root, tk.id, tk.pending.id, DecisionIn())
    assert tk.assignee_id == caro.uuid and tk.status == "asignado"
    tk = t.propose(db, caro, tk.id, ProposalIn(kind="escalate", comment="Tampoco"))
    tk = t.accept(db, root, tk.id, tk.pending.id, DecisionIn())
    assert tk.needs_manager and tk.assignee_id == caro.uuid  # nivel 3 vacío


def test_reassign_to_other_area_needs_manager_choice(db, env):
    root, ana, _, _, dani, ven, new = env
    tk = t.propose(db, ana, new().id, ProposalIn(kind="reassign", comment="Es de ventas", area_id=ven.uuid))
    with pytest.raises(t.Conflict, match="persona"):
        t.accept(db, root, tk.id, tk.pending.id, DecisionIn())
    tk = t.accept(db, root, tk.id, tk.pending.id, DecisionIn(user_id=dani.uuid))
    assert tk.assignee_id == dani.uuid and tk.area_id == ven.uuid


def test_reopen_restarts_sla_and_usuario_sees_only_own(db, env):
    root, ana, beto, *_, new = env
    tk = new()
    first_due = tk.due_at
    t.close(db, root, tk.id, CloseIn(outcome="resuelto", comment="Hecho"))
    tk = t.reopen(db, root, tk.id, ReopenIn(comment="Volvió a fallar"))
    assert tk.status == "asignado" and tk.outcome is None and tk.due_at >= first_due
    with pytest.raises(t.NotFound):
        t.detail(db, beto, tk.id)
    assert [x.id for x in t.list_for(db, beto)] == []


def test_tracking_status_only_by_staff_and_logged(db, env):
    root, ana, *_, new = env
    st = t.save_status(db, root, StatusIn(name="Esperando al cliente"))
    tk = new()
    with pytest.raises(t.Forbidden):
        t.set_status(db, ana, tk.id, SetStatusIn(status_id=st.id))
    tk = t.set_status(db, root, tk.id, SetStatusIn(status_id=st.id))
    assert tk.status_id == st.id and tk.events[-1].data == {"name": "Esperando al cliente"}


def test_edit_by_assignee_or_staff_and_logged(db, env):
    root, ana, beto, *_, new = env
    tk = new()
    with pytest.raises(t.NotFound):
        t.update(db, beto, tk.id, TicketUpdate(title="Otro"))
    tk = t.update(db, ana, tk.id, TicketUpdate(title="Falla de acceso", priority="alta", description="Nueva"))
    assert tk.title == "Falla de acceso" and tk.events[-1].data["changes"] == {
        "title": ["Falla", "Falla de acceso"], "priority": ["media", "alta"], "description": None}
    tk = t.update(db, root, tk.id, TicketUpdate(client_email=""))
    assert tk.client_email is None
    t.close(db, root, tk.id, CloseIn(outcome="resuelto", comment="Hecho"))
    with pytest.raises(t.Conflict, match="cerrado"):
        t.update(db, root, tk.id, TicketUpdate(title="X"))


def test_inbox_pagination(db, env):
    root, ana, *_, new = env
    for _ in range(5):
        new()
    first = t.page_for(db, root, 1, 2, status="abiertos")
    last = t.page_for(db, root, 3, 2, status="abiertos")
    assert first.total == 5 and len(first.items) == 2 and len(last.items) == 1
    assert not {x.id for x in first.items} & {x.id for x in last.items}


def test_custom_fields_create_edit_and_history(db, env):
    from uuid import uuid4
    from app.modules.settings import form
    root, ana, *_, new = env
    historical = new()
    field_id = str(uuid4())
    saved = form.save(db, root, form.FormDefinition(fields=[{"id": field_id, "label": "Contrato", "type": "text", "required": True}]))
    # Un ticket anterior puede seguir sin respuesta en un campo que ahora es obligatorio.
    assert t.update(db, root, historical.id, TicketUpdate(title="Actualizado", custom_values={}, form_revision=saved.revision)).title == "Actualizado"
    with pytest.raises(form.Conflict):
        new()
    with pytest.raises(ValueError):
        t.create(db, root, TicketIn(title="Sin dato", description="x", area_id=historical.area_id, assignee_id=ana.uuid, form_revision=saved.revision))
    tk = t.create(db, root, TicketIn(title="Nuevo", description="x", area_id=historical.area_id, assignee_id=ana.uuid,
                                    custom_values={field_id: "A"}, form_revision=saved.revision))
    assert tk.custom_values == {field_id: "A"}
    tk = t.update(db, ana, tk.id, TicketUpdate(custom_values={field_id: "B"}, form_revision=saved.revision))
    assert tk.events[-1].data["custom_changes"] == [{"id": field_id, "label": "Contrato", "before": "A", "after": "B"}]
    with pytest.raises(ValueError):
        t.update(db, ana, tk.id, TicketUpdate(custom_values={field_id: None}, form_revision=saved.revision))
    saved.fields[0].active = False
    form.save(db, root, saved)
    assert t.detail(db, root, tk.id).custom_values[field_id] == "B"


def test_update_checks_form_revision_without_custom_values(db, env):
    from app.modules.settings import form
    root, *_, new = env
    tk = new()
    definition = form.read(db)
    definition.system[0].label = "Asunto"
    form.save(db, root, definition)
    with pytest.raises(form.Conflict):
        t.update(db, root, tk.id, TicketUpdate(title="Nuevo", form_revision=0))
