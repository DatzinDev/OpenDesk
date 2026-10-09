from datetime import timedelta

import pytest

from app.core.db import now
from app.modules.areas import service as areas
from app.modules.areas.schemas import AreaIn
from app.modules.notifications import service as notif
from app.modules.tickets import service as t
from app.modules.tickets.schemas import DecisionIn, ProposalIn, TicketIn
from app.modules.users import service as users
from app.modules.users.schemas import UserCreate
from app.shared import storage


@pytest.fixture
def env(db, monkeypatch):
    monkeypatch.setattr(storage, "put", lambda *a: None)
    users.ensure_root(db, "root@acme.com")
    root = users.get_by_email(db, "root@acme.com")
    mk = lambda email, role, area=None, level=None: users.create_user(
        db, root, UserCreate(email=email, name=email.split("@")[0], role=role, area_id=area, level=level))
    gestor = mk("gestor@acme.com", "gestor")
    area = areas.save_area(db, root.id, AreaIn(name="Soporte", levels=2, sla_hours=10))
    ana, beto = mk("ana@acme.com", "usuario", area.id, 1), mk("beto@acme.com", "usuario", area.id, 2)
    db.sent.clear()
    tk = t.create(db, gestor, TicketIn(title="Falla", description="x", area_id=area.id, assignee_id=ana.id))
    return gestor, ana, beto, tk


def titles(db, user):
    return [n.title for n in notif.inbox(db, user.id).items]


def test_assignment_and_proposal_flow_notify_by_app_and_mail(db, env):
    gestor, ana, _, tk = env
    assert titles(db, ana) == [f"Se te asignó el ticket {tk.folio}"]
    tk = t.propose(db, ana, tk.id, ProposalIn(kind="escalate", comment="No es mío"))
    assert titles(db, gestor)[0] == f"ana propone escalar en {tk.folio}"
    t.reject(db, gestor, tk.id, tk.pending.id, DecisionIn(comment="Revisa logs"))
    assert "fue rechazada" in titles(db, ana)[0]
    assert {to for to, _ in db.sent} == {"ana@acme.com", "gestor@acme.com"}
    notif.mark_read(db, ana.id, None)
    assert notif.inbox(db, ana.id).unread == 0


def test_sweep_warns_then_auto_escalates_once(db, env):
    gestor, ana, beto, tk = env
    span = tk.due_at - tk.due_from
    t.sweep(db, tk.due_from + span * 0.85)
    assert titles(db, ana)[0].startswith("Se consumió el 80 %")
    t.sweep(db, tk.due_at + timedelta(minutes=1))
    assert t.detail(db, gestor, tk.id).assignee_id == beto.id
    assert "escalamiento automático" in titles(db, beto)[0]
    assert "venció el SLA" in titles(db, gestor)[0]


def test_reminder_sent_once_per_commitment(db, env):
    gestor, ana, _, tk = env
    tk = t.propose(db, ana, tk.id, ProposalIn(kind="update", comment="Mañana", due_at=now() + timedelta(hours=30)))
    t.accept(db, gestor, tk.id, tk.pending.id, DecisionIn())
    at = now() + timedelta(hours=8)
    t.sweep(db, at)
    t.sweep(db, at + timedelta(minutes=5))
    assert sum("vence pronto" in x for x in titles(db, ana)) == 1
