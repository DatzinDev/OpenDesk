from sqlalchemy import func, or_, select, union_all
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


def _filtered(*, assignee_id=None, area_id=None, status=None, q=None, priority=None):
    query = select(Ticket)
    if assignee_id:
        query = query.where(Ticket.assignee_id == assignee_id)
    if area_id:
        query = query.where(Ticket.area_id == area_id)
    if status == "abiertos":
        query = query.where(Ticket.status.in_(OPEN))
    elif status:
        query = query.where(Ticket.status == status)
    if priority:
        query = query.where(Ticket.priority == priority)
    if q:
        digits = "".join(c for c in q if c.isdigit())
        cond = or_(Ticket.title.ilike(f"%{q}%"), Ticket.client_name.ilike(f"%{q}%"), Ticket.client_email.ilike(f"%{q}%"))
        query = query.where(or_(cond, Ticket.id == int(digits)) if digits else cond)
    return query


def list_(db: Session, limit: int | None = None, offset: int = 0, **filters) -> list[Ticket]:
    query = _filtered(**filters).order_by(Ticket.status == "cerrado", Ticket.due_at, Ticket.id)
    if limit:
        query = query.limit(limit).offset(offset)
    return list(db.scalars(query))


def count(db: Session, **filters) -> int:
    return db.scalar(select(func.count()).select_from(_filtered(**filters).subquery()))


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


def latest_activity(db: Session, ticket_ids) -> dict:
    if not ticket_ids:
        return {}
    events = union_all(select(Event.ticket_id, Event.created_at.label("at")).where(Event.ticket_id.in_(ticket_ids)),
                       select(Event.ticket_id, Event.decided_at.label("at")).where(Event.ticket_id.in_(ticket_ids), Event.decided_at.is_not(None))).subquery()
    result = dict(db.execute(select(events.c.ticket_id, func.max(events.c.at)).group_by(events.c.ticket_id)).all())
    # Las decisiones anteriores no tenían fecha en el evento; su auditoría sí la conserva.
    from app.modules import audit
    for id, at in audit.ticket_activity(db, ticket_ids).items():
        if id not in result or (at.replace(tzinfo=None) > result[id].replace(tzinfo=None)):
            result[id] = at
    return result
