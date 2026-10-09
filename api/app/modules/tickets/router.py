from urllib.parse import quote
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules import identity, users
from app.modules.tickets import service
from app.modules.tickets.schemas import (CloseIn, DecisionIn, Person, ProposalIn, ReassignIn, ReopenIn, SetStatusIn,
                                         StatusIn, StatusOut, TicketDetail, TicketIn, TicketOut, TicketUpdate)
from app.shared import storage

router = APIRouter(prefix="/api", tags=["tickets"])
me = identity.current_user


def _call(fn, *args):
    try:
        return fn(*args)
    except service.Forbidden as e:
        raise HTTPException(403, str(e) or "No tienes permiso para esta acción.")
    except service.Conflict as e:
        raise HTTPException(409, str(e))
    except service.NotFound:
        raise HTTPException(404, "Ticket no encontrado.")


def _form(model, data: str):
    """Las acciones con adjuntos llegan como multipart: un campo `data` en JSON y los archivos."""
    try:
        return model.model_validate_json(data)
    except ValidationError as e:
        raise HTTPException(422, e.errors(include_url=False, include_context=False))


async def _uploads(files: list[UploadFile]) -> list[service.Upload]:
    return [service.Upload(f.filename or "archivo", f.content_type or "", await f.read()) for f in files]


@router.get("/tickets", response_model=list[TicketOut])
def list_tickets(area_id: UUID | None = None, assignee_id: UUID | None = None, status: str | None = None,
                 q: str | None = None, actor: users.UserOut = Depends(me), db: Session = Depends(get_db)):
    return service.list_for(db, actor, area_id, assignee_id, status, q)


@router.post("/tickets", response_model=TicketDetail, status_code=201)
async def create_ticket(data: str = Form(...), files: list[UploadFile] = File(default=[]),
                        actor: users.UserOut = Depends(me), db: Session = Depends(get_db)):
    return _call(service.create, db, actor, _form(TicketIn, data), await _uploads(files))


@router.get("/ticket-statuses", response_model=list[StatusOut])
def list_statuses(_: users.UserOut = Depends(me), db: Session = Depends(get_db)):
    return service.list_statuses(db)


@router.post("/ticket-statuses", response_model=StatusOut, status_code=201)
def create_status(data: StatusIn, actor: users.UserOut = Depends(me), db: Session = Depends(get_db)):
    return _call(service.save_status, db, actor, data)


@router.put("/ticket-statuses/{status_id}", response_model=StatusOut)
def update_status(status_id: UUID, data: StatusIn, actor: users.UserOut = Depends(me), db: Session = Depends(get_db)):
    return _call(service.save_status, db, actor, data, status_id)


@router.get("/tickets/peers", response_model=list[Person])
def peers(actor: users.UserOut = Depends(me), db: Session = Depends(get_db)):
    return service.peers(db, actor)


@router.get("/tickets/people/{area_id}", response_model=list[Person])
def people(area_id: UUID, actor: users.UserOut = Depends(me), db: Session = Depends(get_db)):
    return _call(service.people, db, actor, area_id)


@router.get("/tickets/{ticket_id}", response_model=TicketDetail)
def get_ticket(ticket_id: UUID, actor: users.UserOut = Depends(me), db: Session = Depends(get_db)):
    return _call(service.detail, db, actor, ticket_id)


@router.patch("/tickets/{ticket_id}", response_model=TicketDetail)
def update_ticket(ticket_id: UUID, data: TicketUpdate, actor: users.UserOut = Depends(me), db: Session = Depends(get_db)):
    return _call(service.update, db, actor, ticket_id, data)


@router.post("/tickets/{ticket_id}/proposals", response_model=TicketDetail, status_code=201)
async def propose(ticket_id: UUID, data: str = Form(...), files: list[UploadFile] = File(default=[]),
                  actor: users.UserOut = Depends(me), db: Session = Depends(get_db)):
    return _call(service.propose, db, actor, ticket_id, _form(ProposalIn, data), await _uploads(files))


@router.post("/tickets/{ticket_id}/proposals/{event_id}/accept", response_model=TicketDetail)
def accept(ticket_id: UUID, event_id: UUID, data: DecisionIn, actor: users.UserOut = Depends(me),
           db: Session = Depends(get_db)):
    return _call(service.accept, db, actor, ticket_id, event_id, data)


@router.post("/tickets/{ticket_id}/proposals/{event_id}/reject", response_model=TicketDetail)
def reject(ticket_id: UUID, event_id: UUID, data: DecisionIn, actor: users.UserOut = Depends(me),
           db: Session = Depends(get_db)):
    return _call(service.reject, db, actor, ticket_id, event_id, data)


@router.post("/tickets/{ticket_id}/reassign", response_model=TicketDetail)
def reassign(ticket_id: UUID, data: ReassignIn, actor: users.UserOut = Depends(me), db: Session = Depends(get_db)):
    return _call(service.reassign, db, actor, ticket_id, data)


@router.post("/tickets/{ticket_id}/close", response_model=TicketDetail)
def close(ticket_id: UUID, data: CloseIn, actor: users.UserOut = Depends(me), db: Session = Depends(get_db)):
    return _call(service.close, db, actor, ticket_id, data)


@router.put("/tickets/{ticket_id}/status", response_model=TicketDetail)
def set_status(ticket_id: UUID, data: SetStatusIn, actor: users.UserOut = Depends(me), db: Session = Depends(get_db)):
    return _call(service.set_status, db, actor, ticket_id, data)


@router.post("/tickets/{ticket_id}/reopen", response_model=TicketDetail)
def reopen(ticket_id: UUID, data: ReopenIn, actor: users.UserOut = Depends(me), db: Session = Depends(get_db)):
    return _call(service.reopen, db, actor, ticket_id, data)


@router.get("/attachments/{attachment_id}")
def download(attachment_id: UUID, actor: users.UserOut = Depends(me), db: Session = Depends(get_db)):
    a = _call(service.attachment, db, actor, attachment_id)
    return StreamingResponse(storage.stream(a.key), media_type=a.content_type, headers={
        "Content-Disposition": f"inline; filename*=UTF-8''{quote(a.filename)}",
        "X-Content-Type-Options": "nosniff",
    })
