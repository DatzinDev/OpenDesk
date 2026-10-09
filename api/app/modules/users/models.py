from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, PublicId, now


class User(PublicId, Base):
    __tablename__ = "users_users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    picture: Mapped[str | None] = mapped_column(String(500))
    role: Mapped[str] = mapped_column(String(10))  # admin | gestor | usuario
    area_id: Mapped[int | None] = mapped_column(ForeignKey("areas_areas.id"), index=True)  # solo rol usuario
    level: Mapped[int | None] = mapped_column(Integer)  # nivel de escalamiento dentro del área; 1 = primer contacto
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_root: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
