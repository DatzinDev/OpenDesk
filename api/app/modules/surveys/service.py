import hashlib
import secrets
from datetime import timedelta, timezone
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import config
from app.core.db import SessionLocal, now
from app.modules import settings, tickets, users
from app.modules.surveys.events import SurveyAnswered
from app.modules.surveys.models import Survey
from app.modules.surveys.schemas import SurveyOut, SurveyStatus
from app.shared import mailer
from app.shared.events import publish, subscribe

VALID_DAYS = 7


def _question(db: Session, title: str) -> str:
    """Pregunta configurable (08); {titulo} se reemplaza por el título de la solicitud."""
    return settings.get(db, "survey_question").replace("{titulo}", title)

_env = Environment(loader=FileSystemLoader(Path(__file__).parent / "templates"), autoescape=select_autoescape())


class Conflict(Exception):
    pass


class NotFound(Exception):
    pass


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _utc(dt):
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def send(db: Session, ticket_id: int) -> str | None:
    """Envía la encuesta si el ticket tiene correo de cliente. Devuelve el token (para pruebas)."""
    t = tickets.summary(db, ticket_id)
    if not t or not t.client_email:
        return None
    token = secrets.token_urlsafe(32)
    questions = [dict(q.model_dump(mode="json"), label=q.label.replace("{titulo}", t.title)) for q in settings.survey_definition(db).questions if q.active]
    db.add(Survey(ticket_id=t.id, email=t.client_email, token_hash=_hash(token),
                  expires_at=now() + timedelta(days=VALID_DAYS), questions=questions))
    db.commit()
    body = _env.get_template("survey.html").render(
        name=(t.client_name or "").split(" ")[0], question=next(q["label"] for q in questions if q["id"] == settings.CSAT_ID), folio=t.folio, multiple=len(questions) > 1,
        link=f"{config.APP_URL}/encuesta/{token}", days=VALID_DAYS)
    mailer.send(t.client_email, f"¿Cómo te atendimos? ({t.folio})", mailer.render(body, org=settings.get(db, "org_name")))
    return token


def on_ticket_changed(e: tickets.TicketChanged) -> None:
    # RF-06.1: solo cierres como Resuelto, aceptados o directos.
    if e.data.get("outcome") == "resuelto" and e.kind in ("accepted", "closed"):
        with SessionLocal() as db:
            send(db, e.ticket_id)


def _find(db: Session, token: str, *, lock=False) -> Survey:
    query = select(Survey).where(Survey.token_hash == _hash(token))
    s = db.scalar(query.with_for_update().execution_options(populate_existing=True) if lock else query)
    if not s:
        raise NotFound
    return s


def status(db: Session, token: str) -> SurveyStatus:
    s = _find(db, token)
    t = tickets.summary(db, s.ticket_id)
    state = "answered" if s.rating else "expired" if _utc(s.expires_at) < now() else "pending"
    questions = s.questions or [{"id": settings.CSAT_ID, "label": _question(db, t.title), "help": "", "required": True, "active": True}]
    ratings = s.ratings or ({settings.CSAT_ID: s.rating} if s.rating else {})
    return SurveyStatus(state=state, folio=t.folio, title=t.title, question=next(q["label"] for q in questions if q["id"] == settings.CSAT_ID),
                        rating=s.rating, has_comment=bool(s.comment), questions=questions, ratings=ratings)


def rate(db: Session, token: str, rating: int | dict | None) -> SurveyStatus:
    s = _find(db, token, lock=True)
    if s.rating:
        raise Conflict("Esta encuesta ya fue respondida.")
    if _utc(s.expires_at) < now():
        raise Conflict("Esta encuesta venció.")
    answers = {settings.CSAT_ID: rating} if type(rating) is int else rating
    questions = status(db, token).questions
    known = {q["id"] for q in questions}
    if not isinstance(answers, dict) or set(answers) - known:
        raise ValueError("Las respuestas no corresponden a esta encuesta.")
    for q in questions:
        value = answers.get(q["id"])
        if value is None and not q["required"]:
            continue
        if type(value) is not int or not 1 <= value <= 5:
            raise ValueError(f"{q['label']}: elige entre 1 y 5 estrellas.")
    rating = answers[settings.CSAT_ID]
    s.rating, s.ratings, s.answered_at = rating, {k: v for k, v in answers.items() if v is not None}, now()
    db.commit()
    publish(SurveyAnswered(ticket_id=s.ticket_id, rating=rating))
    return status(db, token)


def comment(db: Session, token: str, text: str) -> SurveyStatus:
    s = _find(db, token, lock=True)
    if not s.rating:
        raise Conflict("Primero elige una calificación.")
    if s.comment:
        raise Conflict("Ya recibimos tu comentario.")
    s.comment = text.strip()
    db.commit()
    return status(db, token)


def for_ticket(db: Session, actor: users.UserOut, ticket_uuid) -> SurveyOut | None:
    ticket_id = tickets.visible_id(db, actor, ticket_uuid)
    s = db.scalar(select(Survey).where(Survey.ticket_id == ticket_id).order_by(Survey.sent_at.desc(), Survey.id.desc()))
    return SurveyOut(sent_at=s.sent_at, expires_at=s.expires_at, rating=s.rating, comment=s.comment,
                     answered_at=s.answered_at, questions=s.questions, ratings=s.ratings or ({settings.CSAT_ID: s.rating} if s.rating else {})) if s else None


def register() -> None:
    subscribe(tickets.TicketChanged, on_ticket_changed)
