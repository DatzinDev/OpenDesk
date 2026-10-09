"""Avisos en sistema y control de avisos enviados por ticket"""
from alembic import op
import sqlalchemy as sa

revision = "0007"
down_revision = "0006"


def upgrade():
    for col in ("sla_warned", "reminded", "overdue_notified"):
        op.add_column("tickets_tickets", sa.Column(col, sa.Boolean, nullable=False, server_default=sa.false()))
    op.create_table(
        "notifications_notifications",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users_users.id"), nullable=False),
        sa.Column("ticket_id", sa.Integer, sa.ForeignKey("tickets_tickets.id")),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("body", sa.String(500), nullable=False, server_default=""),
        sa.Column("read_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_notifications_user_created", "notifications_notifications", ["user_id", "created_at"])


def downgrade():
    op.drop_table("notifications_notifications")
    for col in ("sla_warned", "reminded", "overdue_notified"):
        op.drop_column("tickets_tickets", col)
