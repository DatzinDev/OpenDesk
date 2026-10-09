from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

import psycopg

from app.core import config
from app.core.db import SessionLocal, get_db
from app.modules import identity, users
from app.modules.notifications import service
from app.modules.notifications.schemas import Inbox, ReadIn

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=Inbox)
def inbox(actor: users.UserOut = Depends(identity.current_user), db: Session = Depends(get_db)):
    return service.inbox(db, actor.id)


@router.post("/read", status_code=204)
def mark_read(data: ReadIn, actor: users.UserOut = Depends(identity.current_user), db: Session = Depends(get_db)):
    service.mark_read(db, actor.id, data.ids)


@router.get("/stream")
async def stream(request: Request):
    """Server-Sent Events: emite `refresh` cuando hay un aviso nuevo para la persona."""
    if not config.DATABASE_URL.startswith("postgresql"):
        raise HTTPException(404, "No disponible.")
    with SessionLocal() as db:  # sesión corta: la conexión del pool no queda ocupada durante el stream
        me = identity.current_user(request, db)
    me_id = str(me.id)

    async def events():
        # ponytail: una conexión de PostgreSQL por pestaña abierta; con cientos de usuarios simultáneos,
        # compartir un solo LISTEN por proceso y repartir en memoria.
        dsn = config.DATABASE_URL.replace("postgresql+psycopg", "postgresql")
        async with await psycopg.AsyncConnection.connect(dsn, autocommit=True) as conn:
            await conn.execute(f"LISTEN {service.CHANNEL}")
            yield "retry: 5000\n\n"
            while not await request.is_disconnected():
                async for n in conn.notifies(timeout=25):
                    if n.payload == me_id:
                        yield "event: refresh\ndata: 1\n\n"
                yield ": latido\n\n"

    return StreamingResponse(events(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
