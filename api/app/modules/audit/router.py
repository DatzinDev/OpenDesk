from datetime import date, datetime, time, timedelta
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules import identity, settings, users
from app.modules.audit import service

router = APIRouter(prefix="/api/audit", tags=["audit"])


class Entry(BaseModel):
    id: UUID
    at: datetime
    action: str
    entity: str | None
    ref: str | None
    ticket_id: UUID | None
    actor: str | None
    data: dict[str, Any]


class Page(BaseModel):
    items: list[Entry]
    more: bool


@router.get("", response_model=Page)
def entries(actor_id: UUID | None = None, action: str | None = None, start: date | None = None, end: date | None = None,
            before: UUID | None = None, _: users.UserOut = Depends(identity.require_roles("admin")),
            db: Session = Depends(get_db)):
    tz = settings.tz(db)
    a = datetime.combine(start, time.min, tz) if start else None
    b = datetime.combine(end + timedelta(days=1), time.min, tz) if end else None
    return service.entries(db, actor_id, action, a, b, before)
