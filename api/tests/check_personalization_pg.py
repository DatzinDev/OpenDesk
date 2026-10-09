"""Comprobación de bloqueos en PostgreSQL aislado. Nunca ejecutarla sobre producción."""
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from threading import Event
from uuid import uuid4

from sqlalchemy.engine import make_url

from app.core import config
from app.core.db import SessionLocal
from app.modules.settings import form
from app.modules.users import service as users


def check():
    assert make_url(config.DATABASE_URL).database == "opendesk_personalization_check", "Usa únicamente la base aislada de comprobación."
    with SessionLocal() as session:
        users.ensure_root(session, "check@opendesk.test")
        admin = users.get_by_email(session, "check@opendesk.test")
        definition = form.read(session, lock=True)
        revision = definition.revision
        entered = Event()

        def stale_create():
            with SessionLocal() as other:
                entered.set()
                try:
                    form.validate_values(other, {}, revision)
                except form.Conflict:
                    return "conflict"
                return "accepted"

        with ThreadPoolExecutor(max_workers=1) as pool:
            pending = pool.submit(stale_create)
            assert entered.wait(3)
            try:
                pending.result(timeout=.2)
                raise AssertionError("El alta no esperó el bloqueo de la configuración")
            except TimeoutError:
                pass
            id = uuid4()
            definition.fields.append(form.CustomField(id=id, label="Dato requerido", type="text", required=True))
            definition.order.append(str(id))
            form.save(session, admin, definition)
            assert pending.result(timeout=5) == "conflict"
    print("PostgreSQL: alta concurrente espera y rechaza la revisión obsoleta, incluida la revisión cero")


if __name__ == "__main__":
    check()
