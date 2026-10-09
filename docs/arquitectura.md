# OpenDesk — Stack y arquitectura

## 1. Stack tecnológico

| Capa | Tecnología | Motivo |
|---|---|---|
| API | Python 3.12, FastAPI | Tipado con Pydantic, documentación OpenAPI automática, async nativo. |
| Persistencia | PostgreSQL 16, SQLAlchemy 2, Alembic | Base relacional robusta; migraciones versionadas. |
| Autenticación | Google OpenID Connect (Authlib) | Sin contraseñas propias; la identidad la garantiza Google. |
| Sesión | Cookie `HttpOnly` con token opaco; hash almacenado en BD | Revocable desde el servidor, sin JWT en el navegador. |
| Adjuntos | SeaweedFS (compatible con S3) + boto3 | Almacenamiento de objetos open source dentro del mismo despliegue; bucket privado. |
| Correo | SMTP (`smtplib` de la biblioteca estándar) + plantillas Jinja2 | Compatible con Google Workspace o cualquier proveedor SMTP. |
| Frontend | React 18, TypeScript, Vite | Ecosistema maduro, tipado estricto, recarga rápida. |
| UI | Mantine 7 (+ `@mantine/dates`, `@mantine/charts`) | Biblioteca completa de componentes accesibles; permite elegir el control adecuado para cada dato. |
| Estado de servidor | TanStack Query | Caché, reintentos e invalidación sin store global. |
| Ruteo | React Router | Rutas por feature y guardas por rol. |
| Infraestructura | Docker Compose | Único método de ejecución soportado. |

### Contenedores

| Servicio | Función | Puerto |
|---|---|---|
| `db` | PostgreSQL 16 con volumen persistente | interno |
| `api` | FastAPI (uvicorn); aplica migraciones al iniciar | interno (8000) |
| `storage` | SeaweedFS (`weed mini`) con API S3 y volumen persistente; guarda los adjuntos | interno (8333) |
| `web` | Servidor Vite; sirve la SPA y redirige `/api` hacia `api` | **8080** |

La aplicación se expone en un solo origen (`APP_URL`, por defecto `http://localhost:8080`), por lo que
no se requiere CORS y la cookie de sesión es de primer nivel.

### Variables de entorno

Ver `.env.example`. Las credenciales nunca se exponen en la interfaz.

| Variable | Uso |
|---|---|
| `APP_URL` | URL pública; base de los enlaces en correos y del callback OAuth. |
| `SECRET_KEY` | Firma de la cookie temporal del flujo OAuth. |
| `POSTGRES_PASSWORD` | Contraseña de la base de datos. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Cliente OAuth de Google. URI de redirección autorizada: `{APP_URL}/api/auth/callback`. |
| `MAIL_*` | Servidor SMTP y remitente. |
| `ADMIN_EMAIL` | Cuenta del Admin principal (inmutable desde la aplicación). |
| `APP_TIMEZONE` | Zona horaria para el cálculo de SLA (por defecto `America/Mexico_City`). |
| `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` | Credenciales y bucket del almacenamiento de adjuntos. |
| `DEV_SEED` | `true` ejecuta `api/seeds/dev.sql` al iniciar: datos ficticios idempotentes para pruebas. |

## 2. Arquitectura general

OpenDesk es un **monolito modular** organizado por **funcionalidad** (*package by feature* /
*vertical slice*), tanto en backend como en frontend. Cada módulo contiene todas sus capas técnicas y
expone una interfaz pública mínima. Los módulos se comunican únicamente por esa interfaz o por eventos.

Objetivos:
- Que un cambio funcional se concentre en una sola carpeta.
- Que los límites entre dominios sean explícitos y verificables automáticamente.
- Que extraer un módulo a un servicio independiente no requiera reestructurar el resto.

## 3. Backend

### Estructura

```
api/
├── alembic/                  migraciones (una por cambio de esquema)
├── app/
│   ├── main.py               ensambla la aplicación: middlewares y routers de cada módulo
│   ├── core/                 infraestructura técnica sin lógica de negocio
│   │   ├── config.py         lectura de variables de entorno
│   │   └── db.py             engine, sesión y Base declarativa
│   ├── shared/               elementos transversales genuinos
│   │   ├── events.py         bus de eventos en proceso (publish / subscribe)
│   │   ├── mailer.py         envío SMTP y render de plantillas
│   │   └── storage.py        cliente S3 para adjuntos (bucket privado, descarga vía API)
│   └── modules/
│       ├── identity/         login con Google, sesiones, /me; expone current_user y require_roles
│       ├── users/            alta, edición, desactivación y reglas de rol
│       ├── audit/            bitácora de eventos
│       ├── notifications/    reacciona a eventos y envía correos / avisos en sistema
│       ├── areas/            áreas, horario, festivos y cálculo del SLA
│       ├── tickets/          tickets, propuestas, decisiones, línea de tiempo y adjuntos
│       └── …                 surveys, analytics (módulos posteriores)
└── tests/
```

Cada módulo sigue la misma forma interna (se omiten los archivos que no necesite):

```
modules/users/
├── __init__.py       API pública del módulo (lo único importable desde fuera)
├── router.py         endpoints HTTP; traduce peticiones a llamadas al servicio
├── service.py        reglas de negocio y publicación de eventos
├── repository.py     consultas a la base de datos
├── models.py         tablas SQLAlchemy propias del módulo
├── schemas.py        modelos Pydantic de entrada/salida (contrato del módulo)
├── events.py         eventos de dominio que el módulo publica
└── dependencies.py   dependencias FastAPI expuestas a otros módulos (si aplica)
```

### Responsabilidades por capa

| Capa | Responsabilidad | No debe |
|---|---|---|
| `router` | Validar entrada (schemas), aplicar autenticación, delegar al servicio, devolver schemas. | Contener reglas de negocio ni consultas. |
| `service` | Reglas de negocio, permisos de dominio, transacciones, publicación de eventos. | Conocer HTTP ni detalles de SMTP. |
| `repository` | Lectura y escritura en BD de las tablas del módulo. | Tocar tablas de otros módulos. |
| `models` | Definición de tablas del módulo, con prefijo propio. | Declarar `relationship` hacia modelos de otros módulos. |
| `schemas` | Contrato de datos expuesto a otros módulos y al cliente. | Exponer modelos ORM. |
| `events` | Dataclasses inmutables que describen hechos ocurridos (`UserCreated`). | Contener lógica. |

### Reglas de dependencia

1. Un módulo puede importar de `core`, `shared` y del **`__init__.py`** de otro módulo.
2. Un módulo **nunca** importa `router`, `service`, `repository` ni `models` de otro módulo.
3. Las referencias entre tablas de distintos módulos son por identificador (columna con clave
   foránea permitida), sin `relationship` del ORM que acople modelos.
4. Los efectos secundarios entre módulos (enviar correo, registrar auditoría, recalcular métricas)
   se resuelven con **eventos**: el módulo emisor publica y no conoce a los suscriptores.
5. `core` y `shared` no importan nada de `modules`.
6. `tests/test_architecture.py` verifica las reglas 1, 2 y 5 en cada ejecución de pruebas.

### Qué se comparte y qué se encapsula

| Compartido (`core`, `shared`) | Encapsulado (dentro de cada módulo) |
|---|---|
| Configuración, conexión a BD, sesión de autenticación | Tablas y consultas |
| Bus de eventos | Reglas de negocio y validaciones |
| Envío de correo (transporte) | Plantillas y textos de correo específicos (en `notifications`) |
| Tipos base genuinamente comunes | Schemas y eventos del dominio |

Un elemento sube a `shared` solo cuando lo necesitan al menos dos módulos y no pertenece a ningún
dominio en particular.

## 4. Frontend

### Estructura

```
web/src/
├── main.tsx                  punto de entrada
├── app/                      composición de la aplicación
│   ├── providers.tsx         Mantine, TanStack Query, Router
│   ├── routes.tsx            rutas de todas las features y guardas por rol
│   └── AppShell.tsx          navegación lateral, encabezado y firma Datzin
├── shared/                   reutilizable entre features, sin conocimiento de dominio
│   ├── api/http.ts           cliente HTTP (fetch, manejo de errores y 401)
│   ├── ui/                   componentes genéricos (PageHeader, EmptyState, DatzinSignature)
│   └── theme.ts              tokens de marca y tema Mantine
└── features/
    ├── auth/                 login, sesión actual, guardas
    │   ├── api.ts            llamadas HTTP de la feature
    │   ├── hooks.ts          hooks TanStack Query (useMe, useLogout)
    │   ├── types.ts          tipos de la feature
    │   ├── components/       componentes internos
    │   ├── pages/            vistas enrutables
    │   └── index.ts          API pública de la feature
    ├── users/                misma forma
    ├── areas/
    └── tickets/              bandeja, mis actividades y detalle de ticket
```

### Reglas de dependencia

1. Una feature importa de `shared` y del `index.ts` de otra feature; nunca de sus archivos internos.
2. `shared` no importa nada de `features` ni de `app`.
3. `app` compone features únicamente a través de sus `index.ts`.
4. El estado de servidor vive en hooks de TanStack Query dentro de cada feature; no existe store
   global. El estado de interfaz es local al componente.
5. Las reglas 1 y 2 se verifican con ESLint (`no-restricted-imports`).

## 5. Escalabilidad y evolución

### Backend hacia servicios independientes
Cada módulo ya cuenta con los tres elementos necesarios para extraerse:
- **Datos propios**: tablas con prefijo del módulo, sin relaciones ORM cruzadas. Pueden moverse a un
  esquema o base de datos separados.
- **Contrato explícito**: su `__init__.py` y sus schemas. Al extraerlo, las llamadas a esa API pública
  se sustituyen por un cliente HTTP con la misma firma.
- **Comunicación por eventos**: el bus en proceso (`shared/events.py`) se reemplaza por un broker
  (por ejemplo Redis Streams o RabbitMQ) sin modificar emisores ni suscriptores.

Candidatos naturales a extracción: `notifications` (envío masivo de correo), `analytics`
(consultas pesadas, réplica de lectura) y `surveys` (expuesto a clientes externos).

### Frontend hacia módulos independientes
Cada feature expone una sola entrada (`index.ts`) y depende solo de `shared`. Esto permite:
- Cargar features bajo demanda (`React.lazy`) a medida que crezca el bundle.
- Convertir `shared` en un paquete interno y las features en paquetes de un *monorepo*.
- Si se requiere, publicar una feature como *microfrontend* sin reescribir su código interno.

### Crecimiento previsto
| Necesidad | Respuesta sin reestructurar |
|---|---|
| Tareas programadas (SLA, recordatorios) | Nuevo contenedor `worker` con el mismo código y un punto de entrada distinto. |
| Mayor volumen de correo | Mover suscriptores de `notifications` a una cola. |
| Más funcionalidades | Nueva carpeta en `modules/` y en `features/`, registro en `main.py` y `routes.tsx`. |
