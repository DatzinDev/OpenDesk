"""Cálculo del vencimiento del SLA según el horario de atención del área (docs/requisitos/02)."""
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

Window = tuple[time, time] | None  # horario de un día; None = no se atiende


@dataclass(frozen=True)
class Schedule:
    always_open: bool
    week: tuple[Window, ...] = (None,) * 7  # índice 0 = lunes ... 6 = domingo
    holidays: frozenset[date] = frozenset()  # vacío si el área no pausa en festivos


def deadline(start: datetime, hours: float, schedule: Schedule, tz: ZoneInfo) -> datetime:
    """Momento en que se consumen `hours` horas dentro del horario, a partir de `start`."""
    cursor = start.astimezone(tz)
    remaining = timedelta(hours=hours)
    for _ in range(3700):  # ~10 años de días; evita ciclos infinitos con horarios vacíos
        day = cursor.date()
        window = (time.min, None) if schedule.always_open else schedule.week[day.weekday()]
        if window and day not in schedule.holidays:
            window_start = datetime.combine(day, window[0], tz)
            window_end = datetime.combine(day, window[1], tz) if window[1] else window_start + timedelta(days=1)
            begin = max(cursor, window_start)
            if begin < window_end:
                available = window_end - begin
                if remaining <= available:
                    return begin + remaining
                remaining -= available
        cursor = datetime.combine(day + timedelta(days=1), time.min, tz)
    raise ValueError("El horario del área no tiene tiempo disponible.")
