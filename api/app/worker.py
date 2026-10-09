"""Proceso en segundo plano: revisa plazos de tickets cada minuto (RF-05.1). Uso: python -m app.worker"""
import logging
import time

from app.core.db import SessionLocal
from app.modules import audit, notifications, tickets

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("worker")
INTERVAL = 60

if __name__ == "__main__":
    # ponytail: un solo worker; con varias réplicas se necesitaría un candado (p. ej. pg_advisory_lock).
    audit.register()
    notifications.register()
    log.info("Worker iniciado; revisión cada %s s.", INTERVAL)
    while True:
        try:
            with SessionLocal() as db:
                tickets.sweep(db)
        except Exception:
            log.exception("Fallo en la revisión de plazos")
        time.sleep(INTERVAL)
