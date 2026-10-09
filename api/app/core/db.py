from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import Uuid, create_engine, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from app.core.config import DATABASE_URL

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class PublicId:
    """Identificador público. El `id` entero sirve para consultas y relaciones internas y nunca sale del API;
    hacia fuera (respuestas, URLs y parámetros) solo se expone `uuid`."""

    uuid: Mapped[UUID] = mapped_column(Uuid, unique=True, default=uuid4,
                                       server_default=text("gen_random_uuid()"))


def now() -> datetime:
    return datetime.now(timezone.utc)


def get_db():
    with SessionLocal() as db:
        yield db
