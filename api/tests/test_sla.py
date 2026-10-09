from datetime import date, datetime, time
from zoneinfo import ZoneInfo

from app.modules.areas.sla import Schedule, deadline

TZ = ZoneInfo("America/Mexico_City")
OFFICE = Schedule(always_open=False, days=frozenset(range(5)), start=time(9), end=time(18))
FRI_15 = datetime(2026, 10, 9, 15, tzinfo=TZ)  # viernes


def test_always_open():
    assert deadline(datetime(2026, 10, 7, 9, tzinfo=TZ), 12, Schedule(True, frozenset(), time(9), time(18)), TZ) == datetime(2026, 10, 7, 21, tzinfo=TZ)


def test_office_hours_skip_weekend():
    assert deadline(FRI_15, 12, OFFICE, TZ) == datetime(2026, 10, 12, 18, tzinfo=TZ)


def test_weekend_assignment_starts_monday():
    assert deadline(datetime(2026, 10, 10, 11, tzinfo=TZ), 1, OFFICE, TZ) == datetime(2026, 10, 12, 10, tzinfo=TZ)


def test_holiday_pauses():
    office = Schedule(False, frozenset(range(5)), time(9), time(18), holidays=frozenset({date(2026, 10, 12)}))
    assert deadline(FRI_15, 12, office, TZ) == datetime(2026, 10, 13, 18, tzinfo=TZ)
