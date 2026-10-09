"""Niveles de escalamiento por área; reemplaza al responsable directo"""
from alembic import op
import sqlalchemy as sa

revision = "0004"
down_revision = "0003"


def upgrade():
    op.add_column("areas_areas", sa.Column("levels", sa.Integer, nullable=False, server_default="3"))
    op.create_check_constraint("ck_areas_levels", "areas_areas", "levels BETWEEN 1 AND 10")
    op.add_column("users_users", sa.Column("level", sa.Integer))
    op.execute("UPDATE users_users SET level = 1 WHERE role = 'usuario' AND area_id IS NOT NULL")
    op.drop_column("users_users", "manager_id")


def downgrade():
    op.add_column("users_users", sa.Column("manager_id", sa.Integer, sa.ForeignKey("users_users.id"), index=True))
    op.drop_column("users_users", "level")
    op.drop_constraint("ck_areas_levels", "areas_areas")
    op.drop_column("areas_areas", "levels")
