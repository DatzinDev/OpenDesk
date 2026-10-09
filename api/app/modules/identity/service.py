import hashlib
import secrets
from datetime import timedelta

from sqlalchemy import delete
from sqlalchemy.orm import Session as DB

from app.core.db import SessionLocal, now
from app.modules import users
from app.modules.identity.events import LoginDenied, LoginSucceeded
from app.modules.identity.models import Session
from app.shared.events import publish, subscribe

SESSION_DAYS = 7


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def login(db: DB, email: str, name: str | None, picture: str | None) -> str | None:
    """Devuelve un token de sesión, o None si el correo no tiene acceso."""
    user = users.get_by_email(db, email)
    if not user or not user.is_active:
        publish(LoginDenied(email=email.lower(), reason="no registrado" if not user else "inactivo"))
        return None
    users.record_login(db, user.id, name, picture)
    token = secrets.token_urlsafe(32)
    db.execute(delete(Session).where(Session.expires_at < now()))
    db.add(Session(token_hash=_hash(token), user_id=user.id, expires_at=now() + timedelta(days=SESSION_DAYS)))
    db.commit()
    publish(LoginSucceeded(user_id=user.id, email=user.email))
    return token


def resolve(db: DB, token: str) -> users.UserOut | None:
    s = db.get(Session, _hash(token))
    if not s or s.expires_at < now():
        return None
    user = users.get(db, s.user_id)
    return user if user and user.is_active else None


def logout(db: DB, token: str) -> None:
    db.execute(delete(Session).where(Session.token_hash == _hash(token)))
    db.commit()


def _revoke_on_access_change(e: users.UserUpdated) -> None:
    """Un cambio de correo o una desactivación cierra las sesiones abiertas de esa cuenta."""
    if "email" in e.changes or e.changes.get("is_active", [None, True])[1] is False:
        with SessionLocal() as db:
            db.execute(delete(Session).where(Session.user_id == e.user_id))
            db.commit()


def register() -> None:
    subscribe(users.UserUpdated, _revoke_on_access_change)
