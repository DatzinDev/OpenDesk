# Bitácora de cambios

Registro histórico del proyecto. Entradas en orden cronológico inverso; cada entrega agrega una.

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
