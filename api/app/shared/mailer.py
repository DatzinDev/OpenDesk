"""Transporte de correo SMTP. Las plantillas de cada correo pertenecen al módulo que lo envía."""
import logging
import smtplib
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from email.message import EmailMessage
from email.utils import formataddr
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core import config
from app.shared.events import publish

log = logging.getLogger(__name__)
_pool = ThreadPoolExecutor(max_workers=2)
_env = Environment(
    loader=FileSystemLoader(Path(__file__).parent / "templates"),
    autoescape=select_autoescape(),
)


@dataclass(frozen=True)
class MailFailed:
    to: str
    subject: str
    error: str


def render(body_html: str, **ctx) -> str:
    """Envuelve el contenido en el layout con la marca."""
    return _env.get_template("layout.html").render(body=body_html, app_url=config.APP_URL, **ctx)


def _send(to: str, subject: str, html: str) -> None:
    msg = EmailMessage()
    msg["From"] = formataddr((config.MAIL_FROM_NAME, config.MAIL_FROM))
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content("Abre este correo en un cliente compatible con HTML.")
    msg.add_alternative(html, subtype="html")
    try:
        with smtplib.SMTP(config.MAIL_HOST, config.MAIL_PORT, timeout=20) as smtp:
            if config.MAIL_USE_TLS:
                smtp.starttls()
            if config.MAIL_USERNAME:
                smtp.login(config.MAIL_USERNAME, config.MAIL_PASSWORD)
            smtp.send_message(msg)
    except Exception as exc:
        log.warning("No se pudo enviar correo a %s: %s", to, exc)
        publish(MailFailed(to=to, subject=subject, error=str(exc)[:500]))


def send(to: str, subject: str, html: str) -> None:
    """Envía en segundo plano; nunca bloquea ni hace fallar la petición."""
    # ponytail: hilo en proceso; mover a cola/worker cuando el volumen lo requiera.
    _pool.submit(_send, to, subject, html)
