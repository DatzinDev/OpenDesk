from pathlib import Path
from zoneinfo import ZoneInfo

from jinja2 import Environment, FileSystemLoader, select_autoescape
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core import config
from app.core.db import SessionLocal, now
from app.modules import tickets, users
from app.modules.notifications.models import Notification
from app.modules.notifications.schemas import Inbox, NotificationOut
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
    if "email" in e.changes:
        _mail(e.email, "Tu acceso a OpenDesk está listo", "account_created.html", name=e.name, role=e.role)
    if "is_active" in e.changes:
        active = e.changes["is_active"][1]
        subject = "Tu acceso a OpenDesk fue reactivado" if active else "Tu acceso a OpenDesk fue desactivado"
        _mail(e.email, subject, "account_status.html", name=e.name, active=active)
    elif "role" in e.changes:
        _mail(e.email, "Tu rol en OpenDesk cambió", "role_changed.html", name=e.name, role=e.changes["role"][1])


# --- Tickets (RF-05) -------------------------------------------------------------------------------

PROPOSALS = {"update": "una actualización", "escalate": "escalar", "close": "cerrar", "reassign": "reasignar"}


def _local(dt) -> str:
    return dt.astimezone(ZoneInfo(config.APP_TIMEZONE)).strftime("%d/%m/%Y %H:%M")


def _messages(db: Session, e: tickets.TicketChanged, s: tickets.Summary) -> list[tuple[list[int], str, str, bool]]:
    """(destinatarios, título, detalle, ¿también por correo?) para cada evento de ticket."""
    d, f = e.data, s.folio
    managers = [m.id for m in users.managers(db)]
    actor = users.get(db, e.actor_id).name if e.actor_id else "OpenDesk"
    match e.kind:
        case "assigned" if d.get("reason") == "auto":
            title = f"{f} se escaló automáticamente porque venció el SLA"
            return [([d["to"]], f"Se te asignó el ticket {f} por escalamiento automático", s.title, True),
                    ([d["from"], *managers], title, s.title, True)]
        case "assigned":
            return [([d["to"]], f"Se te asignó el ticket {f}", s.title, True)]
        case "proposed":
            return [(managers, f"{actor} propone {PROPOSALS[d['proposal']]} en {f}", s.title, True)]
        case "accepted" | "rejected":
            verb = "aceptada" if e.kind == "accepted" else "rechazada"
            body = d.get("comment") or s.title
            return [([d["proposer_id"]], f"Tu propuesta de {PROPOSALS[d['proposal']]} en {f} fue {verb}", body, True)]
        case "needs_manager":
            return [(managers, f"{f} requiere intervención del Gestor",
                     f"{s.title}\nNo hay un nivel superior con personas para escalarlo.", True)]
        case "sla_warning":
            return [([d["to"]], f"Se consumió el 80 % del SLA de {f}", f"Vence el {_local(s.due_at)}.", False)]
        case "reminder":
            return [([d["to"]], f"Tu fecha compromiso de {f} vence pronto", f"{s.title}\nVence el {_local(s.due_at)}.", True)]
        case "commitment_overdue":
            return [([d["to"], *managers], f"Venció la fecha compromiso de {f}",
                     f"{s.title}\nPropón una nueva actualización o el cierre.", True)]
        case "closed":
            return [([d["to"]], f"El ticket {f} fue cerrado", s.title, False)]
    return []


def on_ticket_changed(e: tickets.TicketChanged) -> None:
    with SessionLocal() as db:
        s = tickets.summary(db, e.ticket_id)
        sent = set()
        for recipients, title, body, by_mail in _messages(db, e, s):
            for uid in dict.fromkeys(recipients):
                if uid in sent or uid == e.actor_id:
                    continue
                sent.add(uid)
                user = users.get(db, uid)
                if not user or not user.is_active:
                    continue
                db.add(Notification(user_id=uid, ticket_id=s.id, title=title[:200], body=body[:500]))
                if by_mail:
                    _mail(user.email, title, "ticket.html", name=user.name.split(" ")[0], title=title, body=body,
                          ticket_id=s.id)
        db.commit()


def inbox(db: Session, user_id: int) -> Inbox:
    q = select(Notification).where(Notification.user_id == user_id)
    items = list(db.scalars(q.order_by(Notification.created_at.desc(), Notification.id.desc()).limit(30)))
    ticket_ids = tickets.public_ids(db, {n.ticket_id for n in items})
    unread = db.scalar(select(func.count()).select_from(Notification).where(
        Notification.user_id == user_id, Notification.read_at.is_(None)))
    return Inbox(unread=unread, items=[
        NotificationOut(id=n.uuid, ticket_id=ticket_ids.get(n.ticket_id), title=n.title, body=n.body, read_at=n.read_at,
                        created_at=n.created_at) for n in items])


def mark_read(db: Session, user_id: int, ids: list | None) -> None:
    q = update(Notification).where(Notification.user_id == user_id, Notification.read_at.is_(None))
    db.execute((q.where(Notification.uuid.in_(ids)) if ids else q).values(read_at=now()))
    db.commit()


def register() -> None:
    subscribe(users.UserCreated, on_user_created)
    subscribe(users.UserUpdated, on_user_updated)
    subscribe(tickets.TicketChanged, on_ticket_changed)
