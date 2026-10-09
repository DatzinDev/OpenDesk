from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, now


class Area(Base):
    __tablename__ = "areas_areas"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    description: Mapped[str] = mapped_column(String(240), default="")
    sla_hours: Mapped[int] = mapped_column(Integer, default=24)
    always_open: Mapped[bool] = mapped_column(Boolean, default=True)
    # 7 entradas (0 = lunes): ["09:00", "18:00"] o null si ese día no se atiende.
    week: Mapped[list] = mapped_column(JSON, default=lambda: [["09:00", "18:00"]] * 5 + [None, None])
    pause_on_holidays: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Holiday(Base):
    __tablename__ = "areas_holidays"

    day: Mapped[date] = mapped_column(Date, primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
