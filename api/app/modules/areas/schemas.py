from datetime import date, time
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AreaIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    description: str = Field(default="", max_length=240)
    sla_hours: int = Field(default=24, ge=1, le=2000)
    always_open: bool = True
    week: list[tuple[time, time] | None] = Field(
        default_factory=lambda: [(time(9), time(18))] * 5 + [None, None], min_length=7, max_length=7
    )
    levels: int = Field(default=3, ge=1, le=10)
    pause_on_holidays: bool = False
    is_active: bool = True

    @model_validator(mode="after")
    def _window(self):
        if not self.always_open:
            if not any(self.week):
                raise ValueError("Selecciona al menos un día de atención.")
            if any(w and w[0] >= w[1] for w in self.week):
                raise ValueError("En cada día, la hora de inicio debe ser anterior a la hora de fin.")
        return self


class AreaOut(AreaIn):
    """Uso interno entre módulos (incluye el id entero)."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    uuid: UUID


class AreaPublic(AreaIn):
    """Respuesta del API: solo el identificador público."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(validation_alias="uuid")


class HolidayIn(BaseModel):
    day: date
    name: str = Field(min_length=1, max_length=80)


class HolidayOut(HolidayIn):
    model_config = ConfigDict(from_attributes=True)
