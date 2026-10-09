# Bitácora de cambios

Registro histórico del proyecto. Entradas en orden cronológico inverso; cada entrega agrega una.

## 2026-10-08 — Fase 2: áreas, SLA y matriz de responsables

**Cambios**
- Módulo `areas`:
  - Alta y edición de áreas con tiempo de primera respuesta, horario de atención (24/7 o un horario propio para cada día de la semana) y pausa opcional en festivos.
  - Calendario de días festivos.
  - Cálculo del vencimiento del SLA según el horario del área.
- Usuarios: el rol Usuario requiere un área; nuevo responsable directo con validación de misma área y sin ciclos.
- Interfaz: sección Áreas con tres pestañas (áreas y personas, matriz de escalamiento y días festivos) y columna Área en Usuarios.
- Auditoría de cambios en áreas y festivos.

**Decisiones**
- El calendario de festivos es de la organización; cada área decide si lo aplica.
- Toda reasignación (manual, escalamiento o automática) reinicia el SLA completo.
- Tras aceptar una actualización, el plazo vigente del ticket pasa a ser la fecha compromiso propuesta por el Usuario.
- El responsable directo pertenece a la misma área. Reasignar a un compañero o a otra área se definirá en el módulo de tickets.
- Admin y Gestor no pertenecen a un área. No se puede desactivar a quien tiene personas a cargo.

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
