# 06 — Encuesta de satisfacción

## Objetivo
Medir la percepción del cliente con el mínimo esfuerzo para él.

## Reglas
- RF-06.1 Se envía solo si el ticket cierra como **Resuelto** y tiene correo de cliente.
- RF-06.2 El correo contiene la pregunta y **5 botones (1–5)** directamente en el cuerpo;
  un clic registra la calificación (sin login) y abre una página de "Gracias" con un
  comentario opcional.
- RF-06.3 Enlace con token único, de un solo uso, vigente 7 días.
- RF-06.4 Se guarda: calificación, comentario, fecha de respuesta. Queda visible en el detalle del ticket.
- RF-06.5 Sin respuesta → no se reenvía (v1).

## Pregunta (editable por Admin)
> ¿Qué tan satisfecho quedaste con la atención a tu solicitud "{título}"?

## Criterios de aceptación
- Cerrar Resuelto con correo → cliente recibe correo; clic en "4" → ticket muestra 4/5.
- Segundo clic en el mismo enlace → "Esta encuesta ya fue respondida".
- Cerrar No resuelto → no se envía nada.

## Preguntas abiertas
1. ¿Escala 1–5 estrellas o NPS 0–10? v1 propone 1–5 (CSAT).
