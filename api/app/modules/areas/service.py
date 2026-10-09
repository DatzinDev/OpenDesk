from datetime import date, datetime, time
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.core import config
from app.modules.areas import repository as repo
from app.modules.areas import sla
from app.modules.areas.events import AreaSaved, HolidaysChanged
from app.modules.areas.models import Area, Holiday
from app.modules.areas.schemas import AreaIn, AreaOut, HolidayIn, HolidayOut
from app.shared.events import publish


class Conflict(Exception):
    pass


class NotFound(Exception):
    pass


def _row(data: AreaIn) -> dict:
    d = data.model_dump()
    d["week"] = [[w[0].strftime("%H:%M"), w[1].strftime("%H:%M")] if w else None for w in data.week]
    d["name"] = d["name"].strip()
    return d


def get(db: Session, area_id: int) -> AreaOut | None:
    area = repo.get(db, area_id)
    return AreaOut.model_validate(area) if area else None


def list_areas(db: Session) -> list[AreaOut]:
    return [AreaOut.model_validate(a) for a in repo.list_(db)]


def id_of(db: Session, public_id: UUID | None) -> int | None:
    """id interno a partir del UUID público (None si no existe)."""
    return repo.id_of(db, public_id) if public_id else None


def public_ids(db: Session) -> dict[int, UUID]:
    """Mapa id interno → UUID público de todas las áreas."""
    return repo.public_ids(db)


def save_area(db: Session, actor_id: int, data: AreaIn, area_id: int | None = None) -> AreaOut:
    row = _row(data)
    same_name = repo.get_by_name(db, row["name"])
    if same_name and same_name.id != area_id:
        raise Conflict("Ya existe un área con ese nombre.")
    if area_id is None:
        area = repo.add(db, Area(**row))
        changes = {}
    else:
        area = repo.get(db, area_id)
        if not area:
            raise NotFound
        if row["levels"] < area.levels:
            from app.modules import users  # importación diferida: users depende de areas

            occupied = users.highest_level_in_area(db, area.id)
            if row["levels"] < occupied:
                raise Conflict(f"Hay personas en el nivel {occupied}. Muévelas a un nivel inferior antes de reducir los niveles.")
        changes = {k: [str(getattr(area, k)), str(v)] for k, v in row.items() if getattr(area, k) != v}
        for k, v in row.items():
            setattr(area, k, v)
    db.commit()
    if area_id is None or changes:
        publish(AreaSaved(actor_id=actor_id, area_id=area.id, name=area.name, created=area_id is None, changes=changes))
    return AreaOut.model_validate(area)


def list_holidays(db: Session) -> list[HolidayOut]:
    return [HolidayOut.model_validate(h) for h in repo.holidays(db)]


def add_holiday(db: Session, actor_id: int, data: HolidayIn) -> HolidayOut:
    if repo.get_holiday(db, data.day):
        raise Conflict("Esa fecha ya está registrada como día festivo.")
    h = repo.add(db, Holiday(day=data.day, name=data.name.strip()))
    db.commit()
    publish(HolidaysChanged(actor_id=actor_id, day=h.day.isoformat(), name=h.name, removed=False))
    return HolidayOut.model_validate(h)


def remove_holiday(db: Session, actor_id: int, day: date) -> None:
    h = repo.get_holiday(db, day)
    if not h:
        raise NotFound
    db.delete(h)
    db.commit()
    publish(HolidaysChanged(actor_id=actor_id, day=day.isoformat(), name=h.name, removed=True))


def sla_deadline(db: Session, area_id: int, start: datetime) -> datetime:
    """Vencimiento del SLA de primera respuesta para un ticket asignado en `start`."""
    area = repo.get(db, area_id)
    schedule = sla.Schedule(
        always_open=area.always_open,
        week=tuple((time.fromisoformat(w[0]), time.fromisoformat(w[1])) if w else None for w in area.week),
        holidays=frozenset(h.day for h in repo.holidays(db)) if area.pause_on_holidays else frozenset(),
    )
    return sla.deadline(start, area.sla_hours, schedule, ZoneInfo(config.APP_TIMEZONE))
