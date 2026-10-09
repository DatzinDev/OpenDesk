import pytest
from sqlalchemy import select

from app.modules.audit.models import AuditEntry
from app.modules.identity import service as identity
from app.modules.users import service
from app.modules.users.schemas import UserCreate, UserUpdate


def make(db, actor, email, role):
    return service.create_user(db, actor, UserCreate(email=email, name=email.split("@")[0], role=role))


@pytest.fixture
def root(db):
    service.ensure_root(db, "root@acme.com")
    return service.get_by_email(db, "root@acme.com")


def test_create_sends_account_email_and_audits(db, root):
    make(db, root, "Ana@Acme.com", "gestor")
    assert db.sent == [("ana@acme.com", "Tu acceso a OpenDesk está listo")]
    assert db.scalar(select(AuditEntry.action).where(AuditEntry.action == "user.created"))


def test_gestor_cannot_create_or_edit_admins(db, root):
    gestor = make(db, root, "g@acme.com", "gestor")
    admin = make(db, root, "a@acme.com", "admin")
    with pytest.raises(service.Forbidden):
        make(db, gestor, "x@acme.com", "admin")
    with pytest.raises(service.Forbidden):
        service.update_user(db, gestor, admin.id, UserUpdate(name="X"))
    assert all(u.role != "admin" for u in service.list_users(db, gestor))
    make(db, gestor, "u@acme.com", "usuario")  # sí puede crear usuarios y gestores


def test_root_is_immutable(db, root):
    other_admin = make(db, root, "a@acme.com", "admin")
    with pytest.raises(service.Forbidden):
        service.update_user(db, other_admin, root.id, UserUpdate(is_active=False))


def test_duplicate_email_conflicts(db, root):
    make(db, root, "u@acme.com", "usuario")
    with pytest.raises(service.Conflict):
        make(db, root, "U@acme.com", "usuario")


def test_deactivation_emails_and_blocks_login(db, root):
    u = make(db, root, "u@acme.com", "usuario")
    assert identity.login(db, "u@acme.com", None, None)
    service.update_user(db, root, u.id, UserUpdate(is_active=False))
    assert db.sent[-1] == ("u@acme.com", "Tu acceso a OpenDesk fue desactivado")
    assert identity.login(db, "u@acme.com", None, None) is None


def test_unregistered_email_is_denied_and_audited(db, root):
    assert identity.login(db, "nadie@acme.com", None, None) is None
    assert db.scalar(select(AuditEntry).where(AuditEntry.action == "login.denied")).data["email"] == "nadie@acme.com"
