from app.core.db import SessionLocal
from app.modules import areas, identity, users
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
    subscribe(MailFailed, lambda e: record("mail.failed", data={"to": e.to, "subject": e.subject, "error": e.error}))
