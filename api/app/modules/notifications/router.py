from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
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
