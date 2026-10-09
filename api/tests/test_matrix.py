import pytest

from app.modules.areas import service as areas
from app.modules.areas.schemas import AreaIn
from app.modules.users import service
from app.modules.users.schemas import ManagerUpdate, UserCreate, UserUpdate


@pytest.fixture
def env(db):
    service.ensure_root(db, "root@acme.com")
    root = service.get_by_email(db, "root@acme.com")
    a1 = areas.save_area(db, root.id, AreaIn(name="Soporte"))
    a2 = areas.save_area(db, root.id, AreaIn(name="Ventas"))
    mk = lambda email, area: service.create_user(db, root, UserCreate(email=email, name=email[0], role="usuario", area_id=area.id))
    return root, a1, a2, mk


def test_usuario_requires_area(db, env):
    root, *_ = env
    with pytest.raises(service.Conflict):
        service.create_user(db, root, UserCreate(email="x@acme.com", name="x", role="usuario"))


def test_manager_same_area_and_no_cycles(db, env):
    root, a1, a2, mk = env
    a, b, c = mk("a@acme.com", a1), mk("b@acme.com", a1), mk("c@acme.com", a2)
    service.set_manager(db, root, a.id, ManagerUpdate(manager_id=b.id))
    with pytest.raises(service.Conflict, match="ciclo"):
        service.set_manager(db, root, b.id, ManagerUpdate(manager_id=a.id))
    with pytest.raises(service.Conflict, match="misma área"):
        service.set_manager(db, root, a.id, ManagerUpdate(manager_id=c.id))


def test_cannot_deactivate_manager_with_reports(db, env):
    root, a1, _, mk = env
    a, b = mk("a@acme.com", a1), mk("b@acme.com", a1)
    service.set_manager(db, root, a.id, ManagerUpdate(manager_id=b.id))
    with pytest.raises(service.Conflict, match="1 persona"):
        service.update_user(db, root, b.id, UserUpdate(is_active=False))


def test_area_change_detaches_chain(db, env):
    root, a1, a2, mk = env
    a, b = mk("a@acme.com", a1), mk("b@acme.com", a1)
    service.set_manager(db, root, a.id, ManagerUpdate(manager_id=b.id))
    service.update_user(db, root, b.id, UserUpdate(area_id=a2.id))
    assert service.get(db, a.id).manager_id is None
