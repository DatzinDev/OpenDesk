import uuid
from dataclasses import dataclass
from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.core import config
from app.core.db import now
from app.modules import areas, users
from app.modules.tickets import repository as repo
from app.modules.tickets.events import TicketChanged
from app.modules.tickets.models import Attachment, Event, Ticket, TrackingStatus
from app.modules.tickets.schemas import (CloseIn, DecisionIn, EventOut, Person, ProposalIn, ReassignIn, ReopenIn,
                                         SetStatusIn, StatusIn, StatusOut, TicketDetail, TicketIn, TicketOut)
from app.shared import storage
from app.shared.events import publish

ALLOWED_TYPES = {"image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf"}
MAX_FILES, MAX_SIZE = 5, 10 * 1024 * 1024


class Forbidden(Exception):
    pass


class Conflict(Exception):
    pass


class NotFound(Exception):
    pass


@dataclass(frozen=True)
class Upload:
    filename: str
    content_type: str
    data: bytes


def folio(ticket_id: int) -> str:
    return f"OD-{ticket_id:06d}"


def _staff(actor: users.UserOut) -> bool:
    return actor.role in ("admin", "gestor")


def _require_staff(actor: users.UserOut) -> None:
    if not _staff(actor):
        raise Forbidden


def _visible(db: Session, actor: users.UserOut, ticket_id: int) -> Ticket:
    """El Usuario solo ve los tickets que tiene asignados; Admin y Gestor ven todos."""
    t = repo.get(db, ticket_id)
    if not t or (not _staff(actor) and t.assignee_id != actor.id):
        raise NotFound
    return t


def _open(t: Ticket) -> None:
    if t.status == "cerrado":
        raise Conflict("El ticket está cerrado.")


def _person(db: Session, user_id: int | None, area_id: int | None = None) -> users.UserOut:
    u = users.get(db, user_id) if user_id else None
    if not u or not u.is_active or u.role != "usuario" or (area_id and u.area_id != area_id):
        raise Conflict("Elige a una persona activa del área.")
    return u


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=ZoneInfo(config.APP_TIMEZONE))


def _check_files(files: list[Upload]) -> None:
    if len(files) > MAX_FILES:
        raise Conflict(f"Puedes adjuntar hasta {MAX_FILES} archivos por acción.")
    for f in files:
        if f.content_type not in ALLOWED_TYPES:
            raise Conflict(f"{f.filename}: solo se aceptan imágenes y PDF.")
        if len(f.data) > MAX_SIZE:
            raise Conflict(f"{f.filename}: el tamaño máximo es de 10 MB.")


def _event(db: Session, t: Ticket, kind: str, actor_id: int | None, comment: str = "", data: dict | None = None,
           state: str | None = None, files: list[Upload] = ()) -> Event:
    ev = repo.add(db, Event(ticket_id=t.id, kind=kind, actor_id=actor_id, comment=comment.strip(),
                            data=data or {}, state=state))
    for f in files:
        key = f"tickets/{t.id}/{uuid.uuid4().hex}"
        storage.put(key, f.data, f.content_type)
        repo.add(db, Attachment(ticket_id=t.id, event_id=ev.id, key=key, filename=f.filename[:200],
                                     content_type=f.content_type, size=len(f.data), uploaded_by=actor_id))
    return ev


def _assign(db: Session, t: Ticket, user: users.UserOut) -> None:
    """Toda asignación reinicia el SLA con la configuración vigente del área y borra el compromiso."""
    start = now()
    t.assignee_id, t.area_id = user.id, user.area_id
    t.due_from, t.due_at = start, areas.sla_deadline(db, user.area_id, start)
    t.committed, t.needs_manager, t.status = False, False, "asignado"


def _move(db: Session, t: Ticket, actor_id: int, user: users.UserOut, reason: str, comment: str = "") -> None:
    prev = t.assignee_id
    _assign(db, t, user)
    _event(db, t, "assigned", actor_id, comment, {"from": prev, "to": user.id, "area_id": user.area_id, "reason": reason})


def _settle(t: Ticket) -> None:
    t.status = "seguimiento" if t.committed else "asignado"


def _escalate(db: Session, t: Ticket, actor_id: int) -> None:
    """Sube al siguiente nivel con personas del área, a quien tenga menos tickets abiertos (RF-03.4/03.5)."""
    current = users.get(db, t.assignee_id)
    level = current.level if current and current.area_id == t.area_id else 0
    above = [u for u in users.active_in_area(db, t.area_id) if u.level > level]
    if not above:
        t.needs_manager = True
        _settle(t)
        _event(db, t, "needs_manager", None)
        return
    nxt = min(u.level for u in above)
    candidates = [u for u in above if u.level == nxt]
    load = repo.open_counts(db, [u.id for u in candidates])
    _move(db, t, actor_id, min(candidates, key=lambda u: (load.get(u.id, 0), u.name)), "escalate")


def _close(t: Ticket, outcome: str) -> None:
    t.status, t.outcome, t.closed_at, t.needs_manager = "cerrado", outcome, now(), False


def _cancel_pending(db: Session, t: Ticket) -> None:
    if p := repo.pending(db, t.id):
        p.state = "cancelled"


def _done(db: Session, actor_id: int, t: Ticket, kind: str, data: dict | None = None) -> TicketDetail:
    db.commit()
    publish(TicketChanged(actor_id=actor_id, ticket_id=t.id, kind=kind, data=data or {}))
    return _detail(db, t)


# --- Lectura -------------------------------------------------------------------------------------

def _out(t: Ticket, names: dict, pending=None, cls=TicketOut):
    out = cls.model_validate(t)
    out.folio, out.assignee_name = folio(t.id), names.get(t.assignee_id)
    if pending:
        out.pending = _event_out(pending, names, [])
    return out


def _event_out(e: Event, names: dict, files) -> EventOut:
    out = EventOut.model_validate(e)
    out.actor_name, out.decided_by_name = names.get(e.actor_id), names.get(e.decided_by)
    out.attachments = [f for f in files if f.event_id == e.id]
    return out


def _detail(db: Session, t: Ticket) -> TicketDetail:
    events = repo.events(db, t.id)
    ids = {t.assignee_id} | {e.actor_id for e in events} | {e.decided_by for e in events}
    ids |= {e.data.get(k) for e in events for k in ("from", "to", "user_id")}
    names = users.names(db, ids)
    files = repo.attachments(db, t.id)
    out = _out(t, names, next((e for e in events if e.state == "pending"), None), TicketDetail)
    out.events = [_event_out(e, names, files) for e in events]
    out.names = {str(k): v for k, v in names.items()}
    return out


def list_for(db: Session, actor: users.UserOut, area_id=None, assignee_id=None, status=None, q=None) -> list[TicketOut]:
    if not _staff(actor):
        assignee_id, area_id = actor.id, None
    tickets = repo.list_(db, assignee_id=assignee_id, area_id=area_id, status=status, q=q)
    names = users.names(db, {t.assignee_id for t in tickets})
    pending = repo.pending_by_ticket(db, [t.id for t in tickets if t.status == "pendiente"])
    return [_out(t, names, pending.get(t.id)) for t in tickets]


def detail(db: Session, actor: users.UserOut, ticket_id: int) -> TicketDetail:
    return _detail(db, _visible(db, actor, ticket_id))


def attachment(db: Session, actor: users.UserOut, attachment_id: int):
    a = repo.get_attachment(db, attachment_id)
    if not a:
        raise NotFound
    _visible(db, actor, a.ticket_id)
    return a


def peers(db: Session, actor: users.UserOut) -> list[Person]:
    """Compañeros del área del Usuario, para proponer una reasignación."""
    if not actor.area_id:
        return []
    return [Person(id=u.id, name=u.name, level=u.level) for u in users.active_in_area(db, actor.area_id) if u.id != actor.id]


def people(db: Session, actor: users.UserOut, area_id: int) -> list[Person]:
    _require_staff(actor)
    return [Person(id=u.id, name=u.name, level=u.level) for u in users.active_in_area(db, area_id)]


# --- Acciones ------------------------------------------------------------------------------------

def create(db: Session, actor: users.UserOut, data: TicketIn, files: list[Upload] = ()) -> TicketDetail:
    _require_staff(actor)
    area = areas.get(db, data.area_id)
    if not area or not area.is_active:
        raise Conflict("Selecciona un área activa.")
    user = _person(db, data.assignee_id, area.id)
    _check_files(files)
    t = Ticket(title=data.title.strip(), description=data.description.strip(), priority=data.priority,
               client_name=(data.client_name or "").strip() or None,
               client_email=data.client_email.lower() if data.client_email else None, created_by=actor.id)
    _assign(db, t, user)
    repo.add(db, t)
    _event(db, t, "created", actor.id, data={"to": user.id}, files=files)
    return _done(db, actor.id, t, "created")


def propose(db: Session, actor: users.UserOut, ticket_id: int, data: ProposalIn, files: list[Upload] = ()) -> TicketDetail:
    t = _visible(db, actor, ticket_id)
    if t.assignee_id != actor.id:
        raise Forbidden("Solo la persona asignada puede proponer acciones.")
    _open(t)
    if repo.pending(db, t.id):
        raise Conflict("Ya hay una propuesta pendiente de aprobación.")
    _check_files(files)
    payload = {}
    if data.kind == "update":
        due = _aware(data.due_at)
        if due <= now():
            raise Conflict("La fecha tentativa debe ser futura.")
        payload["due_at"] = due.isoformat()
    elif data.kind == "reassign" and data.user_id:
        if data.user_id == actor.id:
            raise Conflict("Elige a otro compañero.")
        payload["user_id"] = _person(db, data.user_id, t.area_id).id
    elif data.kind == "reassign":
        area = areas.get(db, data.area_id)
        if not area or not area.is_active or area.id == t.area_id:
            raise Conflict("Elige otra área activa.")
        payload["area_id"] = area.id
    _event(db, t, data.kind, actor.id, data.comment, payload, "pending", files)
    t.status = "pendiente"
    return _done(db, actor.id, t, "proposed", {"proposal": data.kind})


def _proposal(db: Session, actor: users.UserOut, ticket_id: int, event_id: int) -> tuple[Ticket, Event]:
    _require_staff(actor)
    t = _visible(db, actor, ticket_id)
    p = repo.pending(db, t.id)
    if not p or p.id != event_id:
        raise Conflict("La propuesta ya fue decidida.")
    return t, p


def accept(db: Session, actor: users.UserOut, ticket_id: int, event_id: int, data: DecisionIn) -> TicketDetail:
    t, p = _proposal(db, actor, ticket_id, event_id)
    if p.kind == "close" and not data.outcome:
        raise Conflict("Indica si el ticket quedó resuelto o no resuelto.")
    target = None
    if p.kind == "reassign":
        if p.data.get("area_id"):
            if not data.user_id:
                raise Conflict("Elige a la persona del área destino.")
            target = _person(db, data.user_id, p.data["area_id"])
        else:
            target = _person(db, p.data["user_id"], t.area_id)
    p.state, p.decided_by, p.decision_comment = "accepted", actor.id, data.comment.strip()
    if p.kind == "update":
        t.due_from, t.due_at, t.committed, t.status = now(), datetime.fromisoformat(p.data["due_at"]), True, "seguimiento"
    elif p.kind == "escalate":
        _escalate(db, t, actor.id)
    elif p.kind == "reassign":
        _move(db, t, actor.id, target, "reassign")
    else:
        p.data = {**p.data, "outcome": data.outcome}
        _close(t, data.outcome)
    return _done(db, actor.id, t, "accepted", {"proposal": p.kind})


def reject(db: Session, actor: users.UserOut, ticket_id: int, event_id: int, data: DecisionIn) -> TicketDetail:
    t, p = _proposal(db, actor, ticket_id, event_id)
    if not data.comment.strip():
        raise Conflict("Escribe el motivo del rechazo.")
    p.state, p.decided_by, p.decision_comment = "rejected", actor.id, data.comment.strip()
    _settle(t)
    return _done(db, actor.id, t, "rejected", {"proposal": p.kind})


def reassign(db: Session, actor: users.UserOut, ticket_id: int, data: ReassignIn) -> TicketDetail:
    _require_staff(actor)
    t = _visible(db, actor, ticket_id)
    _open(t)
    user = _person(db, data.user_id)
    _cancel_pending(db, t)
    _move(db, t, actor.id, user, "manual", data.comment)
    return _done(db, actor.id, t, "reassigned", {"to": user.id})


def close(db: Session, actor: users.UserOut, ticket_id: int, data: CloseIn) -> TicketDetail:
    _require_staff(actor)
    t = _visible(db, actor, ticket_id)
    _open(t)
    _cancel_pending(db, t)
    _close(t, data.outcome)
    _event(db, t, "closed", actor.id, data.comment, {"outcome": data.outcome})
    return _done(db, actor.id, t, "closed", {"outcome": data.outcome})


def set_status(db: Session, actor: users.UserOut, ticket_id: int, data: SetStatusIn) -> TicketDetail:
    _require_staff(actor)
    t = _visible(db, actor, ticket_id)
    _open(t)
    st = repo.get_status(db, data.status_id) if data.status_id else None
    if data.status_id and (not st or not st.is_active):
        raise Conflict("Elige un estatus activo del catálogo.")
    if t.status_id == data.status_id:
        return _detail(db, t)
    t.status_id = data.status_id
    _event(db, t, "status", actor.id, data={"name": st.name if st else None})
    return _done(db, actor.id, t, "status", {"name": st.name if st else None})


# --- Catálogo de estatus ----------------------------------------------------------------------------

def list_statuses(db: Session) -> list[StatusOut]:
    return [StatusOut.model_validate(x) for x in repo.statuses(db)]


def save_status(db: Session, actor: users.UserOut, data: StatusIn, status_id: int | None = None) -> StatusOut:
    _require_staff(actor)
    name = data.name.strip()
    other = repo.status_by_name(db, name)
    if other and other.id != status_id:
        raise Conflict("Ya existe un estatus con ese nombre.")
    st = repo.get_status(db, status_id) if status_id else repo.add(db, TrackingStatus(name=name))
    if not st:
        raise NotFound
    st.name, st.is_active = name, data.is_active
    db.commit()
    return StatusOut.model_validate(st)


def reopen(db: Session, actor: users.UserOut, ticket_id: int, data: ReopenIn) -> TicketDetail:
    _require_staff(actor)
    t = _visible(db, actor, ticket_id)
    if t.status != "cerrado":
        raise Conflict("Solo se puede reabrir un ticket cerrado.")
    user = _person(db, data.user_id or t.assignee_id)
    t.outcome, t.closed_at = None, None
    _event(db, t, "reopened", actor.id, data.comment)
    _move(db, t, actor.id, user, "reopen")
    return _done(db, actor.id, t, "reopened")
