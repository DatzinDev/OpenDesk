from sqlalchemy import select
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


def in_area_above_level(db: Session, area_id: int, level: int) -> list[User]:
    return list(db.scalars(select(User).where(User.area_id == area_id, User.level > level)))


def add(db: Session, user: User) -> User:
    db.add(user)
    db.flush()
    return user
