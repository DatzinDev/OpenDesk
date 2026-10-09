# Registro de cambios

Todos los cambios relevantes de OpenDesk se documentan en este archivo. El formato sigue
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa
[versionado semántico](https://semver.org/lang/es/). El detalle de cada entrega y sus decisiones está en la
[bitácora](docs/bitacora.md).

## [Sin publicar]

### Agregado
- Pantalla de **Configuración**:
  - Para Admin y Gestor: nombre de la organización, anticipación del recordatorio, porcentaje de aviso del SLA y pregunta de la encuesta.
  - Para el Admin: dominio permitido y zona horaria.
  - Botón para enviar un correo de prueba.
- Pantalla de **Auditoría** para el Administrador, con filtros por persona, tipo de evento y fechas.
- Avisos **instantáneos** en la campana; las listas de tickets en pantalla se actualizan solas.
- Paginación de la Bandeja, de 50 en 50, con el total de tickets.

- Respaldos automáticos diarios de la base de datos y los adjuntos (servicio `backup`), con 14 días de retención y guía de restauración.
- Guía para pasar de la demostración a uso real.

- Logotipo de OpenDesk en la aplicación, la encuesta, el favicon y el README.

### Cambiado
- La analítica mide la primera respuesta y la resolución en **horas hábiles** del área.

## [0.1.0] — 2026-10-09

Primera versión funcional: el flujo completo Gestor → Usuario → Gestor, con SLA, escalamiento, avisos,
encuesta de satisfacción y analítica.

### Agregado

**Acceso, usuarios y roles**
- Inicio de sesión con Google; sin contraseñas propias.
- Roles Administrador, Gestor y Usuario.
- Admin principal definido por `ADMIN_EMAIL`.
- Alta, edición y desactivación de usuarios, con correo de aviso.

**Áreas y SLA**
- Áreas con tiempo de primera respuesta y horario de atención por día de la semana o 24/7.
- Calendario de días festivos, que cada área decide si aplica.
- Cálculo del vencimiento respetando el horario del área.

**Matriz de escalamiento**
- Niveles por área.
- El ticket sube al siguiente nivel con personas y se asigna a quien tiene menos carga.
- Si no hay nivel superior, el ticket se marca "Requiere intervención del Gestor".

**Tickets**
- Alta en un solo formulario, con folio `OD-000123`.
- Propuestas del Usuario: actualización con fecha tentativa, escalar, reasignar a un compañero o a otra área, y cerrar.
- Decisiones del Gestor: aceptar o rechazar con comentario.
- Acciones directas del Gestor: reasignar, cerrar y reabrir.
- Fecha compromiso.
- Catálogo editable de estatus de seguimiento.
- Edición de datos descriptivos con registro en el historial.
- Adjuntos (imágenes y PDF) en almacenamiento compatible con S3 (SeaweedFS).
- Bandeja del Gestor, "Mis actividades" del Usuario y detalle con historial, semáforo y cronómetro.

**Notificaciones**
- Campana de avisos en la aplicación y correos por SMTP.
- Proceso en segundo plano (`worker`) que revisa cada minuto:
  - aviso al 80 % del SLA;
  - auto-escalamiento al vencer el SLA;
  - recordatorio antes de la fecha compromiso;
  - aviso de compromiso vencido.

**Encuesta de satisfacción**
- Encuesta CSAT de 1 a 5 al cerrar un ticket como Resuelto, con un enlace de un solo uso válido por 7 días.
- Página pública sin inicio de sesión.
- Resultado visible en el ticket.

**Analítica**
- Seis tableros: Resumen, Tiempos y SLA, Equipo, Flujo, Clientes y Demanda.
- Vista personal para el Usuario.
- Filtros por fechas, área y prioridad.
- Comparación contra el periodo anterior.
- Exportación a CSV.

**Plataforma**
- Monolito modular con reglas de dependencia verificadas por pruebas.
- Identificadores públicos UUID; el id entero queda para uso interno.
- Despliegue completo con Docker Compose (desarrollo y producción) y datos de prueba opcionales (`DEV_SEED`).

[0.1.0]: https://github.com/DatzinDev/OpenDesk/releases/tag/v0.1.0
