from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules import identity, users
from app.modules.settings import service
from app.modules.settings.schemas import SettingsIn, SettingsOut

router = APIRouter(prefix="/api/settings", tags=["settings"])
staff = identity.require_roles("admin", "gestor")


class TestEmailOut(BaseModel):
    sent_to: str
    error: str | None


@router.get("", response_model=SettingsOut)
def read(_: users.UserOut = Depends(staff), db: Session = Depends(get_db)):
    return service.read(db)


@router.put("", response_model=SettingsOut)
def save(data: SettingsIn, actor: users.UserOut = Depends(staff), db: Session = Depends(get_db)):
    try:
        return service.save(db, actor, data)
    except service.Forbidden:
        raise HTTPException(403, "Solo el Administrador puede cambiar los parámetros técnicos.")


@router.post("/test-email", response_model=TestEmailOut)
def test_email(actor: users.UserOut = Depends(identity.require_roles("admin")), db: Session = Depends(get_db)):
    return TestEmailOut(sent_to=actor.email, error=service.test_email(db, actor))
