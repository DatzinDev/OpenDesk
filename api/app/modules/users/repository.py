from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.users.models import User


def get(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def get_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower()))


def list_(db: Session, exclude_admins: bool) -> list[User]:
    q = select(User).order_by(User.is_active.desc(), User.name)
    if exclude_admins:
        q = q.where(User.role != "admin")
    return list(db.scalars(q))


def highest_level(db: Session, area_id: int) -> int:
    q = select(func.max(User.level)).where(User.area_id == area_id, User.is_active)
    return db.scalar(q) or 0


def active_in_area(db: Session, area_id: int) -> list[User]:
    q = select(User).where(User.area_id == area_id, User.role == "usuario", User.is_active).order_by(User.level, User.name)
    return list(db.scalars(q))


def by_ids(db: Session, ids) -> list[User]:
    return list(db.scalars(select(User).where(User.id.in_(ids))))


def add(db: Session, user: User) -> User:
    db.add(user)
    db.flush()
    return user
