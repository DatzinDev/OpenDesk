from dataclasses import dataclass, field


@dataclass(frozen=True)
class AreaSaved:
    actor_id: int
    area_id: int
    name: str
    created: bool
    changes: dict = field(default_factory=dict)


@dataclass(frozen=True)
class HolidaysChanged:
    actor_id: int
    day: str
    name: str
    removed: bool
