from sqlalchemy.orm import Session

from app.core.db import now
from app.modules import areas
from app.modules.users import repository as repo
from app.modules.users.events import UserCreated, UserUpdated
from app.modules.users.models import User
from app.modules.users.schemas import ManagerUpdate, UserCreate, UserOut, UserUpdate
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


def _check_area(db: Session, role: str, area_id: int | None) -> int | None:
    """Solo el rol Usuario pertenece a un área, y es obligatoria."""
    if role != "usuario":
        return None
    area = areas.get(db, area_id) if area_id else None
    if not area or not area.is_active:
        raise Conflict("Selecciona un área activa para esta persona.")
    return area.id


def _detach(db: Session, user: User) -> None:
    """Quita el responsable de `user` y libera a quienes lo tenían como responsable."""
    user.manager_id = None
    for sub in repo.subordinates(db, user.id):
        sub.manager_id = None


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
    area_id = _check_area(db, data.role, data.area_id)
    user = repo.add(db, User(email=email, name=data.name.strip(), role=data.role, area_id=area_id))
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
    data.area_id = _check_area(db, new_role, data.area_id or user.area_id)
    if data.is_active is False and user.is_active:
        active_subs = [s for s in repo.subordinates(db, user.id) if s.is_active]
        if active_subs:
            raise Conflict(f"Tiene {len(active_subs)} persona(s) a cargo. Asígnales otro responsable antes de desactivarla.")

    changes = {}
    if data.area_id != user.area_id:
        changes["area_id"] = [user.area_id, data.area_id]
        user.area_id = data.area_id
        _detach(db, user)
    for field, value in data.model_dump(exclude_none=True, exclude={"area_id"}).items():
        if getattr(user, field) != value:
            changes[field] = [getattr(user, field), value]
            setattr(user, field, value)
    if changes:
        if "email" in changes:
            user.picture = None  # la foto pertenecía a la cuenta de Google anterior
        db.commit()
        publish(UserUpdated(actor_id=actor.id, user_id=user.id, email=user.email, name=user.name, role=user.role, changes=changes))
    return UserOut.model_validate(user)


def set_manager(db: Session, actor: UserOut, user_id: int, data: ManagerUpdate) -> UserOut:
    if actor.role not in ("admin", "gestor"):
        raise Forbidden
    user = repo.get(db, user_id)
    if not user:
        raise NotFound
    if user.role != "usuario":
        raise Conflict("Solo las personas con rol Usuario tienen responsable directo.")
    if data.manager_id is not None:
        manager = repo.get(db, data.manager_id)
        if not manager or manager.id == user.id or manager.role != "usuario" or not manager.is_active:
            raise Conflict("El responsable debe ser otro Usuario activo.")
        if manager.area_id != user.area_id:
            raise Conflict("El responsable debe pertenecer a la misma área.")
        node = manager
        while node.manager_id:  # un ciclo existiría si la cadena del responsable llega a este usuario
            if node.manager_id == user.id:
                raise Conflict(f"{manager.name} ya depende de {user.name}; se formaría un ciclo.")
            node = repo.get(db, node.manager_id)
    if user.manager_id != data.manager_id:
        changes = {"manager_id": [user.manager_id, data.manager_id]}
        user.manager_id = data.manager_id
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
