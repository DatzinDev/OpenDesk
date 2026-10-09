from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.core import config
from app.modules.settings.events import SettingsChanged
from app.modules.settings.models import Param
from app.modules.settings.schemas import Functional, SettingsIn, SettingsOut, Technical
from app.shared import mailer
from app.shared.events import publish

DEFAULTS = {
    "org_name": "OpenDesk",
    "reminder_hours": config.REMINDER_HOURS,
    "sla_warning_pct": 80,
    "survey_question": "¿Qué tan satisfecho quedaste con la atención a tu solicitud “{titulo}”?",
    "allowed_domain": "",
    "timezone": config.APP_TIMEZONE,
}
TECHNICAL = ("allowed_domain", "timezone")


# `settings` no importa otros módulos: lo consumen casi todos y así no se forman ciclos.


class Forbidden(Exception):
    pass


def get(db: Session, key: str):
    """Valor vigente del parámetro, o su valor por defecto."""
    # ponytail: una lectura por consulta; agregar caché si llega a notarse en el perfil.
    p = db.get(Param, key)
    return p.value if p else DEFAULTS[key]


def tz(db: Session) -> ZoneInfo:
    return ZoneInfo(get(db, "timezone"))


def read(db: Session) -> SettingsOut:
    values = {k: get(db, k) for k in DEFAULTS}
    return SettingsOut(functional=Functional(**{k: values[k] for k in Functional.model_fields}),
                       technical=Technical(**{k: values[k] for k in Technical.model_fields}))


def save(db: Session, actor, data: SettingsIn) -> SettingsOut:
    if actor.role not in ("admin", "gestor") or (data.technical and actor.role != "admin"):
        raise Forbidden
    incoming = {**(data.functional.model_dump() if data.functional else {}),
                **(data.technical.model_dump() if data.technical else {})}
    changes = {}
    for key, value in incoming.items():
        old = get(db, key)
        if old == value:
            continue
        changes[key] = [old, value]
        p = db.get(Param, key) or Param(key=key)
        p.value, p.updated_by = value, actor.id
        db.add(p)
    if changes:
        db.commit()
        publish(SettingsChanged(actor_id=actor.id, changes=changes))
    return read(db)


def test_email(db: Session, actor) -> str | None:
    """Envía un correo de prueba al Admin y devuelve el error SMTP, si lo hay."""
    if actor.role != "admin":
        raise Forbidden
    body = ("<h1 style=\"font-size:20px;margin:0 0 16px;\">Correo de prueba</h1>"
            "<p style=\"margin:0;\">Si recibiste este mensaje, OpenDesk puede enviar avisos y encuestas.</p>")
    return mailer.send_now(actor.email, "Correo de prueba de OpenDesk", mailer.render(body, org=get(db, "org_name")))
