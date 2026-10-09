from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: UUID
    ticket_id: UUID | None
    title: str
    body: str
    read_at: datetime | None
    created_at: datetime


class Inbox(BaseModel):
    unread: int
    items: list[NotificationOut]


class ReadIn(BaseModel):
    ids: list[UUID] | None = None  # sin ids: marcar todos
