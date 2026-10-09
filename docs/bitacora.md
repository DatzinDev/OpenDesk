# Bitácora de cambios

Registro histórico del proyecto. Entradas en orden cronológico inverso; cada entrega agrega una.

## 2026-10-09 — Cierre de la fase 5 y de la edición de tickets

- Módulo 06 (encuesta de satisfacción) y edición de tickets validados en el entorno desplegado y publicados en `main`.

## 2026-10-09 — Edición de tickets

**Cambios**
- El Gestor, el Admin y el Usuario asignado pueden editar el título, la descripción, la prioridad y los datos del cliente de un ticket abierto, desde el botón "Editar" del detalle.
- Cada edición queda en el historial con el valor anterior y el nuevo, y en la auditoría.

**Decisiones**
- El área y la persona asignada no se editan: se cambian con Reasignar, que reinicia el SLA.
- Los tickets cerrados no se editan; para corregirlos se reabren.

## 2026-10-09 — Fase 5: encuesta de satisfacción

**Cambios**
- Módulo `surveys`: al cerrar un ticket como Resuelto con correo de cliente, se envía un correo con la pregunta y 5 botones (CSAT 1–5).
- Página pública `/encuesta/:token`, sin inicio de sesión: registra la calificación, permite un comentario opcional y avisa si la encuesta ya fue respondida o venció.
- El resultado (calificación, comentario y fecha) se muestra en el detalle del ticket cerrado.
- Auditoría de cada respuesta. Datos de prueba: una encuesta contestada en el ticket cerrado de ejemplo.

**Decisiones**
- Escala 1–5. Token aleatorio de un solo uso, vigente 7 días; solo se guarda su hash.
- Abrir el enlace no registra la calificación: la página la envía aparte, para que los filtros de correo que abren enlaces no respondan por el cliente.
- Texto de la pregunta fijo hasta el módulo 08.

**Pendientes**
- Confirmar la entrega del correo de encuesta a una cuenta real.

## 2026-10-09 — Cierre de las fases 2 a 4

- Módulos 02 (áreas y SLA), 03 (matriz de escalamiento), 04 (tickets y flujo) y 05 (notificaciones), junto con los identificadores públicos UUID, validados funcionalmente en el entorno desplegado y publicados en `main`.
- Queda pendiente confirmar la entrega de correos a cuentas reales.

## 2026-10-09 — Identificadores públicos UUID

**Cambios**
- Todas las tablas con llave entera suman una columna `uuid` única (migración `0008`); los datos existentes se conservan.
- El API, las URLs y los formularios usan solo UUID. Un id entero en una URL se rechaza.
- La interfaz trata todos los identificadores como UUID.
- Regla documentada en `docs/arquitectura.md`, sección "Identificadores".

**Decisiones**
- Se conservan ambos identificadores: el entero para relaciones y consultas internas, el UUID para exponer datos.
- El folio `OD-000123` sigue derivándose del id interno.
- Se retiró de producción, a solicitud, un comentario de prueba registrado antes de eliminar la acción "Comentar".

## 2026-10-08 — Fase 4: notificaciones, auto-escalamiento y estatus de seguimiento

**Cambios**
- Tickets:
  - Se retira la acción "Comentar". El historial muestra solo el progreso del ticket.
  - Catálogo global de **estatus de seguimiento**, editable en Áreas › Estatus. El Gestor los asigna desde el detalle del ticket y cada cambio queda en el historial.
- Notificaciones:
  - Campana de avisos en la barra lateral, con contador de no leídos y acceso directo al ticket.
  - Correos por asignación, propuesta enviada, propuesta aceptada o rechazada, intervención del Gestor, recordatorio y compromiso vencido.
- Nuevo contenedor `worker` que revisa los plazos cada minuto:
  - Aviso al consumir el 80 % del SLA.
  - Auto-escalamiento cuando vence el SLA.
  - Recordatorio antes de la fecha compromiso.
  - Aviso cuando vence el compromiso.
- Cronómetro del tiempo restante del SLA o de la fecha compromiso en listas y detalle.
- Los plazos se guardan siempre en UTC.
- Corrección: el detalle del ticket ya no falla al mostrar comentarios registrados antes de retirar la acción; cualquier evento desconocido se muestra con un ícono genérico.

**Decisiones**
- Un correo a los Gestores por cada propuesta. El cliente no recibe copia de los cambios.
- Quien realiza una acción no recibe aviso de ella.
- La anticipación del recordatorio se define con `REMINDER_HOURS` hasta que exista la pantalla de parámetros (08).

**Pendientes**
- Encuesta de satisfacción (06), analítica (07) y pantalla de auditoría y parámetros (08).

## 2026-10-08 — Fase 3: tickets y flujo

**Cambios**
- Módulo `tickets`:
  - Alta de tickets con 7 campos y folio `OD-000123`.
  - Propuestas del Usuario: actualización con fecha tentativa, escalar, reasignar a un compañero o a otra área, y cerrar.
  - Decisiones del Gestor: aceptar o rechazar con comentario, más reasignar, cerrar, comentar y reabrir en cualquier momento.
  - Línea de tiempo por ticket.
- Escalamiento con la matriz de niveles: sube a la persona del siguiente nivel con menos tickets abiertos y, si no hay nivel superior, se marca "Requiere intervención del Gestor".
- Adjuntos (imágenes y PDF, hasta 5 archivos de 10 MB por acción) en el nuevo servicio `storage` (SeaweedFS, compatible con S3). Se descargan solo a través del API.
- Interfaz:
  - "Bandeja" para Gestor y Admin, con las propuestas por decidir, filtros y búsqueda por folio.
  - "Mis actividades" para el Usuario.
  - Detalle del ticket con semáforo y línea de tiempo.
  - La página de inicio lleva a la vista de trabajo de cada rol.
- Auditoría de cada movimiento de ticket.
- Datos de prueba: 6 tickets en distintos estados.

**Decisiones**
- La reasignación la solicita el Usuario y la aprueba el Gestor. Para otra área, el Gestor elige a la persona al aceptar.
- Toda asignación reinicia el SLA con el horario del área destino y descarta la fecha compromiso.
- Un ticket cerrado solo lo reabre el Gestor, con la última persona asignada.
- Cualquier Gestor o Admin decide las propuestas.
- SeaweedFS en lugar de MinIO, porque la edición comunitaria de MinIO ya no publica imágenes Docker.
- "Escalado" deja de ser un estado y queda como evento de la línea de tiempo.

**Pendientes**
- Auto-escalamiento al vencer el SLA, avisos por correo y recordatorios (módulo 05). Por ahora, "SLA vencido" y "Compromiso vencido" solo se muestran.

## 2026-10-08 — Matriz de escalamiento por niveles

**Cambios**
- El responsable directo por persona se sustituye por **niveles de escalamiento por área**. Cada área define cuántos niveles tiene y cada persona ocupa uno.
- Matriz rediseñada: cada área muestra sus niveles del más alto al más bajo. El número de niveles se ajusta en la misma vista, y cada persona se arrastra al nivel deseado (o se mueve desde el menú de su etiqueta).
- Migración: los usuarios existentes pasan al nivel 1 y las áreas a 3 niveles.
- Datos de prueba con niveles asignados.

**Decisiones**
- Al escalar, el ticket sube al siguiente nivel con personas y se asigna a quien tenga menos tickets abiertos.
- No se pueden reducir los niveles de un área por debajo del nivel más alto ocupado; primero se mueve a esas personas.

## 2026-10-08 — Fase 2: áreas, SLA y matriz de responsables

**Cambios**
- Módulo `areas`:
  - Alta y edición de áreas con tiempo de primera respuesta, horario de atención (24/7 o un horario propio para cada día de la semana) y pausa opcional en festivos.
  - Calendario de días festivos.
  - Cálculo del vencimiento del SLA según el horario del área.
- Usuarios: el rol Usuario requiere un área.
- Interfaz: sección Áreas con tres pestañas (áreas y personas, matriz de escalamiento y días festivos) y columna Área en Usuarios.
- Auditoría de cambios en áreas y festivos.
- Modo de datos de prueba (`DEV_SEED=true`): `api/seeds/dev.sql` carga 3 áreas, 2 gestores, 10 usuarios distribuidos por niveles y días festivos.

**Decisiones**
- El calendario de festivos es de la organización; cada área decide si lo aplica.
- Toda reasignación (manual, escalamiento o automática) reinicia el SLA completo.
- Tras aceptar una actualización, el plazo vigente del ticket pasa a ser la fecha compromiso propuesta por el Usuario.
- Admin y Gestor no pertenecen a un área. Reasignar a un compañero o a otra área se definirá en el módulo de tickets.

## 2026-10-08 — Cierre de la fase 1

- Módulo 01 (acceso, usuarios y roles) validado en el entorno desplegado y publicado en `main`.

## 2026-10-08 — Corrección de correo de usuarios

**Cambios**
- El correo de un usuario ahora se puede editar (excepto el del Admin principal). Al cambiarlo, se cierran sus sesiones abiertas y se envía el aviso de acceso al nuevo correo.
- La desactivación de una cuenta también cierra sus sesiones abiertas.

**Decisiones**
- El correo es la llave de acceso con Google: corregirlo traslada el acceso a la nueva cuenta sin perder el historial del usuario.

## 2026-10-08 — Despliegue de pruebas y licencia

**Cambios**
- `compose.prod.yml`: la interfaz se compila y se sirve con nginx, el API corre sin recarga y solo se publica un puerto en `127.0.0.1`.
- Despliegue de pruebas en el servidor `zmx-tank`, en `/srv/apps/opendesk`, publicado en `https://opendesk.datzin.com.mx` mediante Cloudflare Tunnel.
- README reescrito con formato de proyecto open source.
- Licencia AGPL-3.0.

**Decisiones**
- Se eligió la licencia AGPL-3.0 para que las versiones modificadas que se ofrezcan como servicio publiquen su código. El uso interno en una organización sigue siendo libre.

**Pendientes**
- Validar el inicio de sesión con Google y el envío de correo en el entorno desplegado.

## 2026-10-08 — Definición del proyecto y módulo 01

**Cambios**
- Requisitos base: alcance de la v1, roles y permisos, y el detalle del módulo 01 (acceso, usuarios y roles).
- Stack, arquitectura modular y lineamientos de diseño documentados.
- Infraestructura Docker Compose: `db` (PostgreSQL 16), `api` (FastAPI) y `web` (Vite + React) en `http://localhost:8080`.
- Módulo 01:
  - Inicio de sesión con Google solo para correos registrados, sesión en servidor y protección CSRF.
  - Admin principal inmutable, tomado de `ADMIN_EMAIL`.
  - Alta, edición y desactivación de usuarios con reglas por rol.
  - Auditoría de accesos y cambios.
  - Correos de cuenta creada, rol modificado y acceso desactivado o reactivado.
- Interfaz: inicio de sesión con la marca Datzin, navegación por rol y gestión de usuarios.

**Decisiones**
- Roles fijos y excluyentes: Admin, Gestor y Usuario. Solo el rol Usuario recibe tickets.
- El Gestor administra la operación (usuarios, áreas, SLA, tickets, analítica) sin acceso técnico. No crea ni edita Admins.
- Puede haber varios Admins; el principal es inmutable desde la aplicación.
- Cada usuario pertenece a una sola área.
- El SLA es por área, con horario de atención configurable (días y franja horaria; 24/7 por defecto).
- La prioridad es solo informativa: sirve para clasificar y para la analítica.
- El correo sale por SMTP, y toda acción relevante notifica por correo.
- Stack FastAPI + React (Mantine). Monolito modular organizado por funcionalidad, con reglas de dependencia verificadas por pruebas y ESLint.

**Pendientes**
- Resolver las preguntas abiertas de los requisitos 02 a 08. Esos documentos aún no se publican en el repositorio.
- Registrar `http://localhost:8080/api/auth/callback` como URI de redirección del cliente OAuth en Google Cloud Console.
- Confirmar con un login real con Google y un correo real por SMTP.
