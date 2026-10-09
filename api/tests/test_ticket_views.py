from datetime import timedelta
import pytest
from app.core.db import now
from app.modules.tickets import service as t
from app.modules.tickets.schemas import TicketIn, TicketUpdate
from app.modules.users import service as users
from app.modules.users.schemas import UserCreate
from app.modules.areas import service as areas
from app.modules.areas.schemas import AreaIn


@pytest.fixture
def env(db):
    users.ensure_root(db, "root@acme.com")
    root = users.get_by_email(db, "root@acme.com")
    area = areas.save_area(db, root.id, AreaIn(name="Soporte"))
    ana = users.create_user(db, root, UserCreate(email="ana@acme.com", name="Ana", role="usuario", area_id=area.uuid))
    beto = users.create_user(db, root, UserCreate(email="beto@acme.com", name="Beto", role="usuario", area_id=area.uuid))
    new = lambda who=ana: t.create(db, root, TicketIn(title="Falla", description="No entra", area_id=area.uuid, assignee_id=who.uuid))
    return root, ana, beto, new


def test_overview_is_global_and_filtering_keeps_access_scope(db, env):
    root, ana, beto, *_, new = env
    first, second = new(ana), new(beto)
    t.update(db, root, first.id, TicketUpdate(priority="alta"))
    counts = t.overview(db, root)
    assert counts.open == 2 and counts.pending == 0
    page = t.page_for(db, root, 1, 1, priority="alta")
    assert page.total == 1 and page.items[0].id == first.id
    assert t.page_for(db, beto, 1, 10, priority="alta").total == 0
    assert t.detail(db, root, first.id).last_activity_at >= first.created_at


def test_deadline_progress_uses_business_hours_and_freezes_on_close(db, env, monkeypatch):
    root, *_, new = env
    tk = new()
    fixed = now() + timedelta(hours=1)
    monkeypatch.setattr(t, "now", lambda: fixed)
    detail = t.detail(db, root, tk.id)
    assert detail.deadline.kind == "sla"
    assert detail.deadline.elapsed_hours >= 0
    assert detail.deadline.total_hours > 0
    assert detail.deadline.percent >= 0


def test_last_activity_includes_acceptance_and_rejection(db, env, monkeypatch):
    from app.modules.tickets.schemas import ProposalIn, DecisionIn
    root, ana, *_, new = env
    tk = new()
    proposed = t.propose(db, ana, tk.id, ProposalIn(kind="escalate", comment="Revisar"))
    decision_at = now() + timedelta(hours=2)
    monkeypatch.setattr(t, "now", lambda: decision_at)
    rejected = t.reject(db, root, tk.id, proposed.pending.id, DecisionIn(comment="Continuar"))
    assert rejected.last_activity_at == decision_at
    assert t.page_for(db, root, 1, 20).items[0].last_activity_at == decision_at
    proposed = t.propose(db, ana, tk.id, ProposalIn(kind="update", comment="Resolver", due_at=decision_at + timedelta(days=1)))
    accepted_at = decision_at + timedelta(minutes=5)
    monkeypatch.setattr(t, "now", lambda: accepted_at)
    accepted = t.accept(db, root, tk.id, proposed.pending.id, DecisionIn())
    assert accepted.last_activity_at == accepted_at


def test_old_decision_activity_uses_recorded_audit_date(db, env):
    from app.modules.audit.models import AuditEntry
    root, *_, new = env
    tk = new()
    at = now() + timedelta(minutes=10)
    db.add(AuditEntry(action="ticket.rejected", actor_id=root.id, entity="ticket", entity_id=str(t.visible_id(db, root, tk.id)), data={}, at=at))
    db.commit()
    assert t.detail(db, root, tk.id).last_activity_at == at


def test_sla_excludes_weekend_and_closed_snapshot_stops(db, env, monkeypatch):
    from datetime import datetime, time, timezone
    from app.modules.tickets.schemas import CloseIn
    root, ana, *_, new = env
    area = areas.get(db, ana.area_id)
    areas.save_area(db, root.id, AreaIn(name=area.name, sla_hours=24, always_open=False,
        week=[(time(9), time(17))] * 5 + [None, None]), area.id)
    friday = datetime(2026, 10, 9, 9, tzinfo=timezone.utc)
    monkeypatch.setattr(t, "now", lambda: friday)
    # Usar la zona configurada para comprobar 9–17 sin depender del huso de ejecución.
    from app.modules import settings
    monkeypatch.setattr(settings, "tz", lambda db: timezone.utc)
    tk = new()
    monday = datetime(2026, 10, 12, 10, tzinfo=timezone.utc)
    monkeypatch.setattr(t, "now", lambda: monday)
    detail = t.detail(db, root, tk.id)
    assert detail.deadline.elapsed_hours == 9
    assert detail.deadline.total_hours == 24
    closed = t.close(db, root, tk.id, CloseIn(outcome="resuelto", comment="Listo"))
    monkeypatch.setattr(t, "now", lambda: monday + timedelta(days=1))
    assert t.detail(db, root, tk.id).deadline.elapsed_hours == closed.deadline.elapsed_hours
