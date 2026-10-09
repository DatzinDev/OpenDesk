"""Identificador público UUID en cada tabla; el id entero queda para uso interno"""
from alembic import op
import sqlalchemy as sa

revision = "0008"
down_revision = "0007"

TABLES = ("users_users", "areas_areas", "audit_log", "tickets_tickets", "tickets_statuses", "tickets_events",
          "tickets_attachments", "notifications_notifications")


def upgrade():
    for t in TABLES:
        # gen_random_uuid() es nativo desde PostgreSQL 13; rellena las filas existentes.
        op.add_column(t, sa.Column("uuid", sa.Uuid, nullable=False, server_default=sa.text("gen_random_uuid()")))
        op.create_unique_constraint(f"uq_{t}_uuid", t, ["uuid"])


def downgrade():
    for t in TABLES:
        op.drop_constraint(f"uq_{t}_uuid", t)
        op.drop_column(t, "uuid")
