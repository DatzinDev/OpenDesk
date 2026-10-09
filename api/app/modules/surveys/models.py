from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, JSON, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, PublicId, now


class Survey(PublicId, Base):
    """Encuesta CSAT enviada al cliente al cerrar un ticket como Resuelto."""
    __tablename__ = "surveys_surveys"
    __table_args__ = (CheckConstraint("rating BETWEEN 1 AND 5", name="ck_surveys_rating"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    ticket_id: Mapped[int] = mapped_column(ForeignKey("tickets_tickets.id"), index=True)
    email: Mapped[str] = mapped_column(String(254))
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)  # solo el hash; el token viaja en el correo
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    rating: Mapped[int | None] = mapped_column(Integer)
    comment: Mapped[str] = mapped_column(Text, default="")
    questions: Mapped[list] = mapped_column(JSON, default=list)
    ratings: Mapped[dict] = mapped_column(JSON, default=dict)
    answered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
