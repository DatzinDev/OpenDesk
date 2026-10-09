"""Tickets, línea de tiempo con propuestas y adjuntos"""
from alembic import op
import sqlalchemy as sa

revision = "0005"
down_revision = "0004"

TS = sa.DateTime(timezone=True)


def upgrade():
    op.create_table(
        "tickets_tickets",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("title", sa.String(160), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("area_id", sa.Integer, sa.ForeignKey("areas_areas.id"), nullable=False, index=True),
        sa.Column("assignee_id", sa.Integer, sa.ForeignKey("users_users.id"), nullable=False, index=True),
        sa.Column("priority", sa.String(5), nullable=False, server_default="media"),
        sa.Column("client_name", sa.String(120)),
        sa.Column("client_email", sa.String(254)),
        sa.Column("status", sa.String(12), nullable=False, server_default="asignado"),
        sa.Column("outcome", sa.String(12)),
        sa.Column("due_from", TS, nullable=False),
        sa.Column("due_at", TS, nullable=False),
        sa.Column("committed", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("needs_manager", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("created_by", sa.Integer, sa.ForeignKey("users_users.id"), nullable=False),
        sa.Column("created_at", TS, nullable=False, server_default=sa.func.now()),
        sa.Column("closed_at", TS),
        sa.CheckConstraint("priority IN ('alta','media','baja')", name="ck_tickets_priority"),
        sa.CheckConstraint("status IN ('asignado','pendiente','seguimiento','cerrado')", name="ck_tickets_status"),
    )
    op.create_table(
        "tickets_events",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("ticket_id", sa.Integer, sa.ForeignKey("tickets_tickets.id"), nullable=False, index=True),
        sa.Column("kind", sa.String(20), nullable=False),
        sa.Column("actor_id", sa.Integer, sa.ForeignKey("users_users.id")),
        sa.Column("comment", sa.Text, nullable=False, server_default=""),
        sa.Column("data", sa.JSON, nullable=False, server_default="{}"),
        sa.Column("state", sa.String(10)),
        sa.Column("decided_by", sa.Integer, sa.ForeignKey("users_users.id")),
        sa.Column("decision_comment", sa.Text, nullable=False, server_default=""),
        sa.Column("created_at", TS, nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ux_tickets_one_pending", "tickets_events", ["ticket_id"], unique=True,
                    postgresql_where=sa.text("state = 'pending'"))
    op.create_table(
        "tickets_attachments",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("ticket_id", sa.Integer, sa.ForeignKey("tickets_tickets.id"), nullable=False, index=True),
        sa.Column("event_id", sa.Integer, sa.ForeignKey("tickets_events.id"), nullable=False, index=True),
        sa.Column("key", sa.String(200), nullable=False),
        sa.Column("filename", sa.String(200), nullable=False),
        sa.Column("content_type", sa.String(100), nullable=False),
        sa.Column("size", sa.Integer, nullable=False),
        sa.Column("uploaded_by", sa.Integer, sa.ForeignKey("users_users.id"), nullable=False),
        sa.Column("created_at", TS, nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table("tickets_attachments")
    op.drop_table("tickets_events")
    op.drop_table("tickets_tickets")
