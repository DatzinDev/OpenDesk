from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.modules.tickets.models import Attachment, Event, Ticket, TrackingStatus

OPEN = ("asignado", "pendiente", "seguimiento")


def get(db: Session, ticket_id: int) -> Ticket | None:
    return db.get(Ticket, ticket_id)


def by_uuid(db: Session, model, public_id):
    return db.scalar(select(model).where(model.uuid == public_id)) if public_id else None


def public_ids(db: Session, model, ids) -> dict:
    ids = set(ids) - {None}
    return dict(db.execute(select(model.id, model.uuid).where(model.id.in_(ids))).all()) if ids else {}


def add(db: Session, obj):
    db.add(obj)
    db.flush()
    return obj


def list_(db: Session, *, assignee_id=None, area_id=None, status=None, q=None) -> list[Ticket]:
    query = select(Ticket).order_by(Ticket.status == "cerrado", Ticket.due_at)
    if assignee_id:
        query = query.where(Ticket.assignee_id == assignee_id)
    if area_id:
        query = query.where(Ticket.area_id == area_id)
    if status == "abiertos":
        query = query.where(Ticket.status.in_(OPEN))
    elif status:
        query = query.where(Ticket.status == status)
    if q:
        digits = "".join(c for c in q if c.isdigit())
        cond = Ticket.title.ilike(f"%{q}%")
        query = query.where(or_(cond, Ticket.id == int(digits)) if digits else cond)
    # ponytail: sin paginación; agregarla cuando la bandeja supere unos miles de tickets.
    return list(db.scalars(query))


def statuses(db: Session) -> list[TrackingStatus]:
    return list(db.scalars(select(TrackingStatus).order_by(TrackingStatus.is_active.desc(), TrackingStatus.name)))


def status_by_name(db: Session, name: str) -> TrackingStatus | None:
    return db.scalar(select(TrackingStatus).where(TrackingStatus.name.ilike(name)))


def open_tickets(db: Session) -> list[Ticket]:
    return list(db.scalars(select(Ticket).where(Ticket.status.in_(OPEN))))


def pending(db: Session, ticket_id: int) -> Event | None:
    return db.scalar(select(Event).where(Event.ticket_id == ticket_id, Event.state == "pending"))


def pending_by_ticket(db: Session, ticket_ids) -> dict[int, Event]:
    q = select(Event).where(Event.ticket_id.in_(ticket_ids), Event.state == "pending")
    return {e.ticket_id: e for e in db.scalars(q)}


def events(db: Session, ticket_id: int) -> list[Event]:
    return list(db.scalars(select(Event).where(Event.ticket_id == ticket_id).order_by(Event.created_at, Event.id)))


def attachments(db: Session, ticket_id: int) -> list[Attachment]:
    return list(db.scalars(select(Attachment).where(Attachment.ticket_id == ticket_id).order_by(Attachment.id)))


def get_attachment(db: Session, attachment_id: int) -> Attachment | None:
    return db.get(Attachment, attachment_id)


def open_counts(db: Session, user_ids) -> dict[int, int]:
    q = (select(Ticket.assignee_id, func.count()).where(Ticket.assignee_id.in_(user_ids), Ticket.status.in_(OPEN))
         .group_by(Ticket.assignee_id))
    return dict(db.execute(q).all())
