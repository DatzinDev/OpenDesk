"""Fecha de decisión de propuestas para actividad e historial."""
from alembic import op
import sqlalchemy as sa

revision = "0013"
down_revision = "0012"


def upgrade():
    op.add_column("tickets_events", sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True))


def downgrade():
    op.drop_column("tickets_events", "decided_at")
