# 03 — Matriz de responsables

## Objetivo
Saber siempre a quién sube un ticket cuando alguien escala o no responde a tiempo.

## Reglas
- RF-03.1 Las personas con rol Usuario pertenecen a un área y tienen como máximo **un** responsable
  directo: otro Usuario activo **de la misma área**. Puede quedar vacío (tope de la cadena).
- RF-03.2 La sección Áreas se organiza en tres pestañas: **Áreas y personas** (alta de áreas y asignación
  de personas, editable en línea), **Matriz de escalamiento** (responsable directo por persona, agrupada por
  área y editable en línea) y **Días festivos**.
- RF-03.3 No se permiten ciclos (A → B → A). El sistema lo valida al guardar.
- RF-03.4 Escalamiento (manual o automático) reasigna el ticket al responsable directo del
  asignado actual; el asignado anterior queda en el historial.
- RF-03.5 Si el asignado no tiene responsable directo (tope de la cadena), el ticket se
  marca **"Requiere intervención del Gestor"** y no se reasigna.
- RF-03.6 No se puede desactivar a un usuario que es responsable de otros: primero se les asigna otro
  responsable. El sistema indica cuántas personas tiene a cargo.
- RF-03.7 Si un usuario cambia de área, pierde su responsable directo y quienes lo tenían como
  responsable quedan sin él, para que se reasignen dentro de su área.

## Criterios de aceptación
- A tiene responsable B; ticket de A vence SLA → queda asignado a B, A y B notificados.
- B no tiene responsable; ticket de B vence SLA → bandera "Requiere intervención", Gestor notificado.
- Intentar poner B → A cuando A → B ya existe → error de ciclo.
- Intentar asignar como responsable a alguien de otra área → error.
- Intentar desactivar a B mientras A lo tenga como responsable → error con el número de personas a cargo.

## Evolución prevista
La reasignación a un compañero del mismo nivel o el envío a otra área se definirán en el módulo de
tickets (04).
