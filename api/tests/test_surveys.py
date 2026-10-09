from datetime import timedelta

import pytest

from app.core.db import now
from app.modules.areas import service as areas
from app.modules.areas.schemas import AreaIn
from app.modules.surveys import service as surveys
from app.modules.surveys.models import Survey
from app.modules.tickets import service as t
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
    area = areas.save_area(db, root.id, AreaIn(name="Soporte"))
    ana = users.create_user(db, root, UserCreate(email="ana@acme.com", name="Ana", role="usuario", area_id=area.uuid))
    new = lambda email="cliente@x.com": t.create(db, root, TicketIn(
        title="Falla", description="x", area_id=area.uuid, assignee_id=ana.uuid, client_email=email))
    return root, ana, new, tokens


def test_sent_only_on_resolved_with_client_email(db, env):
    root, ana, new, tokens = env
    tk = t.propose(db, ana, new().id, ProposalIn(kind="close", comment="Listo"))
    t.accept(db, root, tk.id, tk.pending.id, DecisionIn(outcome="resuelto"))
    t.close(db, root, new().id, CloseIn(outcome="no_resuelto", comment="Sin solución"))
    t.close(db, root, new(None).id, CloseIn(outcome="resuelto", comment="Hecho"))
    assert len([x for x in tokens if x]) == 1 and ("cliente@x.com", "¿Cómo te atendimos? (OD-000001)") in db.sent


def test_rate_once_then_comment(db, env):
    root, _, new, tokens = env
    tk = new()
    t.close(db, root, tk.id, CloseIn(outcome="resuelto", comment="Hecho"))
    token = tokens[-1]
    with pytest.raises(surveys.Conflict, match="calificación"):
        surveys.comment(db, token, "Bien")
    assert surveys.rate(db, token, 4).state == "answered"
    with pytest.raises(surveys.Conflict, match="ya fue respondida"):
        surveys.rate(db, token, 5)
    surveys.comment(db, token, "Muy amable")
    assert surveys.for_ticket(db, root, tk.id).rating == 4


def test_expired_token_rejected(db, env):
    root, _, new, tokens = env
    t.close(db, root, new().id, CloseIn(outcome="resuelto", comment="Hecho"))
    db.query(Survey).update({"expires_at": now() - timedelta(minutes=1)})
    db.commit()
    assert surveys.status(db, tokens[-1]).state == "expired"
    with pytest.raises(surveys.Conflict, match="venció"):
        surveys.rate(db, tokens[-1], 5)


def test_multiple_stars_snapshot_and_atomic_validation(db, env):
    from uuid import uuid4
    from app.modules.settings import survey_form
    root, _, new, tokens = env
    definition = survey_form.read(db)
    extra = str(uuid4())
    definition.questions.append(survey_form.Question(id=extra, label="¿Fue clara la respuesta?"))
    survey_form.save(db, root, definition)
    tk = new()
    t.close(db, root, tk.id, CloseIn(outcome="resuelto", comment="Hecho"))
    token = tokens[-1]
    definition = survey_form.read(db)
    definition.questions[1].label = "Nueva pregunta"
    survey_form.save(db, root, definition)
    assert surveys.status(db, token).questions[1]["label"] == "¿Fue clara la respuesta?"
    with pytest.raises(ValueError):
        surveys.rate(db, token, {survey_form.MAIN: 5})
    assert surveys.status(db, token).state == "pending"
    with pytest.raises(ValueError):
        surveys.rate(db, token, {survey_form.MAIN: 5, extra: True})
    answered = surveys.rate(db, token, {survey_form.MAIN: 4, extra: 2})
    assert answered.rating == 4 and answered.ratings[extra] == 2
    assert surveys.for_ticket(db, root, tk.id).ratings[extra] == 2


def test_answer_rechecks_a_previously_loaded_survey(db, env):
    from app.core.db import SessionLocal
    root, _, new, tokens = env
    t.close(db, root, new().id, CloseIn(outcome="resuelto", comment="Hecho"))
    token = tokens[-1]
    with SessionLocal() as other:
        cached = surveys._find(other, token)
        assert cached.rating is None
        surveys.rate(db, token, 4)
        with pytest.raises(surveys.Conflict, match="ya fue respondida"):
            surveys.rate(other, token, 5)
