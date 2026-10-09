# Bitácora de cambios

Registro histórico del proyecto. Entradas en orden cronológico inverso; cada entrega agrega una.

## 2026-10-09 — Versión 0.1.1

- Se publica `v0.1.1` con el módulo 08 (auditoría y parámetros), los avisos instantáneos, las horas hábiles en la analítica, la paginación de la Bandeja, los respaldos y el logotipo. El detalle está en `CHANGELOG.md`.
- Tank vuelve a `main` y sigue como demostración.

## 2026-10-09 — Logotipo de OpenDesk

**Cambios**
- Se integra el logotipo (isotipo y letras) entregado por el usuario:
  - barra lateral, encabezado móvil y panel de inicio de sesión (con el isotipo como marca de agua);
  - página pública de la encuesta;
  - favicon y README, con versiones para el tema claro y el oscuro de GitHub.
- Variantes optimizadas en blanco y en azul marino, generadas a partir de los originales, que quedan en `docs/assets/fuente/`.

**Decisiones**
- El favicon es el isotipo blanco sobre un cuadro azul marino, para que se vea en pestañas claras y oscuras.
- Los correos conservan el nombre en texto, porque muchos clientes de correo bloquean las imágenes.

## 2026-10-09 — Respaldos

**Cambios**
- Servicio `backup` en producción (`ops/backup.sh`): cada día a las 03:00 genera un volcado de la base de datos y una copia del volumen de adjuntos en `./backups`, y conserva 14 días.
- `docs/instalacion.md`: respaldo inmediato, restauración, y pasos para pasar de la demostración a uso real.

**Decisiones**
- Los respaldos quedan en el mismo servidor; copiarlos fuera es responsabilidad de quien opera la instalación y se indica en la guía.
- Tank sigue como demostración, con `DEV_SEED=true`.

## 2026-10-09 — Mejoras: avisos instantáneos, horas hábiles y paginación

**Cambios**
- **Avisos instantáneos:** la campana recibe los avisos al momento por Server-Sent Events, mediante `LISTEN/NOTIFY` de PostgreSQL. Funciona también con los avisos que genera el worker. Al llegar un aviso se refrescan las listas de tickets en pantalla. La consulta periódica queda como respaldo, cada 2 minutos.
- **Horas hábiles en la analítica:**
  - La primera respuesta y la resolución descuentan lo que queda fuera del horario del área y sus festivos.
  - `areas.sla` gana `elapsed`, el inverso de `deadline`.
  - Tickets registra la primera respuesta también en minutos hábiles.
- **Paginación de la Bandeja:** de 50 en 50, con el total, mediante el nuevo endpoint `GET /api/tickets/page`. Las demás listas siguen cargando todo.
- nginx sirve el canal de avisos sin búfer.

**Decisiones**
- Una conexión de PostgreSQL por pestaña abierta con avisos en tiempo real; suficiente para equipos de decenas de personas.
- La antigüedad de los abiertos sigue en tiempo natural.
- La paginación usa un endpoint aparte, para no cambiar la respuesta de la lista existente.

## 2026-10-09 — Fase 7: auditoría y parámetros

**Cambios**
- Módulo `settings` y pantalla **Configuración**:
  - **Operación** (Admin y Gestor): nombre de la organización, horas del recordatorio, porcentaje de aviso del SLA y pregunta de la encuesta, con vista previa.
  - **Técnicos** (solo Admin): dominio permitido y zona horaria, más un botón de correo de prueba que muestra el error del servidor de correo si falla.
- Los parámetros reemplazan los valores fijos en avisos, recordatorios, encuesta, correos, inicio de sesión, cálculo de SLA y analítica.
- Pantalla **Auditoría** (solo Admin): filtros por persona, tipo de evento y fechas; acciones en lenguaje claro; folios enlazados al ticket; y detalle sin ids internos.
- Corrección: la validación de la sesión ya no falla con fechas sin zona horaria.

**Decisiones**
- `settings` no importa otros módulos, para que todos lo puedan usar sin formar ciclos.
- Los parámetros se leen en cada uso, así que los cambios aplican de inmediato, también en el worker.

## 2026-10-09 — README y guía de contribución

**Cambios**
- README reorganizado como proyecto open source:
  - propuesta de valor;
  - funcionalidades por área;
  - roles actualizados;
  - inicio rápido por HTTPS;
  - tabla de configuración completa con valores por defecto;
  - diagrama de servicios;
  - hoja de ruta y tabla de documentación.
- Se corrigen descripciones que ya no aplicaban: el Administrador aún no tiene pantalla de parámetros ni de auditoría, y faltaban el worker, el almacenamiento y varias variables.
- Versión final del README: una sola pantalla con la propuesta de valor, cinco beneficios y el comando de inicio; el detalle técnico vive en `docs/instalacion.md`.
- README reescrito después como página de producto: el problema que resuelve, cómo cambia el día a día, qué incluye, la analítica, los roles y por qué código abierto. La parte técnica pasa a `docs/instalacion.md` (inicio rápido, configuración, producción, servicios y desarrollo).
- Nueva `CONTRIBUTING.md` con el entorno, las reglas de código, las pruebas y la convención de commits.
- `.env.example` documenta las variables opcionales `APP_TIMEZONE`, `REMINDER_HOURS` y `WEB_PORT`.

## 2026-10-09 — Versión 0.1.0

- Módulo 07 (analítica) y datos de prueba completos validados y publicados en `main`.
- Primera versión etiquetada: `v0.1.0`, con su release en GitHub. El resumen de lo incluido está en `CHANGELOG.md`.
- Pendiente para la siguiente versión: módulo 08 (auditoría y parámetros).

## 2026-10-09 — Fase 6: analítica

**Cambios**
- Módulo `analytics` y sección "Analítica" con seis pestañas: Resumen, Tiempos y SLA, Equipo, Flujo, Clientes y Demanda. El Usuario ve "Mi desempeño".
- Filtros por rango de fechas, área y prioridad, guardados en la URL. Los datos se actualizan cada 60 s y cada indicador se compara con el periodo anterior.
- Exportación a CSV de los tickets del periodo.
- Tickets registra, al aceptar la primera respuesta, el tiempo y el cumplimiento del SLA; al cerrar, si se cumplió la fecha compromiso.
- Datos de prueba: unos 420 tickets históricos de 90 días, con una distribución realista de horarios, tiempos, escalamientos, envíos entre áreas y encuestas.
- La sección de Analítica se carga de forma diferida, para no hacer más pesada la carga inicial de la aplicación.
- Corrección: al cambiar de pestaña ya no se intentan dibujar las gráficas de la nueva pestaña con los datos de la anterior, lo que provocaba un error hasta recargar la página.

**Decisiones**
- Se agregan indicadores no previstos al inicio: percentil 90, antigüedad de los abiertos, tasa de rechazo, reaperturas, envíos entre áreas, clientes recurrentes y mapa de calor de la demanda.
- Las métricas se calculan al consultar, sin tablas de resumen. `analytics` es la única excepción a la regla de que cada módulo lee solo sus tablas, y solo para lectura.
- Los tiempos se miden en horas de reloj.

**Pendientes**
- Módulo 08: auditoría y parámetros.

## 2026-10-09 — Datos de prueba completos

**Cambios**
- `api/seeds/dev.sql` carga 22 tickets que cubren todos los estados, con historial, avisos en la campana y encuestas:
  - **Asignado:** recién creado, al 85 % del SLA, con propuesta rechazada, escalado, que requiere intervención del Gestor, reabierto, y uno con el SLA recién vencido para ver el auto-escalamiento.
  - **Pendiente de aprobación:** una propuesta de cada tipo.
  - **En seguimiento:** con compromiso vigente, por vencer y vencido.
  - **Cerrado:** resuelto con encuesta contestada, sin responder y vencida; no resuelto; cerrado directamente por el Gestor.
- El cargador del seed ejecuta el SQL directamente en el driver, para que un "%" en los textos no se interprete como parámetro.
- Se borraron los tickets de prueba anteriores, con sus avisos, encuestas, adjuntos y registros de auditoría; los folios vuelven a empezar en OD-000001.

**Decisiones**
- Los datos de prueba no incluyen adjuntos, porque requieren archivos en el almacenamiento.

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
