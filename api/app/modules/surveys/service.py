import hashlib
import secrets
from datetime import timedelta, timezone
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import config
from app.core.db import SessionLocal, now
from app.modules import tickets, users
from app.modules.surveys.events import SurveyAnswered
from app.modules.surveys.models import Survey
from app.modules.surveys.schemas import SurveyOut, SurveyStatus
from app.shared import mailer
from app.shared.events import publish, subscribe

VALID_DAYS = 7
# ponytail: texto fijo; pasa a parámetros globales editables en el módulo 08.
QUESTION = "¿Qué tan satisfecho quedaste con la atención a tu solicitud “{title}”?"

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
    db.add(Survey(ticket_id=t.id, email=t.client_email, token_hash=_hash(token),
                  expires_at=now() + timedelta(days=VALID_DAYS)))
    db.commit()
    body = _env.get_template("survey.html").render(
        name=(t.client_name or "").split(" ")[0], question=QUESTION.format(title=t.title), folio=t.folio,
        link=f"{config.APP_URL}/encuesta/{token}", days=VALID_DAYS)
    mailer.send(t.client_email, f"¿Cómo te atendimos? ({t.folio})", mailer.render(body))
    return token


def on_ticket_changed(e: tickets.TicketChanged) -> None:
    # RF-06.1: solo cierres como Resuelto, aceptados o directos.
    if e.data.get("outcome") == "resuelto" and e.kind in ("accepted", "closed"):
        with SessionLocal() as db:
            send(db, e.ticket_id)


def _find(db: Session, token: str) -> Survey:
    s = db.scalar(select(Survey).where(Survey.token_hash == _hash(token)))
    if not s:
        raise NotFound
    return s


def status(db: Session, token: str) -> SurveyStatus:
    s = _find(db, token)
    t = tickets.summary(db, s.ticket_id)
    state = "answered" if s.rating else "expired" if _utc(s.expires_at) < now() else "pending"
    return SurveyStatus(state=state, folio=t.folio, title=t.title, question=QUESTION.format(title=t.title),
                        rating=s.rating, has_comment=bool(s.comment))


def rate(db: Session, token: str, rating: int) -> SurveyStatus:
    s = _find(db, token)
    if s.rating:
        raise Conflict("Esta encuesta ya fue respondida.")
    if _utc(s.expires_at) < now():
        raise Conflict("Esta encuesta venció.")
    s.rating, s.answered_at = rating, now()
    db.commit()
    publish(SurveyAnswered(ticket_id=s.ticket_id, rating=rating))
    return status(db, token)


def comment(db: Session, token: str, text: str) -> SurveyStatus:
    s = _find(db, token)
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
                     answered_at=s.answered_at) if s else None


def register() -> None:
    subscribe(tickets.TicketChanged, on_ticket_changed)
