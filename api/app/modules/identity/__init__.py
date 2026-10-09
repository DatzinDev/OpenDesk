"""API pública del módulo de identidad."""
from app.modules.identity.dependencies import current_user, require_roles
from app.modules.identity.events import LoginDenied, LoginSucceeded
from app.modules.identity.service import register

__all__ = ["current_user", "require_roles", "LoginDenied", "LoginSucceeded", "register"]
