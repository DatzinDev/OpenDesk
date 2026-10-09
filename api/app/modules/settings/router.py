from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules import identity, users
from app.modules.settings import service
from app.modules.settings import branding
from app.modules.settings import form, survey_form
from app.modules.settings.branding import BrandingIn, BrandingOut
from app.shared import storage
from app.modules.settings.schemas import SettingsIn, SettingsOut

router = APIRouter(prefix="/api/settings", tags=["settings"])
staff = identity.require_roles("admin", "gestor")


@router.get("/ticket-form", response_model=form.FormDefinition)
def ticket_form(_: users.UserOut = Depends(identity.current_user), db: Session = Depends(get_db)):
    return form.read(db)


@router.put("/ticket-form", response_model=form.FormDefinition)
def save_ticket_form(data: form.FormDefinition, actor=Depends(identity.require_roles("admin")), db: Session = Depends(get_db)):
    try:
        return form.save(db, actor, data)
    except form.Conflict as exc:
        raise HTTPException(409, str(exc))
    except ValueError as exc:
        raise HTTPException(422, str(exc))


@router.get("/survey-form", response_model=survey_form.Definition)
def get_survey_form(actor=Depends(identity.require_roles("admin")), db: Session = Depends(get_db)):
    return survey_form.read(db)


@router.put("/survey-form", response_model=survey_form.Definition)
def save_survey_form(data: survey_form.Definition, actor=Depends(identity.require_roles("admin")), db: Session = Depends(get_db)):
    try:
        return survey_form.save(db, actor, data)
    except form.Conflict as exc:
        raise HTTPException(409, str(exc))
    except ValueError as exc:
        raise HTTPException(422, str(exc))


@router.get("/branding", response_model=BrandingOut)
def public_branding(db: Session = Depends(get_db)):
    return branding.read(db)


@router.put("/branding", response_model=BrandingOut)
def save_branding(data: BrandingIn, actor=Depends(identity.require_roles("admin")), db: Session = Depends(get_db)):
    try:
        return branding.save(db, actor, data)
    except ValueError as exc:
        raise HTTPException(422, str(exc))


@router.post("/branding/assets", status_code=201)
async def upload_branding(file: UploadFile = File(...), actor=Depends(identity.require_roles("admin")), db: Session = Depends(get_db)):
    try:
        return branding.upload(db, actor, await file.read(branding.MAX_BYTES + 1))
    except ValueError as exc:
        raise HTTPException(422, str(exc))


@router.get("/branding/assets/{asset_id}")
def branding_asset(asset_id: UUID, db: Session = Depends(get_db)):
    key = branding.asset(db, asset_id)
    if not key:
        raise HTTPException(404, "Recurso no encontrado.")
    return StreamingResponse(storage.stream(key), media_type="image/webp", headers={
        "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff",
    })


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
