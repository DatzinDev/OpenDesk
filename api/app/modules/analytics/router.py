import csv
import io
from datetime import date, datetime, timedelta
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules import areas, identity, settings, users
from app.modules.analytics import service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])
Priority = Literal["alta", "media", "baja"]


def _filters(db: Session, start: date | None, end: date | None, area_id: UUID | None, priority: str | None,
             user_id: int | None = None) -> service.Filters:
    end = end or datetime.now(settings.tz(db)).date()
    start = start or end - timedelta(days=29)
    if start > end or (end - start).days > 366:
        raise HTTPException(422, "El rango de fechas debe ser válido y de máximo un año.")
    area = areas.id_of(db, area_id)
    if area_id and not area:
        raise HTTPException(404, "Área no encontrada.")
    return service.Filters.from_dates(start, end, settings.tz(db), area_id=area, priority=priority, user_id=user_id)


@router.get("/export.csv")
def export(start: date | None = None, end: date | None = None, area_id: UUID | None = None,
           priority: Priority | None = None, actor: users.UserOut = Depends(identity.require_roles("admin", "gestor")),
           db: Session = Depends(get_db)):
    f = _filters(db, start, end, area_id, priority)
    buf = io.StringIO()
    buf.write("﻿")  # BOM: Excel abre el CSV con acentos correctos
    csv.writer(buf).writerows(service.export_rows(db, f))
    name = f"opendesk-tickets-{f.start.date()}-{(f.end - timedelta(days=1)).date()}.csv"
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv; charset=utf-8",
                             headers={"Content-Disposition": f'attachment; filename="{name}"'})


@router.get("/{tab}")
def report(tab: Literal[service.TABS], start: date | None = None, end: date | None = None,
           area_id: UUID | None = None, priority: Priority | None = None,
           actor: users.UserOut = Depends(identity.current_user), db: Session = Depends(get_db)):
    staff = actor.role in ("admin", "gestor")
    if tab != "me" and not staff:
        raise HTTPException(403, "No tienes permiso para esta vista.")
    if tab == "me" and actor.role != "usuario":
        raise HTTPException(403, "Esta vista es para personas que atienden tickets.")
    f = _filters(db, start, end, area_id, priority, actor.id if tab == "me" else None)
    return service.report(db, tab, f)
