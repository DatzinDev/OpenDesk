from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.modules import areas, identity, settings, surveys, tickets, users
from app.modules.audit.models import AuditEntry
from app.shared.events import subscribe
from app.shared.mailer import MailFailed


def record(action: str, actor_id=None, entity=None, entity_id=None, data=None) -> None:
    with SessionLocal() as db:
        db.add(AuditEntry(action=action, actor_id=actor_id, entity=entity,
                          entity_id=str(entity_id) if entity_id is not None else None, data=data or {}))
        db.commit()


def register() -> None:
    subscribe(users.UserCreated, lambda e: record(
        "user.created", e.actor_id, "user", e.user_id, {"email": e.email, "role": e.role}))
    subscribe(users.UserUpdated, lambda e: record(
        "user.updated", e.actor_id, "user", e.user_id, {"email": e.email, "changes": e.changes}))
    subscribe(identity.LoginSucceeded, lambda e: record("login.succeeded", e.user_id, "user", e.user_id))
    subscribe(identity.LoginDenied, lambda e: record("login.denied", data={"email": e.email, "reason": e.reason}))
    subscribe(areas.AreaSaved, lambda e: record(
        "area.created" if e.created else "area.updated", e.actor_id, "area", e.area_id, {"name": e.name, "changes": e.changes}))
    subscribe(areas.HolidaysChanged, lambda e: record(
        "holiday.removed" if e.removed else "holiday.added", e.actor_id, "holiday", e.day, {"name": e.name}))
    subscribe(tickets.TicketChanged, lambda e: record(f"ticket.{e.kind}", e.actor_id, "ticket", e.ticket_id, e.data))
    subscribe(surveys.SurveyAnswered, lambda e: record("survey.answered", None, "ticket", e.ticket_id, {"rating": e.rating}))
    subscribe(settings.SettingsChanged, lambda e: record("settings.changed", e.actor_id, "settings", None, e.changes))
    subscribe(MailFailed, lambda e: record("mail.failed", data={"to": e.to, "subject": e.subject, "error": e.error}))


# --- Consulta (08): solo Admin, solo lectura ------------------------------------------------------

USER_KEYS = ("from", "to", "user_id", "proposer_id")


def _readable(data: dict, people: dict, area_names: dict) -> dict:
    """Sustituye ids internos por nombres: el registro se muestra, nunca expone ids enteros."""
    out = {}
    for k, v in (data or {}).items():
        if k in USER_KEYS and isinstance(v, int):
            out[k] = people.get(v, (None, "Persona eliminada"))[1]
        elif k == "area_id" and isinstance(v, int):
            out[k] = area_names.get(v, "Área eliminada")
        else:
            out[k] = v
    return out


def entries(db: Session, actor_uuid=None, action: str | None = None, start=None, end=None, before=None,
            limit: int = 100) -> dict:
    q = select(AuditEntry).order_by(AuditEntry.id.desc()).limit(limit + 1)
    if actor_uuid:
        q = q.where(AuditEntry.actor_id == (users.id_of(db, actor_uuid) or 0))
    if action:
        q = q.where(AuditEntry.action.startswith(action))
    if start:
        q = q.where(AuditEntry.at >= start)
    if end:
        q = q.where(AuditEntry.at < end)
    if before:
        pivot = db.scalar(select(AuditEntry.id).where(AuditEntry.uuid == before))
        q = q.where(AuditEntry.id < (pivot or 0))
    rows = list(db.scalars(q))
    more, rows = len(rows) > limit, rows[:limit]
    ids = {r.actor_id for r in rows}
    ids |= {int(r.entity_id) for r in rows if r.entity == "user" and (r.entity_id or "").isdigit()}
    ids |= {v for r in rows for k, v in (r.data or {}).items() if k in USER_KEYS and isinstance(v, int)}
    people = users.public_refs(db, ids)
    ticket_ids = {int(r.entity_id) for r in rows if r.entity == "ticket" and (r.entity_id or "").isdigit()}
    tickets_pub = tickets.public_ids(db, ticket_ids)
    area_names = {a.id: a.name for a in areas.list_all(db)}
    items = []
    for r in rows:
        ref, link = r.entity_id, None
        if r.entity == "ticket" and r.entity_id and r.entity_id.isdigit():
            ref, link = f"OD-{int(r.entity_id):06d}", tickets_pub.get(int(r.entity_id))
        elif r.entity == "user" and r.entity_id and r.entity_id.isdigit():
            ref = people.get(int(r.entity_id), (None, "Persona eliminada"))[1]
        elif r.entity == "area" and r.entity_id and r.entity_id.isdigit():
            ref = area_names.get(int(r.entity_id), "Área eliminada")
        items.append({
            "id": r.uuid, "at": r.at, "action": r.action, "entity": r.entity, "ref": ref, "ticket_id": link,
            "actor": people[r.actor_id][1] if r.actor_id in people else None,
            "data": _readable(r.data, people, area_names),
        })
    return {"items": items, "more": more}
