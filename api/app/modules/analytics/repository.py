"""Lecturas para reportes. Excepción documentada: este módulo consulta tablas de otros módulos, solo con SELECT
y sin importar sus modelos. Las tablas se declaran aquí de forma ligera para tipar fechas y JSON."""
import json

from sqlalchemy import JSON, Boolean, DateTime, Integer, String, and_, column, or_, select, table
from sqlalchemy.orm import Session

TS = DateTime(timezone=True)
tickets = table(
    "tickets_tickets", column("id", Integer), column("title", String), column("area_id", Integer),
    column("assignee_id", Integer), column("priority", String), column("status", String), column("outcome", String),
    column("client_name", String), column("client_email", String), column("created_at", TS), column("closed_at", TS),
    column("due_from", TS), column("due_at", TS), column("committed", Boolean), column("needs_manager", Boolean),
    column("status_id", Integer), column("custom_values", JSON),
)
events = table(
    "tickets_events", column("ticket_id", Integer), column("kind", String), column("actor_id", Integer),
    column("created_at", TS), column("state", String), column("data", JSON),
)
surveys = table(
    "surveys_surveys", column("ticket_id", Integer), column("sent_at", TS), column("rating", Integer),
    column("comment", String), column("answered_at", TS),
)
users = table("users_users", column("id", Integer), column("name", String), column("role", String),
              column("area_id", Integer), column("level", Integer), column("is_active", Boolean))
areas = table("areas_areas", column("id", Integer), column("name", String))
statuses = table("tickets_statuses", column("id", Integer), column("name", String))


def load(db: Session, since, until, area_id=None, priority=None, user_id=None) -> dict:
    """Tickets vivos en el intervalo (abiertos o cerrados después de `since`) con sus eventos y encuestas."""
    # ponytail: agrega en Python; con cientos de miles de tickets conviene mover los cálculos a SQL o a vistas.
    q = select(tickets).where(tickets.c.created_at < until,
                              or_(tickets.c.closed_at.is_(None), tickets.c.closed_at >= since))
    if area_id:
        q = q.where(tickets.c.area_id == area_id)
    if priority:
        q = q.where(tickets.c.priority == priority)
    if user_id:
        q = q.where(tickets.c.assignee_id == user_id)
    rows = [dict(r._mapping) for r in db.execute(q)]
    ids = [r["id"] for r in rows]
    ev = [dict(r._mapping) for r in db.execute(select(events).where(and_(events.c.ticket_id.in_(ids)),
                                                                     events.c.created_at < until))] if ids else []
    for e in ev:
        e["data"] = json.loads(e["data"]) if isinstance(e["data"], str) else (e["data"] or {})
    sv = [dict(r._mapping) for r in db.execute(select(surveys).where(surveys.c.ticket_id.in_(ids)))] if ids else []
    return {"tickets": rows, "events": ev, "surveys": sv}


def names(db: Session) -> dict:
    return {
        "users": {r.id: dict(r._mapping) for r in db.execute(select(users))},
        "areas": {r.id: r.name for r in db.execute(select(areas))},
        "statuses": {r.id: r.name for r in db.execute(select(statuses))},
    }
