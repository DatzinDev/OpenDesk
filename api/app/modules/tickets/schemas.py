from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

Priority = Literal["alta", "media", "baja"]
Status = Literal["asignado", "pendiente", "seguimiento", "cerrado"]
Outcome = Literal["resuelto", "no_resuelto"]
ProposalKind = Literal["update", "escalate", "close", "reassign"]


class TicketIn(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(min_length=1, max_length=10000)
    area_id: int
    assignee_id: int
    priority: Priority = "media"
    client_name: str | None = Field(default=None, max_length=120)
    client_email: EmailStr | None = None


class ProposalIn(BaseModel):
    kind: ProposalKind
    comment: str = Field(min_length=1, max_length=5000)
    due_at: datetime | None = None  # actualización: fecha tentativa
    user_id: int | None = None  # reasignación a un compañero
    area_id: int | None = None  # reasignación a otra área

    @model_validator(mode="after")
    def _fields(self):
        if self.kind == "update" and not self.due_at:
            raise ValueError("Indica la fecha tentativa de resolución.")
        if self.kind == "reassign" and bool(self.user_id) == bool(self.area_id):
            raise ValueError("Elige a un compañero o a otra área.")
        return self


class DecisionIn(BaseModel):
    comment: str = Field(default="", max_length=5000)
    outcome: Outcome | None = None  # al aceptar un cierre
    user_id: int | None = None  # al aceptar una reasignación a otra área


class ReassignIn(BaseModel):
    user_id: int
    comment: str = Field(default="", max_length=5000)


class CloseIn(BaseModel):
    outcome: Outcome
    comment: str = Field(min_length=1, max_length=5000)


class StatusIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    is_active: bool = True


class StatusOut(StatusIn):
    model_config = ConfigDict(from_attributes=True)

    id: int


class SetStatusIn(BaseModel):
    status_id: int | None


class AttachmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: int
    filename: str
    content_type: str
    size: int


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kind: str
    actor_id: int | None
    actor_name: str | None = None
    comment: str
    data: dict
    state: str | None
    decided_by: int | None
    decided_by_name: str | None = None
    decision_comment: str
    created_at: datetime
    attachments: list[AttachmentOut] = []


class TicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    folio: str = ""
    title: str
    description: str
    area_id: int
    assignee_id: int
    assignee_name: str | None = None
    priority: Priority
    client_name: str | None
    client_email: str | None
    status: Status
    outcome: Outcome | None
    due_from: datetime
    due_at: datetime
    committed: bool
    needs_manager: bool
    status_id: int | None
    created_by: int
    created_at: datetime
    closed_at: datetime | None
    pending: EventOut | None = None


class TicketDetail(TicketOut):
    events: list[EventOut] = []
    names: dict[str, str] = {}  # personas mencionadas en la línea de tiempo


class Person(BaseModel):
    id: int
    name: str
    level: int | None


class ReopenIn(BaseModel):
    comment: str = Field(min_length=1, max_length=5000)
    user_id: int | None = None  # por defecto, la última persona asignada
