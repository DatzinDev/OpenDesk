"""Encuestas de satisfacción (CSAT 1 a 5)"""
from alembic import op
import sqlalchemy as sa

revision = "0009"
down_revision = "0008"

TS = sa.DateTime(timezone=True)


def upgrade():
    op.create_table(
        "surveys_surveys",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("uuid", sa.Uuid, nullable=False, unique=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("ticket_id", sa.Integer, sa.ForeignKey("tickets_tickets.id"), nullable=False, index=True),
        sa.Column("email", sa.String(254), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("sent_at", TS, nullable=False, server_default=sa.func.now()),
        sa.Column("expires_at", TS, nullable=False),
        sa.Column("rating", sa.Integer),
        sa.Column("comment", sa.Text, nullable=False, server_default=""),
        sa.Column("answered_at", TS),
        sa.CheckConstraint("rating BETWEEN 1 AND 5", name="ck_surveys_rating"),
    )


def downgrade():
    op.drop_table("surveys_surveys")
