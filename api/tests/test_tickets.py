from datetime import timedelta

import pytest

from app.core.db import now
from app.modules.areas import service as areas
from app.modules.areas.schemas import AreaIn
from app.modules.tickets import service as t
from app.modules.tickets.schemas import CloseIn, DecisionIn, ProposalIn, ReopenIn, TicketIn
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
        db, root, UserCreate(email=email, name=email.split("@")[0], role="usuario", area_id=area.id, level=level))
    ana, beto, caro, dani = mk("ana@acme.com", sop), mk("beto@acme.com", sop, 2), mk("caro@acme.com", sop, 2), mk("dani@acme.com", ven)
    new = lambda who=ana: t.create(db, root, TicketIn(title="Falla", description="No entra", area_id=who.area_id, assignee_id=who.id))
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
    assert tk.assignee_id == caro.id and tk.status == "asignado"
    tk = t.propose(db, caro, tk.id, ProposalIn(kind="escalate", comment="Tampoco"))
    tk = t.accept(db, root, tk.id, tk.pending.id, DecisionIn())
    assert tk.needs_manager and tk.assignee_id == caro.id  # nivel 3 vacío


def test_reassign_to_other_area_needs_manager_choice(db, env):
    root, ana, _, _, dani, ven, new = env
    tk = t.propose(db, ana, new().id, ProposalIn(kind="reassign", comment="Es de ventas", area_id=ven.id))
    with pytest.raises(t.Conflict, match="persona"):
        t.accept(db, root, tk.id, tk.pending.id, DecisionIn())
    tk = t.accept(db, root, tk.id, tk.pending.id, DecisionIn(user_id=dani.id))
    assert tk.assignee_id == dani.id and tk.area_id == ven.id


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
