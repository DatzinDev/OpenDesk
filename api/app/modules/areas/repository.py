from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.areas.models import Area, Holiday


def get(db: Session, area_id: int) -> Area | None:
    return db.get(Area, area_id)


def id_of(db: Session, public_id) -> int | None:
    return db.scalar(select(Area.id).where(Area.uuid == public_id))


def public_ids(db: Session) -> dict[int, object]:
    return dict(db.execute(select(Area.id, Area.uuid)).all())


def get_by_name(db: Session, name: str) -> Area | None:
    return db.scalar(select(Area).where(Area.name.ilike(name)))


def list_(db: Session) -> list[Area]:
    return list(db.scalars(select(Area).order_by(Area.is_active.desc(), Area.name)))


def add(db: Session, obj):
    db.add(obj)
    db.flush()
    return obj


def holidays(db: Session) -> list[Holiday]:
    return list(db.scalars(select(Holiday).order_by(Holiday.day)))


def get_holiday(db: Session, day) -> Holiday | None:
    return db.get(Holiday, day)
