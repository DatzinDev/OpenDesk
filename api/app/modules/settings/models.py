from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, now


class Param(Base):
    """Parámetro global editable desde la aplicación (08). La configuración técnica sensible vive en `.env`."""
    __tablename__ = "settings_params"

    key: Mapped[str] = mapped_column(String(40), primary_key=True)
    value: Mapped[object] = mapped_column(JSON)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)
    updated_by: Mapped[int | None] = mapped_column(ForeignKey("users_users.id"))
