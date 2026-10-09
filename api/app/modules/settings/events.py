from dataclasses import dataclass, field


@dataclass(frozen=True)
class SettingsChanged:
    actor_id: int
    changes: dict = field(default_factory=dict)
