# Guía de contribución

Gracias por tu interés en mejorar OpenDesk. Esta guía resume cómo proponer cambios.

## Antes de empezar
- Abre un *issue* para describir el problema o la mejora antes de escribir código. Así acordamos el alcance y evitamos trabajo duplicado.
- Revisa los [requisitos](docs/requisitos/README.md) del módulo que quieras tocar y la [arquitectura](docs/arquitectura.md).

## Entorno
Todo corre con Docker:

```bash
cp .env.example .env
docker compose up -d --build
```

Con `DEV_SEED=true` tendrás datos ficticios para probar todas las vistas.

## Reglas del código
- **Un cambio, un módulo.** Cada *pull request* se enfoca en un solo módulo (`api/app/modules/<x>` y `web/src/features/<x>`).
- Los módulos solo importan de `core`, `shared` o del `__init__.py` de otro módulo. Los efectos entre módulos se resuelven con eventos.
- Las tablas llevan el prefijo de su módulo y los cambios de esquema van en una migración de Alembic.
- El API expone solo identificadores UUID; los ids enteros son internos.
- La interfaz está en español y sigue los [lineamientos de diseño](docs/diseno.md).

## Pruebas
Antes de enviar tu cambio:

```bash
docker compose exec api pytest -q
docker compose exec web npx tsc --noEmit -p .
docker compose exec web npx eslint src
```

Agrega una prueba para cada regla de negocio nueva.

## Commits
Usamos [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/) en una sola línea, en español:

```
feat(tickets): se agrega la edición de datos descriptivos
fix(web): se corrige el cambio de pestaña en analítica
```

Haz un commit por cada cambio lógico, y trabaja en una rama `tipo/nombre` (por ejemplo, `fix/semaforo-sla`).

## Licencia
Al contribuir, aceptas que tu aporte se distribuya bajo la [AGPL-3.0](LICENSE).
