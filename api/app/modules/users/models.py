from datetime import datetime

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, now


class User(Base):
    __tablename__ = "users_users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    picture: Mapped[str | None] = mapped_column(String(500))
    role: Mapped[str] = mapped_column(String(10))  # admin | gestor | usuario
    # area_id y manager_id se agregan con los módulos de áreas y matriz de responsables.
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_root: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
