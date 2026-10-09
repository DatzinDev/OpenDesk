# OpenDesk — Requisitos

Plataforma open source (Datzin) de gestión de tickets para atención a clientes.
Principio rector: **pocas pantallas, pocos campos y operación sencilla**. Toda funcionalidad debe
contribuir al flujo Gestor → Usuario → Gestor; de lo contrario, queda fuera del alcance.

Documentos relacionados: [Stack y arquitectura](../arquitectura.md) · [Diseño](../diseno.md)

## Módulos

| # | Módulo | Archivo | Estado |
|---|--------|---------|--------|
| 01 | Acceso, usuarios y roles | [01-acceso-usuarios-roles.md](01-acceso-usuarios-roles.md) | Validado |
| 02 | Áreas y SLA | [02-areas-sla.md](02-areas-sla.md) | Validado |
| 03 | Matriz de escalamiento | [03-matriz-responsables.md](03-matriz-responsables.md) | Validado |
| 04 | Tickets y flujo | [04-tickets.md](04-tickets.md) | Validado |
| 05 | Notificaciones | [05-notificaciones.md](05-notificaciones.md) | Validado |
| 06 | Encuesta de satisfacción | [06-encuesta.md](06-encuesta.md) | Validado |
| 07 | Analítica | [07-analitica.md](07-analitica.md) | En desarrollo |
| 08 | Auditoría y parámetros | [08-auditoria-parametros.md](08-auditoria-parametros.md) | Pendiente |

## Alcance v1

**Dentro**
- Login solo con Google (sin contraseñas propias).
- Envío de correo por SMTP (compatible con Google Workspace) para cada acción relevante.
- 3 roles fijos: Administrador, Gestor, Usuario.
- Áreas con SLA y horario de atención propios, prioridad informativa en tickets, matriz de escalamiento por niveles, auto-escalamiento.
- Flujo de propuesta/aprobación (actualizar, escalar, reasignar, cerrar), folio visible y reapertura por el Gestor.
- Adjuntos (imágenes y PDF) en almacenamiento compatible con S3 dentro del despliegue.
- Notificaciones en sistema + correo, recordatorio 24 h antes de fecha comprometida.
- Encuesta de satisfacción por correo al cliente al cerrar exitosamente.
- Dashboard de analítica en tiempo (casi) real.
- Despliegue 100 % Docker (`docker compose up`).

**Fuera (v1)**
- Portal para que el cliente final cree tickets (el ticket lo crea el Gestor).
- Roles/permisos configurables, campos personalizados, formularios dinámicos.
- Integraciones (Slack, Teams, WhatsApp), app móvil, multi-idioma, multi-empresa.

## Orden de construcción propuesto

1. **01** Acceso + usuarios + roles (login Google funcionando en Docker).
2. **02 + 03** Áreas, SLA y matriz de escalamiento (catálogos que necesita el ticket).
3. **04** Tickets y flujo completo (sin correo aún, solo en sistema).
4. **05** Notificaciones por correo + recordatorios + auto-escalamiento (jobs).
5. **06** Encuesta.
6. **07** Analítica.
7. **08** Auditoría (se va registrando desde el paso 1, la pantalla al final).

Cada paso se entrega corriendo en Docker para revisión antes de pasar al siguiente.

## Glosario

- **Gestor**: quien crea, asigna y aprueba/rechaza acciones sobre tickets.
- **Usuario**: quien atiende el ticket asignado.
- **Nivel de escalamiento**: posición de un usuario dentro de su área (1 = primer contacto); los tickets escalan al siguiente nivel.
- **Propuesta**: acción enviada por el Usuario (actualización, escalamiento, reasignación o cierre) que
  queda pendiente de decisión del Gestor.
- **SLA de primera respuesta**: tiempo máximo desde la asignación hasta que el Gestor
  **acepta** la primera propuesta del Usuario.
- **Fecha compromiso**: fecha tentativa de resolución aprobada por el Gestor.
- **Cliente**: persona externa por la que se levantó el ticket (no es usuario del sistema).
