from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules import identity, users
from app.modules.areas import service
from app.modules.areas.schemas import AreaIn, AreaPublic, HolidayIn, HolidayOut

router = APIRouter(prefix="/api", tags=["areas"])
staff = identity.require_roles("admin", "gestor")


def _call(fn, *args):
    try:
        return fn(*args)
    except service.Conflict as e:
        raise HTTPException(409, str(e))
    except service.NotFound:
        raise HTTPException(404, "No encontrado.")


@router.get("/areas", response_model=list[AreaPublic])
def list_areas(_: users.UserOut = Depends(identity.current_user), db: Session = Depends(get_db)):
    return service.list_areas(db)


@router.post("/areas", response_model=AreaPublic, status_code=201)
def create_area(data: AreaIn, actor: users.UserOut = Depends(staff), db: Session = Depends(get_db)):
    return _call(service.save_area, db, actor.id, data)


@router.put("/areas/{area_id}", response_model=AreaPublic)
def update_area(area_id: UUID, data: AreaIn, actor: users.UserOut = Depends(staff), db: Session = Depends(get_db)):
    return _call(service.save_area, db, actor.id, data, service.id_of(db, area_id) or 0)


@router.get("/holidays", response_model=list[HolidayOut])
def list_holidays(_: users.UserOut = Depends(staff), db: Session = Depends(get_db)):
    return service.list_holidays(db)


@router.post("/holidays", response_model=HolidayOut, status_code=201)
def add_holiday(data: HolidayIn, actor: users.UserOut = Depends(staff), db: Session = Depends(get_db)):
    return _call(service.add_holiday, db, actor.id, data)


@router.delete("/holidays/{day}", status_code=204)
def remove_holiday(day: date, actor: users.UserOut = Depends(staff), db: Session = Depends(get_db)):
    _call(service.remove_holiday, db, actor.id, day)
