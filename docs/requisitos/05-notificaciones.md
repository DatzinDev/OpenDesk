# 05 — Notificaciones

## Objetivo
Informar oportunamente a cada participante, dentro de la aplicación y por correo electrónico.

## Canales
- **En sistema**: campana con contador + lista; clic lleva al ticket. Se marcan como leídas.
- **Correo**: enviado por SMTP con el remitente definido en `MAIL_FROM` / `MAIL_FROM_NAME`.
  Cada correo incluye un botón hacia la vista correspondiente y la firma de OpenDesk / Datzin.
- Regla general: toda acción relevante genera correo, salvo los eventos marcados como solo en sistema.

## Eventos

| Evento | Destinatario | Sistema | Correo |
|---|---|:-:|:-:|
| Cuenta creada | Nuevo usuario | ❌ | ✅ |
| Rol modificado o cuenta desactivada | Usuario afectado | ❌ | ✅ |
| Ticket asignado / reasignado | Nuevo asignado | ✅ | ✅ |
| Propuesta enviada | Gestores | ✅ | ✅ |
| Propuesta aceptada / rechazada | Usuario | ✅ | ✅ |
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
- RF-05.4 La anticipación del recordatorio (default 24 h) es parámetro global.

## Preguntas abiertas
1. ¿Los Gestores quieren correo por **cada** propuesta o un resumen periódico?
2. ¿Se envía copia al cliente cuando cambia el estado de su ticket? v1 propone **no** (solo encuesta).
