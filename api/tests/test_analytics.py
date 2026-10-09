from datetime import date, timedelta

import pytest
from sqlalchemy import update

from app.core.db import now
from app.modules.analytics import service as an
from app.modules.areas import service as areas
from app.modules.areas.schemas import AreaIn
from app.modules.surveys import service as surveys
from app.modules.tickets import service as t
from app.modules.tickets.models import Ticket
from app.modules.tickets.schemas import CloseIn, DecisionIn, ProposalIn, TicketIn
from app.modules.users import service as users
from app.modules.users.schemas import UserCreate
from app.shared import storage


@pytest.fixture
def env(db, monkeypatch):
    monkeypatch.setattr(storage, "put", lambda *a: None)
    tokens = []
    send = surveys.send
    monkeypatch.setattr(surveys, "send", lambda db_, tid: tokens.append(send(db_, tid)))
    users.ensure_root(db, "root@acme.com")
    root = users.get_by_email(db, "root@acme.com")
    sop = areas.save_area(db, root.id, AreaIn(name="Soporte", levels=2))
    ven = areas.save_area(db, root.id, AreaIn(name="Ventas", levels=1))
    mk = lambda e, a, lv=1: users.create_user(db, root, UserCreate(email=e, name=e.split("@")[0], role="usuario",
                                                                    area_id=a.uuid, level=lv))
    ana, beto, caro = mk("ana@acme.com", sop), mk("beto@acme.com", sop, 2), mk("caro@acme.com", ven)
    new = lambda who, area: t.create(db, root, TicketIn(title="Falla", description="x", area_id=area.uuid,
                                                         assignee_id=who.uuid, client_email="c@x.com"))
    return root, ana, beto, caro, sop, ven, new, tokens


def _f(area=None):
    return an.Filters.from_dates(date.today() - timedelta(days=29), date.today() + timedelta(days=1), area_id=area)


def _created_hours_ago(db, ticket_uuid, hours):
    db.execute(update(Ticket).where(Ticket.uuid == ticket_uuid).values(created_at=now() - timedelta(hours=hours)))
    db.commit()


def test_sla_resolution_and_csat(db, env):
    root, ana, beto, caro, sop, ven, new, tokens = env
    # 1) respuesta a tiempo, 2) respuesta tarde, 3) SLA vencido con auto-escalamiento.
    a = new(ana, sop)
    a = t.propose(db, ana, a.id, ProposalIn(kind="close", comment="Listo"))
    t.accept(db, root, a.id, a.pending.id, DecisionIn(outcome="resuelto"))
    b = new(ana, sop)
    db.execute(update(Ticket).where(Ticket.uuid == b.id).values(due_at=now() - timedelta(minutes=1)))
    db.commit()
    b = t.propose(db, ana, b.id, ProposalIn(kind="close", comment="Tarde"))
    t.accept(db, root, b.id, b.pending.id, DecisionIn(outcome="no_resuelto"))
    c = new(ana, sop)
    t.sweep(db, now() + timedelta(days=30))  # vence el SLA de c y lo escala a beto
    _created_hours_ago(db, a.id, 2)
    _created_hours_ago(db, b.id, 10)
    surveys.rate(db, tokens[0], 4)

    r = an.report(db, "times", _f())
    assert r["kpis"]["sla"]["value"] == pytest.approx(33.3)
    assert r["kpis"]["auto_escalations"]["value"] == 1
    assert r["kpis"]["resolution_median"]["value"] == pytest.approx(6.0, abs=0.1)  # mediana de 2 h y 10 h
    s = an.report(db, "summary", _f())
    assert s["kpis"]["open"]["value"] == 1 and s["kpis"]["closed"]["value"] == 2 and s["kpis"]["csat"]["value"] == 4
    cl = an.report(db, "clients", _f())
    assert cl["kpis"]["response_rate"]["value"] == 100.0 and cl["kpis"]["resolved"]["value"] == 50.0
    team = {p["persona"]: p for p in an.report(db, "team", _f())["series"]["people"]}
    assert team["beto"]["carga"] == 1 and team["ana"]["cerrados"] == 2


def test_area_filter_and_export(db, env):
    root, ana, _, caro, sop, ven, new, _ = env
    new(ana, sop)
    new(caro, ven)
    assert an.report(db, "summary", _f(ven.id))["kpis"]["created"]["value"] == 1
    rows = list(an.export_rows(db, _f(ven.id)))
    assert len(rows) == 2 and rows[1][2] == "Ventas"
