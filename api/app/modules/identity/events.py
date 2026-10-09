from dataclasses import dataclass


@dataclass(frozen=True)
class LoginSucceeded:
    user_id: int
    email: str


@dataclass(frozen=True)
class LoginDenied:
    email: str
    reason: str
