from dataclasses import dataclass, field


@dataclass(frozen=True)
class TicketChanged:
    """Cualquier movimiento en la línea de tiempo de un ticket (creación, propuesta, decisión, etc.)."""
    actor_id: int | None
    ticket_id: int
    kind: str
    data: dict = field(default_factory=dict)
