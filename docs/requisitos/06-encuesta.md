# 06 — Encuesta de satisfacción

## Objetivo
Medir la percepción del cliente con el mínimo esfuerzo para él.

## Reglas
- RF-06.1 Se envía solo si el ticket cierra como **Resuelto** y tiene correo de cliente, tanto al aceptar
  una propuesta de cierre como en el cierre directo del Gestor.
- RF-06.2 El correo contiene la pregunta y **5 botones (1–5)** directamente en el cuerpo. Cada botón abre
  la página pública de la encuesta (sin login), que registra la calificación y ofrece un comentario
  opcional.
- RF-06.3 Enlace con token aleatorio, de un solo uso y vigente 7 días. En la base de datos solo se guarda
  su hash.
- RF-06.4 Se guarda calificación, comentario y fecha de respuesta. El resultado es visible en el detalle
  del ticket cerrado.
- RF-06.5 Sin respuesta no se reenvía. Si el ticket se reabre y vuelve a cerrarse como Resuelto, se envía
  una encuesta nueva.
- RF-06.6 Abrir el enlace no registra nada por sí mismo: la página envía la calificación con una petición
  aparte. Así, los filtros de correo que abren enlaces automáticamente no responden la encuesta por el
  cliente.
- RF-06.7 El comentario se acepta una sola vez y solo después de calificar.

## Pregunta
> ¿Qué tan satisfecho quedaste con la atención a tu solicitud "{título}"?

En v1 el texto es fijo; se volverá editable por el Admin con los parámetros globales (08).

## Criterios de aceptación
- Cerrar Resuelto con correo → el cliente recibe el correo; clic en "4" → el ticket muestra 4 de 5.
- Segundo clic en el mismo enlace → "Esta encuesta ya fue respondida".
- Cerrar No resuelto, o sin correo de cliente → no se envía nada.
- Enlace con más de 7 días → "Esta encuesta venció".

## Decisiones
- Escala 1–5 (CSAT).
- Texto de la pregunta fijo hasta el módulo 08.
