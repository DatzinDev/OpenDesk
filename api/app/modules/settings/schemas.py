from zoneinfo import available_timezones

from pydantic import BaseModel, Field, field_validator


class Functional(BaseModel):
    """Parámetros que editan Admin y Gestor."""
    org_name: str = Field(min_length=1, max_length=80)
    reminder_hours: int = Field(ge=1, le=168)
    sla_warning_pct: int = Field(ge=50, le=95)
    survey_question: str = Field(min_length=10, max_length=300)

    @field_validator("survey_question")
    @classmethod
    def _placeholder(cls, v: str) -> str:
        if "{titulo}" not in v:
            raise ValueError("La pregunta debe incluir {titulo}, que se reemplaza por el título de la solicitud.")
        return v


class Technical(BaseModel):
    """Parámetros que solo edita el Admin."""
    allowed_domain: str = Field(default="", max_length=120)
    timezone: str

    @field_validator("allowed_domain")
    @classmethod
    def _domain(cls, v: str) -> str:
        v = v.strip().lower().lstrip("@")
        if v and ("." not in v or " " in v):
            raise ValueError("Escribe un dominio válido, por ejemplo empresa.com.")
        return v

    @field_validator("timezone")
    @classmethod
    def _tz(cls, v: str) -> str:
        if v not in available_timezones():
            raise ValueError("Zona horaria no válida.")
        return v


class SettingsOut(BaseModel):
    functional: Functional
    technical: Technical


class SettingsIn(BaseModel):
    functional: Functional | None = None
    technical: Technical | None = None
