# 04 — Tickets y flujo

## Objetivo
Crear un ticket en menos de 30 segundos y que todo su seguimiento sea una conversación
clara de propuestas y decisiones.

## Crear ticket (Gestor): un solo formulario, 7 campos
| Campo | Obligatorio | Nota |
|---|:-:|---|
| Título | ✅ | una línea |
| Descripción | ✅ | texto libre |
| Área | ✅ | filtra la lista de asignables |
| Asignado a | ✅ | usuario del área |
| Prioridad | ✅ | Alta / Media / Baja; valor por defecto: Media |
| Nombre del cliente | ❌ | |
| Correo del cliente | ❌ | habilita la encuesta (06) |

- RF-04.0 La prioridad es únicamente informativa: sirve para clasificar, filtrar y para la
  analítica. No modifica el SLA ni el orden de atención.

Categorías y etiquetas: fuera de v1.

## Estados
```
Asignado ──(propuesta)──> Pendiente de aprobación ──(acepta)──> En seguimiento / Escalado / Cerrado
    ^                              │
    └─────────(rechaza)────────────┘
```
| Estado | Significado |
|---|---|
| Asignado | Usuario debe proponer algo. SLA corriendo si nunca se ha aceptado propuesta. |
| Pendiente de aprobación | Usuario envió propuesta; Gestor debe decidir. |
| En seguimiento | Actualización aceptada; hay fecha compromiso vigente. |
| Escalado | Pasó al responsable directo (vuelve a quedar "Asignado" para el nuevo). |
| Cerrado | Cierre aceptado. Resultado: **Resuelto** o **No resuelto**. |

## Acciones del Usuario (solo 3)
- RF-04.1 **Agregar actualización**: comentario de lo que hará + **fecha tentativa** de resolución (obligatoria, futura).
- RF-04.2 **Escalar**: comentario del motivo. Al aceptarse, pasa al responsable directo (03).
- RF-04.3 **Cerrar**: comentario de lo que se hizo.
- RF-04.4 Solo puede haber **una propuesta pendiente** a la vez por ticket.

## Decisiones del Gestor
- RF-04.5 **Aceptar** (comentario opcional) → aplica la acción. La primera aceptación detiene el SLA (02).
- RF-04.6 **Rechazar** (comentario obligatorio) → ticket vuelve a "Asignado"; el Usuario debe
  proponer otra fecha/acción.
- RF-04.7 Además el Gestor puede en cualquier momento: **reasignar**, **cerrar directamente**
  (Resuelto / No resuelto, con comentario) y **comentar**.
- RF-04.8 Al aceptar un cierre, el Gestor marca **Resuelto** o **No resuelto**.

## Fecha compromiso
- RF-04.9 Al aceptar una actualización, su fecha tentativa se vuelve la fecha compromiso vigente.
- RF-04.10 Si se vence la fecha compromiso sin cierre → ticket marcado **"Compromiso vencido"**,
  Usuario y Gestor notificados; el Usuario debe proponer nueva actualización o cierre.

## Vistas (pocas)
- **Usuario — "Mis actividades"**: lista de sus tickets ordenada por urgencia (SLA/compromiso más próximo primero), con los 3 botones de acción.
- **Gestor — "Bandeja"**: arriba las propuestas pendientes de decisión (aceptar/rechazar en un clic), abajo todos los tickets con filtros por estado, área, asignado.
- **Detalle de ticket**: datos + línea de tiempo (creación, asignaciones, propuestas, decisiones, escalamientos, cierre) + semáforo SLA.

## Criterios de aceptación
- Crear ticket con los campos obligatorios → estado Asignado, SLA corriendo, aparece en "Mis actividades" del asignado.
- Usuario propone actualización → aparece en la bandeja del Gestor; el Usuario no puede enviar otra mientras esté pendiente.
- Gestor rechaza sin comentario → no se permite.
- Gestor acepta cierre "Resuelto" con correo de cliente → se dispara encuesta (06).

## Preguntas abiertas
0. Reasignación a un compañero del mismo nivel o envío a otra área: ¿quién la solicita y quién la aprueba?
1. ¿Adjuntos (fotos, PDFs) en ticket o en propuestas?
2. ¿Folio visible tipo `OD-000123`?
3. ¿Un ticket cerrado se puede **reabrir**?
4. ¿Las propuestas de un Usuario las aprueba cualquier Gestor o solo quien creó el ticket? v1 propone cualquier Gestor.
