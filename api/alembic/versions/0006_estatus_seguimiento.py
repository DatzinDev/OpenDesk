"""Catálogo global de estatus de seguimiento"""
from alembic import op
import sqlalchemy as sa

revision = "0006"
down_revision = "0005"


def upgrade():
    op.create_table(
        "tickets_statuses",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(60), nullable=False, unique=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
    )
    op.add_column("tickets_tickets", sa.Column("status_id", sa.Integer, sa.ForeignKey("tickets_statuses.id")))


def downgrade():
    op.drop_column("tickets_tickets", "status_id")
    op.drop_table("tickets_statuses")
