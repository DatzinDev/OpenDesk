from uuid import uuid4

import pytest
from app.modules.settings import form, survey_form
from app.modules.users import service as users


def root(db):
    users.ensure_root(db, "root@acme.com")
    return users.get_by_email(db, "root@acme.com")


def test_defaults_order_and_required_rules(db):
    definition = form.read(db)
    assert len(definition.system) == 8
    assert definition.order[0] == "title"
    description = next(f for f in definition.system if f.id == "description")
    description.required = False
    definition.order.reverse()
    saved = form.save(db, root(db), definition)
    assert saved.order[0] == "files"
    form.validate_system(saved, {"title": "Caso", "area_id": "area", "assignee_id": "ana", "priority": "media"})
    title = next(f for f in saved.system if f.id == "title")
    title.required = False
    with pytest.raises(ValueError, match="obligatorio"):
        form.FormDefinition.model_validate(saved.model_dump())


def test_survey_questions_revision_and_main_preserved(db):
    actor = root(db)
    definition = survey_form.read(db)
    definition.questions.append(survey_form.Question(id=str(uuid4()), label="¿Fue clara la respuesta?"))
    saved = survey_form.save(db, actor, definition)
    assert len(saved.questions) == 2
    with pytest.raises(form.Conflict):
        survey_form.save(db, actor, definition.model_copy(update={"revision": 0}))
    with pytest.raises(ValueError):
        survey_form.Definition(revision=1, questions=[saved.questions[1]])


def test_third_palette_color_validation(db):
    from app.modules.settings import branding
    config = branding.BrandingIn(preset="custom", secondary="#ABCDEF")
    assert branding.save(db, root(db), config).palette.secondary == "#abcdef"
    with pytest.raises(ValueError):
        branding.BrandingIn(secondary="bad")
    assert branding.read(db).palette.secondary == "#abcdef"
