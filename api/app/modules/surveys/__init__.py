"""API pública del módulo de encuestas de satisfacción."""
from app.modules.surveys.events import SurveyAnswered
from app.modules.surveys.service import register

__all__ = ["SurveyAnswered", "register"]
