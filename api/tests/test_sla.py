from datetime import date, datetime, time
from zoneinfo import ZoneInfo

from app.modules.areas.sla import Schedule, deadline

TZ = ZoneInfo("America/Mexico_City")
NINE_SIX = (time(9), time(18))
OFFICE = Schedule(always_open=False, week=(NINE_SIX,) * 5 + (None, None))
FRI_15 = datetime(2026, 10, 9, 15, tzinfo=TZ)  # viernes


def test_always_open():
    assert deadline(datetime(2026, 10, 7, 9, tzinfo=TZ), 12, Schedule(always_open=True), TZ) == datetime(2026, 10, 7, 21, tzinfo=TZ)


def test_office_hours_skip_weekend():
    assert deadline(FRI_15, 12, OFFICE, TZ) == datetime(2026, 10, 12, 18, tzinfo=TZ)


def test_weekend_assignment_starts_monday():
    assert deadline(datetime(2026, 10, 10, 11, tzinfo=TZ), 1, OFFICE, TZ) == datetime(2026, 10, 12, 10, tzinfo=TZ)


def test_holiday_pauses():
    office = Schedule(False, OFFICE.week, holidays=frozenset({date(2026, 10, 12)}))
    assert deadline(FRI_15, 12, office, TZ) == datetime(2026, 10, 13, 18, tzinfo=TZ)


def test_saturday_with_own_hours():
    week = (NINE_SIX,) * 5 + ((time(9), time(14)), None)
    # viernes 15:00 -> 3 h viernes + 5 h sábado (9 a 14) + 4 h lunes = lunes 13:00
    assert deadline(FRI_15, 12, Schedule(False, week), TZ) == datetime(2026, 10, 12, 13, tzinfo=TZ)
