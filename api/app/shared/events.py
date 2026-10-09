"""Bus de eventos en proceso. Sustituible por un broker sin cambiar emisores ni suscriptores."""
import logging
from collections import defaultdict
from typing import Callable

log = logging.getLogger(__name__)
_handlers: dict[type, list[Callable]] = defaultdict(list)


def subscribe(event_type: type, handler: Callable) -> None:
    _handlers[event_type].append(handler)


def publish(event) -> None:
    # ponytail: síncrono y en el mismo proceso; un suscriptor que falla no detiene a los demás.
    for handler in _handlers[type(event)]:
        try:
            handler(event)
        except Exception:
            log.exception("Fallo en suscriptor %s de %s", handler.__name__, type(event).__name__)
