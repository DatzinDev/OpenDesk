"""Usuarios, sesiones y auditoría"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None


def upgrade():
    op.create_table(
        "users_users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("email", sa.String(254), nullable=False, unique=True, index=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("picture", sa.String(500)),
        sa.Column("role", sa.String(10), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("is_root", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("last_login_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("role IN ('admin','gestor','usuario')", name="ck_users_role"),
    )
    op.create_table(
        "identity_sessions",
        sa.Column("token_hash", sa.String(64), primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users_users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "audit_log",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), index=True),
        sa.Column("actor_id", sa.Integer),
        sa.Column("action", sa.String(40), nullable=False, index=True),
        sa.Column("entity", sa.String(40)),
        sa.Column("entity_id", sa.String(40)),
        sa.Column("data", sa.JSON, nullable=False),
    )


def downgrade():
    op.drop_table("audit_log")
    op.drop_table("identity_sessions")
    op.drop_table("users_users")
