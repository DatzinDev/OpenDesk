# Instalación y operación

Guía técnica para desplegar OpenDesk. Para conocer el producto, consulta el [README](../README.md).

## Requisitos
- Docker con Compose.
- Un cliente OAuth de Google (el inicio de sesión es con Google).
- Una cuenta de correo SMTP para los avisos y la encuesta.

## Inicio rápido

```bash
git clone https://github.com/DatzinDev/OpenDesk.git
cd OpenDesk
cp .env.example .env    # completa las variables
docker compose up -d --build
```

Abre `http://localhost:8080`.

- La cuenta definida en `ADMIN_EMAIL` es el Administrador principal y puede dar de alta al resto del equipo.
- En el cliente OAuth de Google, registra como URI de redirección `{APP_URL}/api/auth/callback`.
- Con `DEV_SEED=true` se cargan áreas, personas y unos 440 tickets ficticios para explorar todas las vistas.

## Configuración

Toda la configuración técnica vive en `.env`; ninguna credencial se muestra en la interfaz.

| Variable | Descripción | Por defecto |
|---|---|---|
| `APP_URL` | URL pública de la aplicación; base de los enlaces en correos | `http://localhost:8080` |
| `SECRET_KEY` | Valor aleatorio para firmar el flujo de inicio de sesión | — |
| `POSTGRES_PASSWORD` | Contraseña de la base de datos | — |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Credenciales del cliente OAuth de Google | — |
| `ADMIN_EMAIL` | Correo del Administrador principal | — |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_USE_TLS` | Servidor SMTP | puerto `587`, TLS activo |
| `MAIL_FROM`, `MAIL_FROM_NAME` | Remitente de los correos | — |
| `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` | Credenciales del almacenamiento de adjuntos | bucket `opendesk` |
| `APP_TIMEZONE` | Zona horaria para plazos, avisos y analítica | `America/Mexico_City` |
| `REMINDER_HOURS` | Anticipación del recordatorio de fecha compromiso, en horas | `24` |
| `WEB_PORT` | Puerto local publicado en producción | `8087` |
| `DEV_SEED` | `true` carga los datos ficticios de [`api/seeds/dev.sql`](../api/seeds/dev.sql) | `false` |

## Producción

`compose.prod.yml` compila la interfaz, la sirve con nginx y publica un único puerto en `127.0.0.1`, listo para
colocarse detrás de un proxy inverso o un túnel con TLS.

```bash
docker compose -f compose.prod.yml up -d --build
```

## Respaldos y restauración

El servicio `backup` de `compose.prod.yml` respalda todos los días a las 03:00 (zona `APP_TIMEZONE`):

- `backups/db-AAAAMMDD-HHMM.dump`: la base de datos completa (`pg_dump`, formato personalizado).
- `backups/adjuntos-AAAAMMDD-HHMM.tar.gz`: el volumen de adjuntos.

Se conservan 14 días. Copia la carpeta `backups/` a otro equipo o a la nube para protegerte de una falla del
servidor.

```bash
# Respaldo inmediato
docker compose -f compose.prod.yml exec backup /bin/sh /backup.sh now

# Restaurar la base de datos (reemplaza el contenido actual)
docker compose -f compose.prod.yml exec -T db pg_restore -U opendesk -d opendesk --clean --if-exists < backups/db-AAAAMMDD-HHMM.dump

# Restaurar los adjuntos
docker compose -f compose.prod.yml stop storage
docker run --rm -v opendesk_storage-data:/data -v "$PWD/backups":/b alpine sh -c "rm -rf /data/* && tar xzf /b/adjuntos-AAAAMMDD-HHMM.tar.gz -C /data"
docker compose -f compose.prod.yml start storage
```

## Pasar de demostración a uso real

Con `DEV_SEED=true` la instalación incluye áreas, personas y tickets ficticios. Para empezar a operar con datos
reales:

1. En `.env`, cambia a `DEV_SEED=false`.
2. Borra los datos de prueba (las personas ficticias usan el dominio `@opendesk.test`):

   ```bash
   docker compose -f compose.prod.yml exec -T db psql -U opendesk <<'SQL'
   BEGIN;
   TRUNCATE surveys_surveys, notifications_notifications, tickets_attachments, tickets_events, tickets_tickets RESTART IDENTITY;
   DELETE FROM audit_log;
   DELETE FROM identity_sessions WHERE user_id IN (SELECT id FROM users_users WHERE email LIKE '%@opendesk.test');
   DELETE FROM users_users WHERE email LIKE '%@opendesk.test';
   DELETE FROM areas_areas a WHERE NOT EXISTS (SELECT 1 FROM users_users u WHERE u.area_id = a.id);
   COMMIT;
   SQL
   ```
3. Reinicia: `docker compose -f compose.prod.yml up -d`.
4. Desde la aplicación, da de alta tus áreas, horarios, festivos, estatus y personas.

El catálogo de estatus y los días festivos de ejemplo se conservan; ajústalos desde la sección Áreas.

## Servicios

```mermaid
flowchart LR
    B[Navegador] --> W[web<br/>nginx + React]
    W -->|/api| A[api<br/>FastAPI]
    A --> D[(db<br/>PostgreSQL 16)]
    A --> S[(storage<br/>SeaweedFS · S3)]
    K[worker<br/>revisión de plazos] --> D
    A -->|SMTP| M[Correo]
    K -->|SMTP| M
```

| Servicio | Función |
|---|---|
| `web` | Interfaz (React) servida por nginx; redirige `/api` al servicio `api`. |
| `api` | API (FastAPI); aplica las migraciones al iniciar. |
| `worker` | Revisa los plazos cada minuto: avisos de SLA, auto-escalamiento y recordatorios. |
| `db` | PostgreSQL 16. |
| `storage` | SeaweedFS con API compatible con S3 para los adjuntos; sin puertos publicados. |
| `backup` | Solo en producción: respaldo diario de la base de datos y los adjuntos en `./backups`. |

**Backend:** Python 3.12, FastAPI, SQLAlchemy 2, Alembic, PostgreSQL 16, Authlib, boto3.
**Frontend:** React 18, TypeScript, Vite, Mantine 7, TanStack Query.

La estructura modular, las reglas de dependencia y cómo escalar están en [arquitectura](arquitectura.md).

## Desarrollo

```bash
docker compose up -d --build                        # entorno con recarga automática en :8080
docker compose exec api pytest -q                   # pruebas del backend
docker compose exec web npx tsc --noEmit -p .       # tipos del frontend
docker compose exec web npx eslint src              # reglas de dependencia del frontend
```

En desarrollo, `DEV_SEED=true` es el valor por defecto. La carga es idempotente: solo agrega tickets si no hay
ninguno. Para contribuir, consulta la [guía de contribución](../CONTRIBUTING.md).
