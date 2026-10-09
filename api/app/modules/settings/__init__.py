"""API pública del módulo de parámetros globales."""
from app.modules.settings.events import SettingsChanged
from app.modules.settings.service import get, tz
from app.modules.settings.form import Conflict as FormConflict, display_value, read as ticket_form, validate_values, validate_system

__all__ = ["SettingsChanged", "get", "tz", "FormConflict", "display_value", "ticket_form", "validate_values", "validate_system", "survey_definition", "CSAT_ID"]
from app.modules.settings.survey_form import read as survey_definition, MAIN as CSAT_ID
