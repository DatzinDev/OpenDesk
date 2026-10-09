"""Definición global y validación de datos adicionales de tickets."""
import math
from datetime import date
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.modules.settings import service
from app.modules.settings.events import SettingsChanged
from app.modules.settings.models import Param
from app.shared.events import publish


class Conflict(Exception):
    pass


class Option(BaseModel):
    id: UUID
    label: str = Field(min_length=1, max_length=80)
    active: bool = True

    @field_validator("label")
    @classmethod
    def _label(cls, value):
        if not value.strip():
            raise ValueError("Escribe una etiqueta.")
        return value.strip()


class CustomField(BaseModel):
    id: UUID
    label: str = Field(min_length=1, max_length=80)
    type: Literal["text", "number", "date", "select", "boolean"]
    help: str = Field(default="", max_length=200)
    required: bool = False
    active: bool = True
    options: list[Option] = Field(default_factory=list, max_length=50)

    @field_validator("label")
    @classmethod
    def _label(cls, value):
        return Option._label(value)

    @model_validator(mode="after")
    def _options(self):
        if len({o.id for o in self.options}) != len(self.options):
            raise ValueError("Hay opciones repetidas.")
        if self.type == "select" and (not self.options or (self.active and not any(o.active for o in self.options))):
            raise ValueError("Agrega al menos una opción activa a la lista.")
        if self.type != "select" and self.options:
            raise ValueError("Solo las listas tienen opciones.")
        return self



class SystemOption(BaseModel):
    id: Literal["alta", "media", "baja"]
    label: str = Field(min_length=1, max_length=80)
    active: bool = True

    _label = field_validator("label")(Option._label.__func__)


class SystemField(BaseModel):
    id: Literal["title", "description", "area_id", "assignee_id", "priority", "client_name", "client_email", "files"]
    label: str = Field(min_length=1, max_length=80)
    help: str = Field(default="", max_length=200)
    required: bool = False
    options: list[SystemOption] = Field(default_factory=list)

    _label = field_validator("label")(Option._label.__func__)


def default_system():
    return [SystemField(id=id, label=label, required=required,
                        options=[SystemOption(id=k, label=v) for k, v in [("alta", "Alta"), ("media", "Media"), ("baja", "Baja")]] if id == "priority" else [])
            for id, label, required in [("title", "Título", True), ("description", "Descripción", True),
            ("area_id", "Área", True), ("assignee_id", "Asignado a", True), ("priority", "Prioridad", False),
            ("client_name", "Nombre del cliente", False), ("client_email", "Correo del cliente", False), ("files", "Adjuntos", False)]]

class FormDefinition(BaseModel):
    revision: int = Field(default=0, ge=0)
    fields: list[CustomField] = Field(default_factory=list, max_length=200)
    system: list[SystemField] = Field(default_factory=default_system)
    order: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def _fields(self):
        expected = {f.id for f in default_system()}
        if len(self.system) != len(expected) or {f.id for f in self.system} != expected:
            raise ValueError("Conserva todos los campos predeterminados.")
        for f in self.system:
            if f.id in ("title", "area_id", "assignee_id") and not f.required:
                raise ValueError(f"{f.label}: es obligatorio para el flujo del ticket.")
            if f.id == "priority":
                if len(f.options) != 3 or {o.id for o in f.options} != {"alta", "media", "baja"} or not any(o.active for o in f.options):
                    raise ValueError("Conserva las prioridades y al menos una opción activa.")
            elif f.options:
                raise ValueError("Las áreas y personas se editan en sus catálogos.")
        keys = expected | {str(f.id) for f in self.fields}
        if not self.order:
            self.order = [f.id for f in self.system] + [str(f.id) for f in self.fields]
        if len(self.order) != len(keys) or set(self.order) != keys:
            raise ValueError("El orden debe contener todos los campos una sola vez.")
        self.fields.sort(key=lambda f: self.order.index(str(f.id)))
        if sum(f.active for f in self.fields) > 20:
            raise ValueError("Puedes tener hasta 20 campos activos.")
        if len({f.id for f in self.fields}) != len(self.fields):
            raise ValueError("Hay campos repetidos.")
        return self


def read(db: Session, *, lock=False) -> FormDefinition:
    query = select(Param).where(Param.key == "ticket_form")
    row = db.scalar(query.with_for_update() if lock else query)
    if lock and row is None:
        raise Conflict("El formulario no está inicializado. Contacta al Administrador.")
    return FormDefinition.model_validate(row.value if row else {})


def save(db: Session, actor, data: FormDefinition) -> FormDefinition:
    if actor.role != "admin":
        raise service.Forbidden
    data = FormDefinition.model_validate(data.model_dump())
    old = read(db, lock=True)
    if old.revision != data.revision:
        raise Conflict("El formulario cambió. Recarga la configuración antes de guardar.")
    incoming = {f.id: f for f in data.fields}
    for previous in old.fields:
        current = incoming.get(previous.id)
        if not current:
            raise ValueError("Desactiva el campo en lugar de eliminarlo.")
        if current.type != previous.type:
            raise ValueError("El tipo no se puede cambiar; crea otro campo.")
        if not {o.id for o in previous.options}.issubset({o.id for o in current.options}):
            raise ValueError("Desactiva la opción en lugar de eliminarla.")
    data.revision += 1
    payload = data.model_dump(mode="json")
    result = db.execute(update(Param).where(Param.key == "ticket_form", Param.value["revision"].as_integer() == old.revision)
                        .values(value=payload, updated_by=actor.id))
    if result.rowcount != 1:
        raise Conflict("El formulario cambió. Recarga antes de guardar.")
    db.commit()
    publish(SettingsChanged(actor_id=actor.id, changes={"ticket_form": [old.model_dump(mode="json"), payload]}))
    return data


def validate_values(db: Session, incoming: dict, revision: int | None, existing: dict | None = None) -> dict:
    definition = read(db, lock=True)
    if (revision is not None and revision != definition.revision) or (definition.revision and revision is None):
        raise Conflict("El formulario cambió. Recarga el ticket antes de guardar los datos adicionales.")
    known = {str(f.id): f for f in definition.fields}
    result = dict(existing or {})
    for key, value in incoming.items():
        f = known.get(key)
        if not f:
            raise ValueError("El formulario incluye un campo desconocido.")
        if not f.active:
            raise ValueError(f"{f.label}: el campo está inactivo.")
        empty = value is None or (isinstance(value, str) and not value.strip())
        if empty:
            if f.required and (existing is None or result.get(key) is not None):
                raise ValueError(f"{f.label}: es obligatorio.")
            result.pop(key, None)
            continue
        valid = False
        if f.type == "text":
            valid = isinstance(value, str) and len(value) <= 500
        elif f.type == "number":
            try:
                valid = type(value) in (int, float) and math.isfinite(value)
            except OverflowError:
                valid = False
        elif f.type == "boolean":
            valid = type(value) is bool
        elif f.type == "date" and isinstance(value, str):
            try:
                valid = date.fromisoformat(value).isoformat() == value
            except ValueError:
                pass
        elif f.type == "select":
            valid = isinstance(value, str) and value in {str(o.id) for o in f.options if o.active}
        if not valid:
            raise ValueError(f"{f.label}: el valor no es válido.")
        result[key] = value.strip() if f.type == "text" else value
    if existing is None:
        for key, f in known.items():
            if f.active and f.required and key not in result:
                raise ValueError(f"{f.label}: es obligatorio.")
    return result


def display_value(f: CustomField, value):
    if value is None:
        return ""
    if f.type == "select":
        return next((o.label for o in f.options if str(o.id) == value), str(value))
    if f.type == "boolean":
        return "Sí" if value else "No"
    return str(value)


def validate_system(definition: FormDefinition, values: dict, *, existing: dict | None = None, files=()):
    for f in definition.system:
        if f.id == "files":
            if existing is None and f.required and not files:
                raise ValueError(f"{f.label}: adjunta al menos un archivo.")
            continue
        value = values.get(f.id)
        if isinstance(value, str):
            value = value.strip()
        if f.required and not value and (existing is None or existing.get(f.id)):
            raise ValueError(f"{f.label}: es obligatorio.")
        if f.id == "priority" and (existing is None or value != existing.get(f.id)):
            if value not in {o.id for o in f.options if o.active}:
                raise ValueError(f"{f.label}: selecciona una opción activa.")
