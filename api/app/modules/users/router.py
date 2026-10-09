from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules import identity
from app.modules.users import service
from app.modules.users.schemas import UserCreate, UserOut, UserPublic, UserUpdate

router = APIRouter(prefix="/api/users", tags=["users"])
staff = identity.require_roles("admin", "gestor")


def _call(fn, *args):
    try:
        return fn(*args)
    except service.Forbidden as e:
        raise HTTPException(403, str(e) or "No tienes permiso para esta acción.")
    except service.Conflict as e:
        raise HTTPException(409, str(e))
    except service.NotFound:
        raise HTTPException(404, "Usuario no encontrado.")


@router.get("", response_model=list[UserPublic])
def list_users(actor: UserOut = Depends(staff), db: Session = Depends(get_db)):
    return service.to_public(db, _call(service.list_users, db, actor))


@router.post("", response_model=UserPublic, status_code=201)
def create_user(data: UserCreate, actor: UserOut = Depends(staff), db: Session = Depends(get_db)):
    return service.to_public(db, [_call(service.create_user, db, actor, data)])[0]


@router.patch("/{user_id}", response_model=UserPublic)
def update_user(user_id: UUID, data: UserUpdate, actor: UserOut = Depends(staff), db: Session = Depends(get_db)):
    user = _call(service.update_user, db, actor, service.id_of(db, user_id) or 0, data)
    return service.to_public(db, [user])[0]

