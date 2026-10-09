"""Datos adicionales del formulario global de tickets."""
from alembic import op
import sqlalchemy as sa

revision = "0011"
down_revision = "0010"


def upgrade():
    op.add_column("tickets_tickets", sa.Column("custom_values", sa.JSON(), nullable=False, server_default="{}"))
    # La fila existe antes del primer alta para que FOR UPDATE también proteja la revisión cero.
    params = sa.table("settings_params", sa.column("key", sa.String), sa.column("value", sa.JSON))
    op.execute(params.insert().values(key="ticket_form", value={"revision": 0, "fields": []}))


def downgrade():
    op.execute("DELETE FROM settings_params WHERE key = 'ticket_form'")
    op.drop_column("tickets_tickets", "custom_values")
