"""Formularios de tickets y encuestas versionadas por envío."""
from alembic import op
import sqlalchemy as sa

revision = "0012"
down_revision = "0011"


def upgrade():
    op.add_column("surveys_surveys", sa.Column("questions", sa.JSON(), nullable=False, server_default="[]"))
    op.add_column("surveys_surveys", sa.Column("ratings", sa.JSON(), nullable=False, server_default="{}"))
    params = sa.table("settings_params", sa.column("key", sa.String), sa.column("value", sa.JSON))
    op.execute(params.insert().values(key="survey_form", value={"revision": 0, "questions": []}))
    # Los enlaces existentes también conservan el texto vigente al migrar.
    bind = op.get_bind()
    configured = bind.execute(sa.select(params.c.value).where(params.c.key == "survey_question")).scalar()
    template = configured or "¿Qué tan satisfecho quedaste con la atención a tu solicitud “{titulo}”?"
    surveys = sa.table("surveys_surveys", sa.column("id", sa.Integer), sa.column("ticket_id", sa.Integer), sa.column("rating", sa.Integer), sa.column("questions", sa.JSON), sa.column("ratings", sa.JSON))
    tickets = sa.table("tickets_tickets", sa.column("id", sa.Integer), sa.column("title", sa.String))
    main = "00000000-0000-0000-0000-000000000001"
    for id, title, rating in bind.execute(sa.select(surveys.c.id, tickets.c.title, surveys.c.rating).join(tickets, tickets.c.id == surveys.c.ticket_id)):
        bind.execute(surveys.update().where(surveys.c.id == id).values(questions=[{"id": main, "label": template.replace("{titulo}", title), "help": "", "required": True, "active": True}], ratings={main: rating} if rating else {}))


def downgrade():
    op.execute("DELETE FROM settings_params WHERE key = 'survey_form'")
    op.drop_column("surveys_surveys", "ratings")
    op.drop_column("surveys_surveys", "questions")
