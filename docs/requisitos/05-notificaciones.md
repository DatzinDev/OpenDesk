# 05 — Notificaciones

## Objetivo
Informar oportunamente a cada participante, dentro de la aplicación y por correo electrónico.

## Canales
- **En sistema**: campana con contador de no leídos y lista de los últimos 30 avisos; un clic lleva al ticket
  y marca el aviso como leído. También se pueden marcar todos como leídos. La lista se actualiza cada 30 s.
- **Correo**: enviado por SMTP con el remitente definido en `MAIL_FROM` / `MAIL_FROM_NAME`.
  Cada correo incluye un botón hacia la vista correspondiente y la firma de OpenDesk / Datzin.
- Regla general: toda acción relevante genera correo, salvo los eventos marcados como solo en sistema.

## Eventos

| Evento | Destinatario | Sistema | Correo |
|---|---|:-:|:-:|
| Cuenta creada | Nuevo usuario | ❌ | ✅ |
| Rol modificado o cuenta desactivada | Usuario afectado | ❌ | ✅ |
| Ticket asignado / reasignado / reabierto | Nuevo asignado | ✅ | ✅ |
| Propuesta enviada | Gestores (uno por propuesta) | ✅ | ✅ |
| Propuesta aceptada / rechazada | Usuario que la envió | ✅ | ✅ |
| SLA al 80 % consumido | Usuario | ✅ | ❌ |
| SLA vencido → auto-escalado | Asignado anterior, nuevo asignado, Gestores | ✅ | ✅ |
| Tope de cadena sin responsable | Gestores | ✅ | ✅ |
| Recordatorio 24 h antes de fecha compromiso | Usuario | ✅ | ✅ |
| Fecha compromiso vencida | Usuario y Gestores | ✅ | ✅ |
| Ticket cerrado | Usuario | ✅ | ❌ |

## Reglas
- RF-05.1 Un proceso en segundo plano revisa cada minuto vencimientos de SLA, recordatorios y compromisos.
- RF-05.2 Cada recordatorio se envía **una sola vez** por fecha compromiso (si cambia la fecha, se reprograma).
- RF-05.3 Si el correo falla, la notificación en sistema se entrega igual y el error queda en auditoría.
- RF-05.4 La anticipación del recordatorio (24 h por defecto) es un parámetro global. Mientras no exista la
  pantalla de parámetros (08), se define con la variable `REMINDER_HOURS`.
- RF-05.5 Cada aviso de SLA (80 % y vencido) se emite una sola vez por asignación; una nueva asignación los
  reinicia.
- RF-05.6 Al vencer el SLA sin propuesta aceptada, la propuesta pendiente (si existe) se cancela y el ticket
  se auto-escala según la matriz (RF-03.4 y RF-03.5).
- RF-05.7 Quien realiza una acción no recibe aviso de ella.
- RF-05.8 "Gestores" significa todos los Gestores activos; si la organización no tiene, los Admins.
- RF-05.9 El plazo vigente de cada ticket se muestra con un **cronómetro** del tiempo restante (o del
  tiempo transcurrido desde el vencimiento) en las listas y en el detalle.

## Criterios de aceptación
- Propuesta enviada → cada Gestor ve el aviso en la campana y recibe el correo.
- Ticket al 85 % de su SLA → el Usuario ve un aviso en la campana, sin correo.
- SLA vencido sin propuesta aceptada → el ticket pasa a la persona del siguiente nivel; el asignado anterior,
  el nuevo y los Gestores reciben aviso y correo.
- Fecha compromiso a menos de 24 h → un solo recordatorio, aunque el proceso revise varias veces.

## Decisiones
- Un correo a los Gestores por cada propuesta, sin resumen periódico.
- El cliente no recibe copia de los cambios de su ticket; solo la encuesta (06).
- El proceso en segundo plano corre en un contenedor propio (`worker`) y revisa cada minuto.
