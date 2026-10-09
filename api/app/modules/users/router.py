from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules import identity
from app.modules.users import service
from app.modules.users.schemas import UserCreate, UserOut, UserUpdate

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


@router.get("", response_model=list[UserOut])
def list_users(actor: UserOut = Depends(staff), db: Session = Depends(get_db)):
    return _call(service.list_users, db, actor)


@router.post("", response_model=UserOut, status_code=201)
def create_user(data: UserCreate, actor: UserOut = Depends(staff), db: Session = Depends(get_db)):
    return _call(service.create_user, db, actor, data)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserUpdate, actor: UserOut = Depends(staff), db: Session = Depends(get_db)):
    return _call(service.update_user, db, actor, user_id, data)

