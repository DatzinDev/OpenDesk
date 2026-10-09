from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, now


class Ticket(Base):
    __tablename__ = "tickets_tickets"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text)
    area_id: Mapped[int] = mapped_column(ForeignKey("areas_areas.id"), index=True)
    assignee_id: Mapped[int] = mapped_column(ForeignKey("users_users.id"), index=True)
    priority: Mapped[str] = mapped_column(String(5), default="media")  # alta | media | baja
    client_name: Mapped[str | None] = mapped_column(String(120))
    client_email: Mapped[str | None] = mapped_column(String(254))
    status: Mapped[str] = mapped_column(String(12), default="asignado")  # asignado | pendiente | seguimiento | cerrado
    outcome: Mapped[str | None] = mapped_column(String(12))  # resuelto | no_resuelto
    # Plazo vigente: SLA de primera respuesta o, tras una actualización aceptada, la fecha compromiso.
    due_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    committed: Mapped[bool] = mapped_column(Boolean, default=False)
    needs_manager: Mapped[bool] = mapped_column(Boolean, default=False)
    # Avisos ya enviados para el plazo vigente; se reinician con cada asignación o compromiso nuevo.
    sla_warned: Mapped[bool] = mapped_column(Boolean, default=False)
    reminded: Mapped[bool] = mapped_column(Boolean, default=False)
    overdue_notified: Mapped[bool] = mapped_column(Boolean, default=False)
    # Estatus de seguimiento elegido por el Gestor del catálogo editable; no altera el flujo.
    status_id: Mapped[int | None] = mapped_column(ForeignKey("tickets_statuses.id"))
    created_by: Mapped[int] = mapped_column(ForeignKey("users_users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class TrackingStatus(Base):
    """Catálogo global de estatus de seguimiento (p. ej. "Esperando al cliente")."""
    __tablename__ = "tickets_statuses"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(60), unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Event(Base):
    """Línea de tiempo del ticket. Las propuestas del Usuario son eventos con `state`."""
    __tablename__ = "tickets_events"
    # Una sola propuesta pendiente por ticket, garantizado por la base de datos.
    __table_args__ = (Index("ux_tickets_one_pending", "ticket_id", unique=True,
                            postgresql_where=text("state = 'pending'"), sqlite_where=text("state = 'pending'")),)

    id: Mapped[int] = mapped_column(primary_key=True)
    ticket_id: Mapped[int] = mapped_column(ForeignKey("tickets_tickets.id"), index=True)
    kind: Mapped[str] = mapped_column(String(20))
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users_users.id"))
    comment: Mapped[str] = mapped_column(Text, default="")
    data: Mapped[dict] = mapped_column(JSON, default=dict)
    state: Mapped[str | None] = mapped_column(String(10))  # pending | accepted | rejected | cancelled
    decided_by: Mapped[int | None] = mapped_column(ForeignKey("users_users.id"))
    decision_comment: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Attachment(Base):
    __tablename__ = "tickets_attachments"

    id: Mapped[int] = mapped_column(primary_key=True)
    ticket_id: Mapped[int] = mapped_column(ForeignKey("tickets_tickets.id"), index=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("tickets_events.id"), index=True)
    key: Mapped[str] = mapped_column(String(200))
    filename: Mapped[str] = mapped_column(String(200))
    content_type: Mapped[str] = mapped_column(String(100))
    size: Mapped[int] = mapped_column(Integer)
    uploaded_by: Mapped[int] = mapped_column(ForeignKey("users_users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
