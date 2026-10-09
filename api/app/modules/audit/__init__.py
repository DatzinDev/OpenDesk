"""API pública del módulo de auditoría."""
from app.modules.audit.service import record, register

__all__ = ["record", "register"]
