from datetime import date, datetime, time

from sqlalchemy import Boolean, Date, DateTime, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, now


class Area(Base):
    __tablename__ = "areas_areas"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    description: Mapped[str] = mapped_column(String(240), default="")
    sla_hours: Mapped[int] = mapped_column(Integer, default=24)
    always_open: Mapped[bool] = mapped_column(Boolean, default=True)
    days: Mapped[str] = mapped_column(String(13), default="0,1,2,3,4")  # días de la semana, 0 = lunes
    start_time: Mapped[time] = mapped_column(Time, default=time(9))
    end_time: Mapped[time] = mapped_column(Time, default=time(18))
    pause_on_holidays: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Holiday(Base):
    __tablename__ = "areas_holidays"

    day: Mapped[date] = mapped_column(Date, primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
