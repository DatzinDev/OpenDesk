# 02 — Áreas y SLA

## Objetivo
Separar equipos y que cada uno defina su propio tiempo de primera respuesta y horario de atención.

## Áreas
Campos: nombre, descripción corta, SLA (horas), horario de atención, pausa en días festivos, activa.

- RF-02.1 Crear, editar y desactivar áreas (no se eliminan). Admin y Gestor.
- RF-02.2 Cada área define su **SLA de primera respuesta en horas** (valor por defecto 24 h; mínimo 1 h).
- RF-02.3 Cambiar el SLA o el horario de un área solo afecta tickets **nuevos**; los existentes
  conservan la configuración con la que fueron creados (se guarda copia en el ticket).

## Horario de atención
- RF-02.4 Cada área define, **para cada día de la semana**, si se atiende y en qué horario (hora de
  inicio y fin). Ejemplo: lunes a viernes de 09:00 a 18:00 y sábado de 09:00 a 14:00.
- RF-02.5 Opción **24/7**: el SLA corre todos los días a toda hora. Es el valor por defecto.
- RF-02.6 Fuera del horario de atención el reloj del SLA se pausa automáticamente.
- RF-02.7 Las horas se calculan en la zona horaria de la organización (`APP_TIMEZONE`, por defecto
  `America/Mexico_City`).

## Días festivos
- RF-02.8 Existe un **calendario de días festivos** de la organización (fecha y nombre), administrado
  por Admin y Gestor.
- RF-02.9 Cada área decide si el SLA **se pausa en días festivos** (por defecto no).

## Regla del SLA
- RF-02.10 El reloj inicia cuando el ticket se **asigna** a un Usuario.
- RF-02.11 **Toda reasignación** (manual, escalamiento o auto-escalamiento) reinicia el SLA con la
  duración completa para el nuevo asignado.
- RF-02.12 Mientras no haya una propuesta aceptada, el plazo vigente es el SLA de primera respuesta.
  Propuestas rechazadas no lo detienen.
- RF-02.13 Cuando el Gestor acepta una actualización, el plazo vigente del ticket pasa a ser la
  **fecha compromiso** propuesta por el Usuario (ver 04).
- RF-02.14 Si el SLA de primera respuesta llega a cero sin propuesta aceptada → **auto-escalamiento**
  (ver 03 y 04).
- RF-02.15 Semáforo visible en el ticket: verde (> 50 % restante), amarillo (≤ 50 %), rojo (≤ 10 % o vencido).

## Criterios de aceptación
- Área 24/7 con SLA 12 h → ticket asignado a las 09:00 vence a las 21:00.
- Área L-V 09:00-18:00 con SLA 12 h → ticket asignado el viernes a las 15:00 vence el lunes a las 18:00.
- Ticket asignado el sábado en área L-V → el reloj inicia el lunes a las 09:00.
- Área L-V 09:00-18:00 y sábado 09:00-14:00 con SLA 12 h → ticket asignado el viernes a las 15:00 vence el lunes a las 13:00.
- Área que pausa en festivos, lunes festivo → el ticket del viernes del ejemplo anterior vence el martes a las 18:00.
- Editar el SLA del área a 48 h no cambia el vencimiento de ese ticket.
- Propuesta rechazada a las 15:00 → el reloj sigue corriendo.
