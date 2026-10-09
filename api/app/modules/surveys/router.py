from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules import identity, tickets, users
from app.modules.surveys import service
from app.modules.surveys.schemas import CommentIn, RatingIn, SurveyOut, SurveyStatus

router = APIRouter(prefix="/api", tags=["surveys"])


def _call(fn, *args):
    try:
        return fn(*args)
    except service.Conflict as e:
        raise HTTPException(409, str(e))
    except (service.NotFound, tickets.NotFound):
        raise HTTPException(404, "El enlace de la encuesta no es válido.")


# Rutas públicas: el cliente no tiene cuenta; el token del correo es la credencial.
@router.get("/surveys/{token}", response_model=SurveyStatus)
def status(token: str, db: Session = Depends(get_db)):
    return _call(service.status, db, token)


@router.post("/surveys/{token}/rating", response_model=SurveyStatus)
def rate(token: str, data: RatingIn, db: Session = Depends(get_db)):
    return _call(service.rate, db, token, data.rating)


@router.post("/surveys/{token}/comment", response_model=SurveyStatus)
def comment(token: str, data: CommentIn, db: Session = Depends(get_db)):
    return _call(service.comment, db, token, data.comment)


@router.get("/tickets/{ticket_id}/survey", response_model=SurveyOut | None)
def for_ticket(ticket_id: UUID, actor: users.UserOut = Depends(identity.current_user), db: Session = Depends(get_db)):
    try:
        return service.for_ticket(db, actor, ticket_id)
    except tickets.NotFound:
        raise HTTPException(404, "Ticket no encontrado.")
