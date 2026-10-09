"""Métricas de atención a clientes. Definiciones en docs/requisitos/07-analitica.md."""
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.core import config
from app.core.db import now
from app.modules.analytics import repository as repo

TABS = ("summary", "times", "team", "flow", "clients", "demand", "me")
BUCKETS = (("< 4 h", 4), ("4–24 h", 24), ("1–3 d", 72), ("3–7 d", 168), ("> 7 d", None))
OPEN = ("asignado", "pendiente", "seguimiento")


@dataclass
class Filters:
    start: datetime
    end: datetime
    area_id: int | None = None
    priority: str | None = None
    user_id: int | None = None

    @classmethod
    def from_dates(cls, start: date, end: date, **kw) -> "Filters":
        """Días locales completos: [start 00:00, end + 1 día 00:00) en la zona horaria de la organización."""
        tz = ZoneInfo(config.APP_TIMEZONE)
        a = datetime.combine(start, datetime.min.time(), tz).astimezone(timezone.utc)
        b = datetime.combine(end + timedelta(days=1), datetime.min.time(), tz).astimezone(timezone.utc)
        return cls(a, b, **kw)


# --- utilidades ------------------------------------------------------------------------------------

def _utc(dt):
    return dt.replace(tzinfo=timezone.utc) if dt and not dt.tzinfo else dt


def _in(dt, a, b) -> bool:
    return dt is not None and a <= dt < b


def _pct(n, d):
    return round(100 * n / d, 1) if d else None


def _avg(xs):
    return round(sum(xs) / len(xs), 1) if xs else None


def _quantile(xs, q):
    """Percentil con interpolación lineal (q en 0..1); q=0.5 es la mediana."""
    if not xs:
        return None
    s = sorted(xs)
    pos = q * (len(s) - 1)
    lo = int(pos)
    hi = min(lo + 1, len(s) - 1)
    return round(s[lo] + (s[hi] - s[lo]) * (pos - lo), 1)


def _hours(a, b) -> float:
    return (b - a).total_seconds() / 3600


def _local(dt) -> datetime:
    return dt.astimezone(ZoneInfo(config.APP_TIMEZONE))


def _week(dt) -> str:
    d = _local(dt).date()
    return (d - timedelta(days=d.weekday())).isoformat()


def _bucket(hours: float) -> str:
    return next(label for label, top in BUCKETS if top is None or hours < top)


def _kpi(value, prev=None):
    return {"value": value, "prev": prev}


class Data:
    """Datos de un periodo normalizados (fechas en UTC) e indexados por ticket."""

    def __init__(self, raw: dict, names: dict, f: Filters):
        self.f, self.names, self.now = f, names, now()
        self.span = f.end - f.start
        self.prev = (f.start - self.span, f.start)
        for t in raw["tickets"]:
            for k in ("created_at", "closed_at", "due_from", "due_at"):
                t[k] = _utc(t[k])
        for e in raw["events"]:
            e["created_at"] = _utc(e["created_at"])
        for s in raw["surveys"]:
            s["sent_at"], s["answered_at"] = _utc(s["sent_at"]), _utc(s["answered_at"])
        self.tickets, self.events, self.surveys = raw["tickets"], raw["events"], raw["surveys"]
        self.by_id = {t["id"]: t for t in self.tickets}
        self.open = [t for t in self.tickets if t["status"] in OPEN]

    def user(self, uid) -> str:
        return (self.names["users"].get(uid) or {}).get("name", "Sin asignar")

    def area(self, aid) -> str:
        return self.names["areas"].get(aid, "Sin área")

    # Hechos por periodo -------------------------------------------------------------------------------
    def responses(self, a, b):
        """Primeras respuestas aceptadas (traen sla_met) y SLA vencidos con auto-escalamiento."""
        ok = [e for e in self.events if e["state"] == "accepted" and "sla_met" in e["data"] and _in(e["created_at"], a, b)]
        autos = [e for e in self.events if e["kind"] == "assigned" and e["data"].get("reason") == "auto"
                 and _in(e["created_at"], a, b)]
        return ok, autos

    def sla_pct(self, a, b):
        ok, autos = self.responses(a, b)
        return _pct(sum(1 for e in ok if e["data"]["sla_met"]), len(ok) + len(autos))

    def closed(self, a, b):
        return [t for t in self.tickets if _in(t["closed_at"], a, b)]

    def resolution(self, a, b):
        return [_hours(t["created_at"], t["closed_at"]) for t in self.closed(a, b)]

    def first_response(self, a, b):
        return [e["data"]["first_response_min"] / 60 for e in self.responses(a, b)[0]]

    def answered(self, a, b):
        return [s for s in self.surveys if _in(s["answered_at"], a, b) and s["rating"]]

    def csat(self, a, b):
        return _avg([s["rating"] for s in self.answered(a, b)])

    def closings(self, a, b):
        """Eventos que cerraron un ticket: propuesta de cierre aceptada o cierre directo del Gestor."""
        return [e for e in self.events if _in(e["created_at"], a, b) and "outcome" in e["data"]
                and ((e["kind"] == "close" and e["state"] == "accepted") or e["kind"] == "closed")]

    def created(self, a, b):
        return [t for t in self.tickets if _in(t["created_at"], a, b)]


def _data(db: Session, f: Filters) -> Data:
    since = f.start - (f.end - f.start)  # incluye el periodo anterior para comparar
    return Data(repo.load(db, since, f.end, f.area_id, f.priority, f.user_id), repo.names(db), f)


def _both(d: Data, fn):
    """KPI del periodo y del periodo anterior equivalente."""
    return _kpi(fn(d.f.start, d.f.end), fn(*d.prev))


def _days(d: Data):
    day = _local(d.f.start).date()
    while True:
        a = datetime.combine(day, datetime.min.time(), ZoneInfo(config.APP_TIMEZONE)).astimezone(timezone.utc)
        if a >= d.f.end:
            return
        yield day, a, a + timedelta(days=1)
        day += timedelta(days=1)


def _weeks(d: Data, items, when, value=len):
    groups = defaultdict(list)
    for x in items:
        groups[_week(when(x))].append(x)
    return [{"semana": w, "valor": value(xs)} for w, xs in sorted(groups.items())]


# --- pestañas --------------------------------------------------------------------------------------

def summary(d: Data) -> dict:
    n = d.now
    daily = []
    for day, a, b in _days(d):
        alive = sum(1 for t in d.tickets if t["created_at"] < b and (t["closed_at"] is None or t["closed_at"] >= b))
        daily.append({"dia": day.isoformat(), "creados": len(d.created(a, b)), "cerrados": len(d.closed(a, b)),
                      "abiertos": alive})
    by_status = Counter(t["status"] for t in d.open)
    return {
        "kpis": {
            "open": _kpi(len(d.open)),
            "pending": _kpi(by_status["pendiente"]),
            "overdue_sla": _kpi(sum(1 for t in d.open if not t["committed"] and t["due_at"] < n)),
            "overdue_commitment": _kpi(sum(1 for t in d.open if t["committed"] and t["due_at"] < n)),
            "needs_manager": _kpi(sum(1 for t in d.open if t["needs_manager"])),
            "created": _both(d, lambda a, b: len(d.created(a, b))),
            "closed": _both(d, lambda a, b: len(d.closed(a, b))),
            "sla": _both(d, d.sla_pct),
            "csat": _both(d, d.csat),
        },
        "series": {
            "daily": daily,
            "by_status": [{"estado": s, "tickets": by_status[s]} for s in OPEN],
        },
    }


def times(d: Data) -> dict:
    f = d.f
    commitment = lambda a, b: _pct(sum(1 for e in d.closings(a, b) if e["data"].get("commitment_met")),
                                   sum(1 for e in d.closings(a, b) if e["data"].get("committed")))
    ok, autos = d.responses(f.start, f.end)
    weekly = defaultdict(lambda: [0, 0])
    by_area = defaultdict(lambda: [0, 0])
    for e in ok + autos:
        met = bool(e["data"].get("sla_met"))
        area = d.by_id[e["ticket_id"]]["area_id"]
        for key, bucket in ((_week(e["created_at"]), weekly), (area, by_area)):
            bucket[key][0] += met
            bucket[key][1] += 1
    res = Counter(_bucket(h) for h in d.resolution(f.start, f.end))
    aging = Counter(_bucket(_hours(t["created_at"], d.now)) for t in d.open)
    return {
        "kpis": {
            "sla": _both(d, d.sla_pct),
            "first_response_median": _both(d, lambda a, b: _quantile(d.first_response(a, b), 0.5)),
            "first_response_p90": _both(d, lambda a, b: _quantile(d.first_response(a, b), 0.9)),
            "resolution_median": _both(d, lambda a, b: _quantile(d.resolution(a, b), 0.5)),
            "resolution_p90": _both(d, lambda a, b: _quantile(d.resolution(a, b), 0.9)),
            "commitment": _both(d, commitment),
            "auto_escalations": _both(d, lambda a, b: len(d.responses(a, b)[1])),
        },
        "series": {
            "weekly_sla": [{"semana": w, "sla": _pct(m, n)} for w, (m, n) in sorted(weekly.items())],
            "sla_by_area": sorted(({"area": d.area(a), "sla": _pct(m, n), "respuestas": n} for a, (m, n) in by_area.items()),
                                  key=lambda x: x["area"]),
            "resolution": [{"rango": label, "tickets": res[label]} for label, _ in BUCKETS],
            "aging": [{"rango": label, "tickets": aging[label]} for label, _ in BUCKETS],
        },
    }


def team(d: Data) -> dict:
    f = d.f
    people = {uid: u for uid, u in d.names["users"].items() if u["role"] == "usuario" and u["is_active"]
              and (not f.area_id or u["area_id"] == f.area_id)}
    ok, autos = d.responses(f.start, f.end)
    rows = []
    for uid, u in people.items():
        mine_ok = [e for e in ok if e["actor_id"] == uid]
        mine_auto = [e for e in autos if e["data"].get("from") == uid]
        closed = [t for t in d.closed(f.start, f.end) if t["assignee_id"] == uid]
        closed_ids = {t["id"] for t in closed}
        decided = [e for e in d.events if e["actor_id"] == uid and e["state"] in ("accepted", "rejected")
                   and _in(e["created_at"], f.start, f.end)]
        rows.append({
            "persona": u["name"], "area": d.area(u["area_id"]), "nivel": u["level"],
            "carga": sum(1 for t in d.open if t["assignee_id"] == uid),
            "cerrados": len(closed),
            "sla": _pct(sum(1 for e in mine_ok if e["data"]["sla_met"]), len(mine_ok) + len(mine_auto)),
            "primera_respuesta": _avg([e["data"]["first_response_min"] / 60 for e in mine_ok]),
            "resolucion": _avg([_hours(t["created_at"], t["closed_at"]) for t in closed]),
            "csat": _avg([s["rating"] for s in d.answered(f.start, f.end) if s["ticket_id"] in closed_ids]),
            "rechazos": _pct(sum(1 for e in decided if e["state"] == "rejected"), len(decided)),
            "escalamientos": sum(1 for e in decided if e["kind"] == "escalate"),
        })
    rows.sort(key=lambda r: (-r["carga"], r["persona"]))
    levels = Counter((d.names["users"].get(t["assignee_id"]) or {}).get("level") for t in d.open)
    return {
        "kpis": {
            "people": _kpi(len(rows)),
            "avg_load": _kpi(_avg([r["carga"] for r in rows])),
            "max_load": _kpi(max((r["carga"] for r in rows), default=0)),
        },
        "series": {
            "people": rows,
            "load_by_level": [{"nivel": f"Nivel {lv}", "tickets": n} for lv, n in sorted(levels.items(), key=lambda x: x[0] or 0) if lv],
        },
    }


def flow(d: Data) -> dict:
    f = d.f
    kinds = ("update", "escalate", "reassign", "close")
    proposals = [e for e in d.events if e["kind"] in kinds and e["state"] and _in(e["created_at"], f.start, f.end)]
    by_kind = {k: Counter(e["state"] for e in proposals if e["kind"] == k) for k in kinds}
    moves = [e for e in d.events if e["kind"] == "assigned" and _in(e["created_at"], f.start, f.end)]
    esc = [e for e in moves if e["data"].get("reason") in ("escalate", "auto")]
    weekly = defaultdict(lambda: {"manuales": 0, "automaticos": 0})
    for e in esc:
        weekly[_week(e["created_at"])]["automaticos" if e["data"]["reason"] == "auto" else "manuales"] += 1
    pairs = Counter()
    for e in moves:
        origin = (d.names["users"].get(e["data"].get("from")) or {}).get("area_id")
        if e["data"].get("reason") in ("reassign", "manual") and origin and origin != e["data"].get("area_id"):
            pairs[(d.area(origin), d.area(e["data"].get("area_id")))] += 1
    reopened = {e["ticket_id"] for e in d.events if e["kind"] == "reopened" and _in(e["created_at"], f.start, f.end)}
    tracking = Counter(d.names["statuses"].get(t["status_id"], "Sin estatus") for t in d.open)
    decided = [e for e in proposals if e["state"] in ("accepted", "rejected")]
    closed = len(d.closed(f.start, f.end))
    return {
        "kpis": {
            "proposals": _kpi(len(proposals)),
            "rejection": _kpi(_pct(sum(1 for e in decided if e["state"] == "rejected"), len(decided))),
            "reopen": _kpi(_pct(len(reopened), closed + len(reopened))),
            "cross_area": _kpi(sum(pairs.values())),
        },
        "series": {
            "proposals": [{"tipo": k, "aceptadas": c["accepted"], "rechazadas": c["rejected"], "pendientes": c["pending"],
                           "canceladas": c["cancelled"]} for k, c in by_kind.items()],
            "escalations": [{"semana": w, **v} for w, v in sorted(weekly.items())],
            "cross_area": [{"origen": o, "destino": t, "tickets": n} for (o, t), n in pairs.most_common()],
            "tracking": [{"estatus": s, "tickets": n} for s, n in tracking.most_common()],
        },
    }


def clients(d: Data) -> dict:
    f = d.f
    answered = d.answered(f.start, f.end)
    sent = [s for s in d.surveys if _in(s["sent_at"], f.start, f.end)]
    created = d.created(f.start, f.end)
    by_client = Counter((t["client_name"] or t["client_email"]) for t in created if t["client_name"] or t["client_email"])
    open_by_client = Counter((t["client_name"] or t["client_email"]) for t in d.open if t["client_name"] or t["client_email"])
    closed = d.closed(f.start, f.end)
    weekly = defaultdict(list)
    for s in answered:
        weekly[_week(s["answered_at"])].append(s["rating"])
    comments = sorted((s for s in answered if s["comment"]), key=lambda s: s["answered_at"], reverse=True)[:8]
    return {
        "kpis": {
            "csat": _both(d, d.csat),
            "response_rate": _kpi(_pct(sum(1 for s in sent if s["rating"]), len(sent))),
            "resolved": _both(d, lambda a, b: _pct(sum(1 for t in d.closed(a, b) if t["outcome"] == "resuelto"),
                                                   len(d.closed(a, b)))),
            "recurrent": _kpi(sum(1 for n in by_client.values() if n > 1)),
        },
        "series": {
            "ratings": [{"calificacion": str(r), "respuestas": sum(1 for s in answered if s["rating"] == r)} for r in range(1, 6)],
            "weekly_csat": [{"semana": w, "csat": _avg(rs)} for w, rs in sorted(weekly.items())],
            "outcomes": [{"resultado": o, "tickets": sum(1 for t in closed if t["outcome"] == o)} for o in ("resuelto", "no_resuelto")],
            "top_clients": [{"cliente": c, "tickets": n, "abiertos": open_by_client[c]} for c, n in by_client.most_common(10)],
            "comments": [{"folio": f"OD-{s['ticket_id']:06d}", "calificacion": s["rating"], "comentario": s["comment"],
                          "fecha": s["answered_at"].isoformat()} for s in comments],
        },
    }


def demand(d: Data) -> dict:
    f = d.f
    created = d.created(f.start, f.end)
    heat = Counter((_local(t["created_at"]).weekday(), _local(t["created_at"]).hour) for t in created)
    days = max(1, round(d.span / timedelta(days=1)))
    return {
        "kpis": {
            "created": _both(d, lambda a, b: len(d.created(a, b))),
            "per_day": _kpi(round(len(created) / days, 1)),
            "peak_hour": _kpi(Counter(h for (_, h) in heat.elements()).most_common(1)[0][0] if heat else None),
        },
        "series": {
            "heatmap": [{"dia": dw, "hora": h, "tickets": n} for (dw, h), n in sorted(heat.items())],
            "by_area": [{"area": d.area(a), "tickets": n} for a, n in Counter(t["area_id"] for t in created).most_common()],
            "by_priority": [{"prioridad": p, "tickets": sum(1 for t in created if t["priority"] == p)} for p in ("alta", "media", "baja")],
            "weekly": [{"semana": x["semana"], "tickets": x["valor"]} for x in _weeks(d, created, lambda t: t["created_at"])],
        },
    }


def me(d: Data) -> dict:
    f = d.f
    closed = d.closed(f.start, f.end)
    return {
        "kpis": {
            "open": _kpi(len(d.open)),
            "sla": _both(d, d.sla_pct),
            "first_response_median": _both(d, lambda a, b: _quantile(d.first_response(a, b), 0.5)),
            "resolution_median": _both(d, lambda a, b: _quantile(d.resolution(a, b), 0.5)),
            "csat": _both(d, d.csat),
        },
        "series": {
            "weekly_closed": [{"semana": x["semana"], "cerrados": x["valor"]} for x in _weeks(d, closed, lambda t: t["closed_at"])],
        },
    }


def report(db: Session, tab: str, f: Filters) -> dict:
    return globals()[tab](_data(db, f))


def export_rows(db: Session, f: Filters):
    """Tickets creados en el periodo con los filtros aplicados (RF-07.3)."""
    d = _data(db, f)
    ratings = {s["ticket_id"]: s["rating"] for s in sorted(d.surveys, key=lambda s: s["sent_at"])}
    yield ["Folio", "Título", "Área", "Asignado", "Prioridad", "Estado", "Resultado", "Cliente", "Correo del cliente",
           "Creado", "Cerrado", "Plazo vigente", "Con compromiso", "Estatus de seguimiento", "CSAT"]
    fmt = lambda dt: _local(dt).strftime("%Y-%m-%d %H:%M") if dt else ""
    for t in sorted(d.created(f.start, f.end), key=lambda t: t["id"]):
        yield [f"OD-{t['id']:06d}", t["title"], d.area(t["area_id"]), d.user(t["assignee_id"]), t["priority"],
               t["status"], t["outcome"] or "", t["client_name"] or "", t["client_email"] or "", fmt(t["created_at"]),
               fmt(t["closed_at"]), fmt(t["due_at"]), "sí" if t["committed"] else "no",
               d.names["statuses"].get(t["status_id"], ""), ratings.get(t["id"]) or ""]
