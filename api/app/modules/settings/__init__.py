"""API pública del módulo de parámetros globales."""
from app.modules.settings.events import SettingsChanged
from app.modules.settings.service import get, tz

__all__ = ["SettingsChanged", "get", "tz"]
