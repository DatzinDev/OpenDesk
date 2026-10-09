from dataclasses import dataclass, field


@dataclass(frozen=True)
class UserCreated:
    actor_id: int
    user_id: int
    email: str
    name: str
    role: str


@dataclass(frozen=True)
class UserUpdated:
    actor_id: int
    user_id: int
    email: str
    name: str
    changes: dict = field(default_factory=dict)  # campo -> [anterior, nuevo]
