from alembic import context

from app.core.db import Base, engine
from app.modules.areas import models as _areas  # noqa: F401
from app.modules.audit import models as _audit  # noqa: F401  registra tablas en Base.metadata
from app.modules.identity import models as _identity  # noqa: F401
from app.modules.users import models as _users  # noqa: F401
from app.modules.tickets import models as _tickets  # noqa: F401
from app.modules.notifications import models as _notifications  # noqa: F401
from app.modules.surveys import models as _surveys  # noqa: F401
from app.modules.settings import models as _settings  # noqa: F401

with engine.connect() as connection:
    context.configure(connection=connection, target_metadata=Base.metadata)
    with context.begin_transaction():
        context.run_migrations()
