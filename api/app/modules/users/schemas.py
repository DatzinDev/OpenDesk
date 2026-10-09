from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Role = Literal["admin", "gestor", "usuario"]


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str
    picture: str | None
    role: Role
    area_id: int | None
    level: int | None
    is_active: bool
    is_root: bool
    created_at: datetime
    last_login_at: datetime | None


class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=120)
    role: Role
    area_id: int | None = None
    level: int | None = None


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    name: str | None = Field(default=None, min_length=1, max_length=120)
    role: Role | None = None
    area_id: int | None = None
    level: int | None = None
    is_active: bool | None = None
