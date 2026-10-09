from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware

from app.core import config
from app.core.db import SessionLocal
from app.modules import audit, identity, notifications, users
from app.modules.areas.router import router as areas_router
from app.modules.identity.router import router as identity_router
from app.modules.users.router import router as users_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    audit.register()
    identity.register()
    notifications.register()
    with SessionLocal() as db:
        users.ensure_root(db, config.ADMIN_EMAIL)
    yield


app = FastAPI(title="OpenDesk", lifespan=lifespan, docs_url="/api/docs", openapi_url="/api/openapi.json")


@app.middleware("http")
async def csrf_guard(request: Request, call_next):
    # Las peticiones que modifican datos exigen un encabezado propio: un sitio externo no puede
    # enviarlo sin una verificación CORS previa, que este servidor no autoriza.
    if request.method not in ("GET", "HEAD", "OPTIONS") and request.headers.get("x-requested-with") != "opendesk":
        return JSONResponse({"detail": "Solicitud no permitida."}, status_code=403)
    return await call_next(request)


# Solo guarda el estado temporal del flujo OAuth; la sesión real usa la cookie de identity.
app.add_middleware(SessionMiddleware, secret_key=config.SECRET_KEY, session_cookie="opendesk_oauth",
                   max_age=600, same_site="lax", https_only=config.SECURE_COOKIES)

app.include_router(identity_router)
app.include_router(users_router)
app.include_router(areas_router)
