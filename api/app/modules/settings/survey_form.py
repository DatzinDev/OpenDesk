"""Preguntas de estrellas globales; cada envío conserva su propia versión."""
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy import select, update
from sqlalchemy.orm import Session
from app.modules.settings import service
from app.modules.settings.form import Conflict
from app.modules.settings.models import Param
from app.modules.settings.events import SettingsChanged
from app.shared.events import publish

MAIN = "00000000-0000-0000-0000-000000000001"


class Question(BaseModel):
    id: UUID
    label: str = Field(min_length=1, max_length=300)
    help: str = Field(default="", max_length=200)
    required: bool = True
    active: bool = True

    @field_validator("label")
    @classmethod
    def label_not_empty(cls, value):
        if not value.strip():
            raise ValueError("Escribe la pregunta.")
        return value.strip()


class Definition(BaseModel):
    revision: int = Field(default=0, ge=0)
    questions: list[Question]

    @model_validator(mode="after")
    def questions_valid(self):
        if len({q.id for q in self.questions}) != len(self.questions):
            raise ValueError("Hay preguntas repetidas.")
        main = next((q for q in self.questions if str(q.id) == MAIN), None)
        if not main or not main.required or not main.active:
            raise ValueError("Conserva activa y obligatoria la pregunta de satisfacción general para CSAT.")
        return self


def read(db: Session, *, lock=False):
    query = select(Param).where(Param.key == "survey_form")
    row = db.scalar(query.with_for_update() if lock else query)
    if row and row.value.get("questions"):
        return Definition.model_validate(row.value)
    return Definition(questions=[Question(id=MAIN, label=service.get(db, "survey_question"))])


def save(db: Session, actor, data: Definition):
    if actor.role != "admin":
        raise service.Forbidden
    old = read(db, lock=True)
    if old.revision != data.revision:
        raise Conflict("La encuesta cambió. Recarga antes de guardar.")
    data = Definition.model_validate(data.model_dump())
    if not {q.id for q in old.questions}.issubset({q.id for q in data.questions}):
        raise ValueError("Desactiva las preguntas guardadas en lugar de eliminarlas.")
    data.revision += 1
    payload = data.model_dump(mode="json")
    result = db.execute(update(Param).where(Param.key == "survey_form", Param.value["revision"].as_integer() == old.revision).values(value=payload, updated_by=actor.id))
    if result.rowcount != 1:
        raise Conflict("La encuesta cambió. Recarga antes de guardar.")
    db.commit()
    publish(SettingsChanged(actor_id=actor.id, changes={"survey_form": [old.model_dump(mode="json"), payload]}))
    return data
