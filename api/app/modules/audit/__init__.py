"""API pública del módulo de auditoría."""
from app.modules.audit.service import ticket_activity, record, register

__all__ = ["record", "ticket_activity", "register"]
