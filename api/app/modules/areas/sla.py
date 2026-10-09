"""Cálculo del vencimiento del SLA según el horario de atención del área (docs/requisitos/02)."""
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo


@dataclass(frozen=True)
class Schedule:
    always_open: bool
    days: frozenset[int]  # 0 = lunes ... 6 = domingo
    start: time
    end: time
    holidays: frozenset[date] = frozenset()  # vacío si el área no pausa en festivos


def deadline(start: datetime, hours: float, schedule: Schedule, tz: ZoneInfo) -> datetime:
    """Momento en que se consumen `hours` horas dentro del horario, a partir de `start`."""
    cursor = start.astimezone(tz)
    remaining = timedelta(hours=hours)
    for _ in range(3700):  # ~10 años de días; evita ciclos infinitos con horarios vacíos
        day = cursor.date()
        open_day = day not in schedule.holidays and (schedule.always_open or day.weekday() in schedule.days)
        if open_day:
            if schedule.always_open:
                window_start = datetime.combine(day, time.min, tz)
                window_end = window_start + timedelta(days=1)
            else:
                window_start = datetime.combine(day, schedule.start, tz)
                window_end = datetime.combine(day, schedule.end, tz)
            begin = max(cursor, window_start)
            if begin < window_end:
                available = window_end - begin
                if remaining <= available:
                    return begin + remaining
                remaining -= available
        cursor = datetime.combine(day + timedelta(days=1), time.min, tz)
    raise ValueError("El horario del área no tiene tiempo disponible.")
