# Registro de cambios

Todos los cambios relevantes de OpenDesk se documentan en este archivo. El formato sigue
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa
[versionado semántico](https://semver.org/lang/es/). El detalle de cada entrega y sus decisiones está en la
[bitácora](docs/bitacora.md).

## [0.1.2] — 2026-10-09

### Agregado
- Identidad de empresa configurable por Admin: logotipo, icono de pestaña y paletas de tres colores, predefinidas o personalizadas, con vista previa y contraste legible. Se conserva OpenDesk · Datzin.
- Editor independiente del formulario global de tickets: preguntas ordenables, campos predeterminados editables y adicionales de texto, número, fecha, lista o sí/no. Se conservan respuestas históricas al desactivar campos u opciones.
- Editor independiente de encuestas de clientes con múltiples preguntas de cinco estrellas. Cada envío conserva su formulario; CSAT sigue usando la pregunta de satisfacción general.
- Campos adicionales en alta, edición, detalle e historial y exportación CSV.
- Indicadores actuales de bandeja, filtro de prioridad y búsqueda por cliente; última actividad incluye decisiones registradas.

### Cambiado
- Bandeja con propuestas visibles, filtros compactos y tabla paginada de 20 tickets.
- Detalle con información, seguimiento y columna de estado, acciones, plazo y adjuntos. Pestañas de archivos e historial y navegación entre tickets de la página actual.
- Analítica con lecturas de los datos y jerarquía más clara para decidir.
- Logotipo de empresa encima de OpenDesk; menos texto explicativo y mayor aprovechamiento del espacio.
- SLA del detalle en horas hábiles; compromiso en tiempo natural. Los plazos cerrados permanecen al momento del cierre.
- El correo preselecciona estrellas; las respuestas se confirman en la página de la encuesta.

### Corregido
- Protección de borradores de formularios al navegar y salir.
- Rechazo de configuraciones obsoletas y de respuestas duplicadas de encuesta.
- Recuperación de página al cerrar el último ticket y aislamiento de acciones al cambiar de ticket.
- Valores numéricos inválidos y fórmulas en exportaciones CSV.

### Actualización
- Migraciones aditivas 0011–0013; realizar respaldo de base y adjuntos antes de actualizar.
- La comparación visual con sesión en escritorio y móvil queda pendiente; no se certifica fidelidad exacta a las referencias.

## [0.1.1] — 2026-10-09

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

[0.1.2]: https://github.com/DatzinDev/OpenDesk/releases/tag/v0.1.2
[0.1.1]: https://github.com/DatzinDev/OpenDesk/releases/tag/v0.1.1
[0.1.0]: https://github.com/DatzinDev/OpenDesk/releases/tag/v0.1.0
