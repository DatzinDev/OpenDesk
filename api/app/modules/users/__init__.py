"""API pública del módulo de usuarios."""
from app.modules.users.events import UserCreated, UserUpdated
from app.modules.users.schemas import Role, UserOut
from app.modules.users.service import ensure_root, get, get_by_email, highest_level_in_area, record_login

__all__ = ["UserCreated", "UserUpdated", "Role", "UserOut", "ensure_root", "get", "get_by_email", "record_login", "highest_level_in_area"]
