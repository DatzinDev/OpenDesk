"""Áreas, días festivos, área y responsable directo de usuarios"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"


def upgrade():
    op.create_table(
        "areas_areas",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(80), nullable=False, unique=True),
        sa.Column("description", sa.String(240), nullable=False, server_default=""),
        sa.Column("sla_hours", sa.Integer, nullable=False, server_default="24"),
        sa.Column("always_open", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("days", sa.String(13), nullable=False, server_default="0,1,2,3,4"),
        sa.Column("start_time", sa.Time, nullable=False, server_default="09:00"),
        sa.Column("end_time", sa.Time, nullable=False, server_default="18:00"),
        sa.Column("pause_on_holidays", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("sla_hours >= 1", name="ck_areas_sla_hours"),
    )
    op.create_table(
        "areas_holidays",
        sa.Column("day", sa.Date, primary_key=True),
        sa.Column("name", sa.String(80), nullable=False),
    )
    op.add_column("users_users", sa.Column("area_id", sa.Integer, sa.ForeignKey("areas_areas.id"), index=True))
    op.add_column("users_users", sa.Column("manager_id", sa.Integer, sa.ForeignKey("users_users.id"), index=True))


def downgrade():
    op.drop_column("users_users", "manager_id")
    op.drop_column("users_users", "area_id")
    op.drop_table("areas_holidays")
    op.drop_table("areas_areas")
