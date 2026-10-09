from datetime import date, time

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class AreaIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    description: str = Field(default="", max_length=240)
    sla_hours: int = Field(default=24, ge=1, le=2000)
    always_open: bool = True
    days: list[int] = Field(default_factory=lambda: [0, 1, 2, 3, 4])
    start_time: time = time(9)
    end_time: time = time(18)
    pause_on_holidays: bool = False
    is_active: bool = True

    @field_validator("days")
    @classmethod
    def _days(cls, v: list[int]) -> list[int]:
        if any(d not in range(7) for d in v):
            raise ValueError("Días inválidos.")
        return sorted(set(v))

    @model_validator(mode="after")
    def _window(self):
        if not self.always_open:
            if not self.days:
                raise ValueError("Selecciona al menos un día de atención.")
            if self.start_time >= self.end_time:
                raise ValueError("La hora de inicio debe ser anterior a la hora de fin.")
        return self


class AreaOut(AreaIn):
    model_config = ConfigDict(from_attributes=True)

    id: int

    @field_validator("days", mode="before")
    @classmethod
    def _parse_days(cls, v):
        return [int(d) for d in v.split(",") if d] if isinstance(v, str) else v


class HolidayIn(BaseModel):
    day: date
    name: str = Field(min_length=1, max_length=80)


class HolidayOut(HolidayIn):
    model_config = ConfigDict(from_attributes=True)
