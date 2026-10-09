from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session as DB

from app.core.db import get_db
from app.modules import users
from app.modules.identity import service

COOKIE = "opendesk_session"


def current_user(request: Request, db: DB = Depends(get_db)) -> users.UserOut:
    token = request.cookies.get(COOKIE)
    user = service.resolve(db, token) if token else None
    if not user:
        raise HTTPException(401, "Inicia sesión para continuar.")
    return user


def require_roles(*roles: str):
    def dep(user: users.UserOut = Depends(current_user)) -> users.UserOut:
        if user.role not in roles:
            raise HTTPException(403, "No tienes permiso para esta acción.")
        return user

    return dep
