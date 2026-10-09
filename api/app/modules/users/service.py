from sqlalchemy.orm import Session

from app.core.db import SessionLocal, now
from app.modules import areas
from app.modules.users import repository as repo
from app.modules.users.events import UserCreated, UserUpdated
from app.modules.users.models import User
from app.modules.users.schemas import UserCreate, UserOut, UserUpdate
from app.shared.events import publish, subscribe


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


def _placement(db: Session, role: str, area_id: int | None, level: int | None) -> tuple[int | None, int | None]:
    """Área y nivel de escalamiento: solo el rol Usuario los tiene, y son obligatorios."""
    if role != "usuario":
        return None, None
    area = areas.get(db, area_id) if area_id else None
    if not area or not area.is_active:
        raise Conflict("Selecciona un área activa para esta persona.")
    level = level or 1
    if not 1 <= level <= area.levels:
        raise Conflict(f"{area.name} tiene {area.levels} nivel(es) de escalamiento.")
    return area.id, level


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
    area_id, level = _placement(db, data.role, data.area_id, data.level)
    user = repo.add(db, User(email=email, name=data.name.strip(), role=data.role, area_id=area_id, level=level))
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

    if data.email:
        data.email = data.email.lower()
        other = repo.get_by_email(db, data.email)
        if other and other.id != user.id:
            raise Conflict("Ya existe un usuario con ese correo.")

    new_role = data.role or user.role
    new_area = data.area_id or user.area_id
    # Al cambiar de área, la persona entra al nivel 1 salvo que se indique otro.
    new_level = data.level or (user.level if new_area == user.area_id else None)
    data.area_id, data.level = _placement(db, new_role, new_area, new_level)

    changes = {}
    for field in ("area_id", "level"):
        if getattr(data, field) != getattr(user, field):
            changes[field] = [getattr(user, field), getattr(data, field)]
            setattr(user, field, getattr(data, field))
    for field, value in data.model_dump(exclude_none=True, exclude={"area_id", "level"}).items():
        if getattr(user, field) != value:
            changes[field] = [getattr(user, field), value]
            setattr(user, field, value)
    if changes:
        if "email" in changes:
            user.picture = None  # la foto pertenecía a la cuenta de Google anterior
        db.commit()
        publish(UserUpdated(actor_id=actor.id, user_id=user.id, email=user.email, name=user.name, role=user.role, changes=changes))
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


def _clamp_levels(e: areas.AreaSaved) -> None:
    """Si un área reduce sus niveles, quien quede fuera pasa al nivel más alto disponible."""
    if "levels" not in e.changes:
        return
    with SessionLocal() as db:
        top = int(e.changes["levels"][1])
        for user in repo.in_area_above_level(db, e.area_id, top):
            user.level = top
        db.commit()


def register() -> None:
    subscribe(areas.AreaSaved, _clamp_levels)
