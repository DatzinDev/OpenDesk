import pytest

from app.modules.areas import service as areas
from app.modules.areas.schemas import AreaIn
from app.modules.users import service
from app.modules.users.schemas import UserCreate, UserUpdate


@pytest.fixture
def env(db):
    service.ensure_root(db, "root@acme.com")
    root = service.get_by_email(db, "root@acme.com")
    a1 = areas.save_area(db, root.id, AreaIn(name="Soporte", levels=3))
    a2 = areas.save_area(db, root.id, AreaIn(name="Ventas", levels=2))
    mk = lambda email, area, level=None: service.create_user(
        db, root, UserCreate(email=email, name=email[0], role="usuario", area_id=area.id, level=level))
    return root, a1, a2, mk


def test_usuario_requires_area_and_starts_at_level_1(db, env):
    root, a1, _, mk = env
    with pytest.raises(service.Conflict):
        service.create_user(db, root, UserCreate(email="x@acme.com", name="x", role="usuario"))
    assert mk("a@acme.com", a1).level == 1


def test_level_must_exist_in_area(db, env):
    root, a1, a2, mk = env
    u = mk("a@acme.com", a1, 3)
    with pytest.raises(service.Conflict, match="2 nivel"):
        service.update_user(db, root, u.id, UserUpdate(area_id=a2.id, level=3))


def test_area_change_resets_level(db, env):
    root, a1, a2, mk = env
    u = mk("a@acme.com", a1, 3)
    assert service.update_user(db, root, u.id, UserUpdate(area_id=a2.id)).level == 1


def test_cannot_reduce_levels_below_occupied(db, env):
    root, a1, _, mk = env
    mk("a@acme.com", a1, 2)
    with pytest.raises(areas.Conflict, match="nivel 2"):
        areas.save_area(db, root.id, AreaIn(name="Soporte", levels=1), a1.id)
    assert areas.save_area(db, root.id, AreaIn(name="Soporte", levels=2), a1.id).levels == 2
