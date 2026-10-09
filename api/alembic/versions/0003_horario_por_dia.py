"""Horario de atención independiente por día de la semana"""
import json

from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"


def upgrade():
    op.add_column("areas_areas", sa.Column("week", sa.JSON))
    conn = op.get_bind()
    for id_, days, start, end in conn.execute(sa.text("SELECT id, days, start_time, end_time FROM areas_areas")):
        selected = {int(d) for d in days.split(",") if d}
        week = [[start.strftime("%H:%M"), end.strftime("%H:%M")] if i in selected else None for i in range(7)]
        conn.execute(sa.text("UPDATE areas_areas SET week = :w WHERE id = :id"), {"w": json.dumps(week), "id": id_})
    conn.execute(sa.text("""UPDATE areas_areas SET week = '[["09:00","18:00"],["09:00","18:00"],["09:00","18:00"],["09:00","18:00"],["09:00","18:00"],null,null]' WHERE week IS NULL"""))
    op.alter_column("areas_areas", "week", nullable=False)
    op.drop_column("areas_areas", "days")
    op.drop_column("areas_areas", "start_time")
    op.drop_column("areas_areas", "end_time")


def downgrade():
    raise NotImplementedError("Migración sin retroceso: el horario por día no cabe en una sola ventana.")
