from sqlalchemy.orm import Session

from app.core.db import now
from app.modules.users import repository as repo
from app.modules.users.events import UserCreated, UserUpdated
from app.modules.users.models import User
from app.modules.users.schemas import UserCreate, UserOut, UserUpdate
from app.shared.events import publish


class Forbidden(Exception):
    pass


class Conflict(Exception):
    pass


class NotFound(Exception):
    pass


def _can_manage(actor: UserOut, target_role: str) -> bool:
    if actor.role == "admin":
        return True
    return actor.role == "gestor" and target_role != "admin"


def get(db: Session, user_id: int) -> UserOut | None:
    user = repo.get(db, user_id)
    return UserOut.model_validate(user) if user else None


def get_by_email(db: Session, email: str) -> UserOut | None:
    user = repo.get_by_email(db, email)
    return UserOut.model_validate(user) if user else None


def list_users(db: Session, actor: UserOut) -> list[UserOut]:
    if actor.role not in ("admin", "gestor"):
        raise Forbidden
    return [UserOut.model_validate(u) for u in repo.list_(db, exclude_admins=actor.role != "admin")]


def create_user(db: Session, actor: UserOut, data: UserCreate) -> UserOut:
    if not _can_manage(actor, data.role):
        raise Forbidden
    email = data.email.lower()
    if repo.get_by_email(db, email):
        raise Conflict("Ya existe un usuario con ese correo.")
    user = repo.add(db, User(email=email, name=data.name.strip(), role=data.role))
    db.commit()
    publish(UserCreated(actor_id=actor.id, user_id=user.id, email=email, name=user.name, role=user.role))
    return UserOut.model_validate(user)


def update_user(db: Session, actor: UserOut, user_id: int, data: UserUpdate) -> UserOut:
    user = repo.get(db, user_id)
    if not user:
        raise NotFound
    if user.is_root:
        raise Forbidden("El Admin principal no se puede modificar.")
    if not _can_manage(actor, user.role) or (data.role and not _can_manage(actor, data.role)):
        raise Forbidden
    if user.id == actor.id and (data.is_active is False or data.role not in (None, user.role)):
        raise Forbidden("No puedes desactivar ni cambiar el rol de tu propia cuenta.")

    changes = {}
    for field, value in data.model_dump(exclude_none=True).items():
        if getattr(user, field) != value:
            changes[field] = [getattr(user, field), value]
            setattr(user, field, value)
    if changes:
        db.commit()
        publish(UserUpdated(actor_id=actor.id, user_id=user.id, email=user.email, name=user.name, changes=changes))
    return UserOut.model_validate(user)


def record_login(db: Session, user_id: int, name: str | None, picture: str | None) -> None:
    user = repo.get(db, user_id)
    user.last_login_at = now()
    if name:
        user.name = name[:120]
    user.picture = picture
    db.commit()


def ensure_root(db: Session, email: str) -> None:
    """Crea o restablece el Admin principal definido en ADMIN_EMAIL."""
    if not email:
        return
    user = repo.get_by_email(db, email) or repo.add(db, User(email=email, name=email.split("@")[0], role="admin"))
    user.role, user.is_active, user.is_root = "admin", True, True
    for other in repo.list_(db, exclude_admins=False):
        if other.is_root and other.id != user.id:
            other.is_root = False
    db.commit()
