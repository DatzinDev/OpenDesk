import os
import tempfile

# Base de datos aislada para pruebas; se define antes de importar la aplicación.
os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"

import pytest  # noqa: E402

from app.core.db import Base, SessionLocal, engine  # noqa: E402
from app.modules import audit, identity, notifications, surveys  # noqa: E402
from app.modules.areas import models as _ar  # noqa: E402,F401
from app.modules.audit import models as _a  # noqa: E402,F401
from app.modules.identity import models as _i  # noqa: E402,F401
from app.modules.tickets import models as _t  # noqa: E402,F401
from app.modules.notifications import models as _n  # noqa: E402,F401
from app.modules.surveys import models as _s  # noqa: E402,F401
from app.shared import events, mailer  # noqa: E402


@pytest.fixture
def db(monkeypatch):
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    events._handlers.clear()
    audit.register()
    identity.register()
    notifications.register()
    surveys.register()
    sent = []
    monkeypatch.setattr(mailer, "send", lambda to, subject, html: sent.append((to, subject)))
    with SessionLocal() as s:
        s.sent = sent
        yield s
