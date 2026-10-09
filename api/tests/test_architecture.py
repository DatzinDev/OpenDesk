"""Verifica las reglas de dependencia entre módulos (docs/arquitectura.md, sección 3)."""
import ast
from pathlib import Path

APP = Path(__file__).parent.parent / "app"


def _imports(path: Path):
    for node in ast.walk(ast.parse(path.read_text())):
        if isinstance(node, ast.ImportFrom) and node.module:
            yield node.module
            if node.module == "app.modules":  # from app.modules import users
                yield from (f"app.modules.{a.name}" for a in node.names)
        elif isinstance(node, ast.Import):
            yield from (a.name for a in node.names)


def test_modules_only_use_public_api_of_other_modules():
    violations = []
    for path in (APP / "modules").rglob("*.py"):
        own = path.relative_to(APP / "modules").parts[0]
        for mod in _imports(path):
            parts = mod.split(".")
            if parts[:2] == ["app", "modules"] and len(parts) > 3 and parts[2] != own:
                violations.append(f"{path.relative_to(APP)} importa {mod}")
    assert not violations, "\n".join(violations)


def test_core_and_shared_do_not_depend_on_modules():
    violations = [
        f"{p.relative_to(APP)} importa {m}"
        for layer in ("core", "shared")
        for p in (APP / layer).rglob("*.py")
        for m in _imports(p)
        if m.startswith("app.modules")
    ]
    assert not violations, "\n".join(violations)
