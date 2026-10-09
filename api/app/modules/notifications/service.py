from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core import config
from app.modules import users
from app.shared import mailer
from app.shared.events import subscribe

_env = Environment(loader=FileSystemLoader(Path(__file__).parent / "templates"), autoescape=select_autoescape())

ROLE_NAMES = {"admin": "Administrador", "gestor": "Gestor", "usuario": "Usuario"}


def _mail(to: str, subject: str, template: str, **ctx) -> None:
    body = _env.get_template(template).render(app_url=config.APP_URL, roles=ROLE_NAMES, **ctx)
    mailer.send(to, subject, mailer.render(body))


def on_user_created(e: users.UserCreated) -> None:
    _mail(e.email, "Tu acceso a OpenDesk está listo", "account_created.html", name=e.name, role=e.role)


def on_user_updated(e: users.UserUpdated) -> None:
    if "is_active" in e.changes:
        active = e.changes["is_active"][1]
        subject = "Tu acceso a OpenDesk fue reactivado" if active else "Tu acceso a OpenDesk fue desactivado"
        _mail(e.email, subject, "account_status.html", name=e.name, active=active)
    elif "role" in e.changes:
        _mail(e.email, "Tu rol en OpenDesk cambió", "role_changed.html", name=e.name, role=e.changes["role"][1])


def register() -> None:
    subscribe(users.UserCreated, on_user_created)
    subscribe(users.UserUpdated, on_user_updated)
