import os
import tempfile

# Base de datos aislada para pruebas; se define antes de importar la aplicación.
os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"

import pytest  # noqa: E402

from app.core.db import Base, SessionLocal, engine  # noqa: E402
from app.modules import audit, identity, notifications, users  # noqa: E402
from app.modules.areas import models as _ar  # noqa: E402,F401
from app.modules.audit import models as _a  # noqa: E402,F401
from app.modules.identity import models as _i  # noqa: E402,F401
from app.shared import events, mailer  # noqa: E402


@pytest.fixture
def db(monkeypatch):
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    events._handlers.clear()
    audit.register()
    identity.register()
    users.register()
    notifications.register()
    sent = []
    monkeypatch.setattr(mailer, "send", lambda to, subject, html: sent.append((to, subject)))
    with SessionLocal() as s:
        s.sent = sent
        yield s
