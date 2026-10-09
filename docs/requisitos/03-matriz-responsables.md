# 03 — Matriz de escalamiento

## Objetivo
Saber siempre a quién sube un ticket cuando alguien lo escala o no responde a tiempo, con una jerarquía
por niveles fácil de leer.

## Reglas
- RF-03.1 Cada área define su **número de niveles de escalamiento** (1 a 10; por defecto 3). El nivel 1
  es el primer contacto y el nivel más alto es el último antes de la intervención del Gestor.
- RF-03.2 Cada persona con rol Usuario pertenece a un área y ocupa **un nivel** dentro de ella. Al darla de
  alta o cambiarla de área entra al nivel 1, salvo que se indique otro.
- RF-03.3 Un nivel puede tener varias personas o ninguna.
- RF-03.4 Al escalar (manual o automáticamente), el ticket sube al **siguiente nivel con personas activas**
  de la misma área y se asigna a la persona de ese nivel con **menos tickets abiertos**. Toda reasignación
  reinicia el SLA (ver 02).
- RF-03.5 Si no hay un nivel superior con personas, el ticket se marca **"Requiere intervención del Gestor"**
  y no se reasigna.
- RF-03.6 No se puede reducir el número de niveles de un área por debajo del nivel más alto ocupado; primero
  se mueve a esas personas a un nivel inferior.
- RF-03.7 La sección Áreas se organiza en tres pestañas: **Áreas y personas** (alta de áreas y asignación de
  personas, editable en línea), **Matriz de escalamiento** (niveles por área, con el más alto arriba; cada
  persona se arrastra al nivel deseado, o se mueve desde el menú de su etiqueta en pantallas táctiles) y **Días festivos**.

## Criterios de aceptación
- Área con 3 niveles; ticket de una persona de nivel 1 escala → se asigna a la persona del nivel 2 con menos
  tickets abiertos.
- Nivel 2 vacío → el ticket escala al nivel 3.
- Ticket de una persona del nivel más alto escala → bandera "Requiere intervención", Gestor notificado.
- Persona en nivel 3 cambia a un área con 2 niveles sin indicar nivel → queda en nivel 1.
- Área de 3 niveles con alguien en el nivel 3 se intenta reducir a 2 → error que indica el nivel ocupado.

## Evolución prevista
La reasignación a un compañero del mismo nivel o el envío a otra área se definirán en el módulo de
tickets (04).
