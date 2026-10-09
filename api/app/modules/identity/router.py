import logging

from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse, Response
from sqlalchemy.orm import Session as DB

from app.core import config
from app.core.db import get_db
from app.modules import users
from app.modules.identity import service
from app.modules.identity.dependencies import COOKIE, current_user

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["identity"])

oauth = OAuth()
oauth.register(
    "google",
    client_id=config.GOOGLE_CLIENT_ID,
    client_secret=config.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile", "code_challenge_method": "S256"},
)


@router.get("/auth/login")
async def login(request: Request):
    return await oauth.google.authorize_redirect(request, config.APP_URL + "/api/auth/callback", prompt="select_account")


@router.get("/auth/callback")
async def callback(request: Request, db: DB = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception:
        log.warning("Fallo en la verificación de Google")
        return RedirectResponse(config.APP_URL + "/login?error=google")
    finally:
        request.session.clear()  # No se conservan tokens de Google.
    info = token.get("userinfo") or {}
    if not info.get("email_verified"):
        return RedirectResponse(config.APP_URL + "/login?error=google")
    session_token = service.login(db, info["email"], info.get("name"), info.get("picture"))
    if not session_token:
        return RedirectResponse(config.APP_URL + "/acceso-denegado")
    resp = RedirectResponse(config.APP_URL + "/")
    resp.set_cookie(
        COOKIE, session_token, max_age=service.SESSION_DAYS * 86400,
        httponly=True, secure=config.SECURE_COOKIES, samesite="lax", path="/",
    )
    return resp


@router.post("/auth/logout", status_code=204)
def logout(request: Request, db: DB = Depends(get_db)):
    if token := request.cookies.get(COOKIE):
        service.logout(db, token)
    resp = Response(status_code=204)
    resp.delete_cookie(COOKIE, path="/")
    return resp


@router.get("/me", response_model=users.UserPublic)
def me(user: users.UserOut = Depends(current_user), db: DB = Depends(get_db)):
    return users.to_public(db, [user])[0]
