"""Parámetros globales editables"""
from alembic import op
import sqlalchemy as sa

revision = "0010"
down_revision = "0009"


def upgrade():
    op.create_table(
        "settings_params",
        sa.Column("key", sa.String(40), primary_key=True),
        sa.Column("value", sa.JSON),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_by", sa.Integer, sa.ForeignKey("users_users.id")),
    )


def downgrade():
    op.drop_table("settings_params")
