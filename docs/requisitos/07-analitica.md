# 07 — Analítica

## Objetivo
Reemplazar el Excel y Power BI con una sección que responda a las preguntas de quien dirige un equipo de
atención a clientes. Cada pestaña atiende un tipo de análisis distinto.

| Pestaña | Pregunta que responde | Quién la ve |
|---|---|---|
| Resumen | ¿Cómo vamos hoy? | Admin y Gestor |
| Tiempos y SLA | ¿Cumplimos lo que prometemos? | Admin y Gestor |
| Equipo | ¿Cómo está repartido el trabajo y quién necesita apoyo? | Admin y Gestor |
| Flujo | ¿Dónde se atora el proceso? | Admin y Gestor |
| Clientes | ¿Qué tan satisfechos están y quién nos busca más? | Admin y Gestor |
| Demanda | ¿Cuándo y qué nos piden, para planear turnos? | Admin y Gestor |
| Mi desempeño | Mis propios indicadores | Usuario |

## Reglas
- RF-07.1 Los datos se actualizan solos cada 60 s.
- RF-07.2 Filtros globales: rango de fechas (7, 30 o 90 días, o un rango personalizado de hasta un año; por
  defecto, 30 días), área y prioridad. Los filtros quedan en la URL para compartir la vista.
- RF-07.3 Desde Resumen se exporta a CSV el listado de tickets creados en el periodo con los filtros
  aplicados. El archivo abre con acentos correctos en Excel.
- RF-07.4 El Usuario ve solo "Mi desempeño", calculado con los tickets que tiene asignados.
- RF-07.5 Cada KPI del periodo muestra su variación contra el periodo anterior de la misma duración, en verde
  cuando mejora y en rojo cuando empeora.
- RF-07.6 Los días y las horas se agrupan en la zona horaria de la organización.

## Definición de métricas
"Periodo" es el rango de fechas filtrado. Los KPI marcados como "ahora" ignoran el rango.

| Métrica | Definición |
|---|---|
| Abiertos (ahora) | Tickets en estado Asignado, Pendiente de aprobación o En seguimiento. |
| Por decidir (ahora) | Tickets con una propuesta pendiente. |
| SLA vencido (ahora) | Abiertos sin compromiso cuyo plazo ya pasó. |
| Compromiso vencido (ahora) | Abiertos con fecha compromiso pasada. |
| Requieren intervención (ahora) | Abiertos sin nivel superior para escalar. |
| Creados / Cerrados | Tickets creados / cerrados dentro del periodo. |
| SLA cumplido | Primeras respuestas aceptadas antes del vencimiento ÷ (primeras respuestas aceptadas + auto-escalamientos por SLA vencido). La primera respuesta es la primera propuesta aceptada de cada asignación; se registra al aceptarla. |
| Primera respuesta | Tiempo entre la asignación y la aceptación de la primera propuesta. Se reporta la mediana y el percentil 90. |
| Resolución | Tiempo entre la creación y el cierre de los tickets cerrados en el periodo (mediana y p90). |
| Compromisos cumplidos | Tickets cerrados con fecha compromiso vigente que se cerraron antes de esa fecha ÷ tickets cerrados con compromiso. |
| Auto-escalamientos | Reasignaciones automáticas por SLA vencido. |
| Carga | Tickets abiertos asignados a la persona. Se marca "Sobrecarga" cuando la carga es al menos 1.5 veces el promedio (mínimo 3). |
| Propuestas rechazadas | Propuestas rechazadas ÷ propuestas decididas (aceptadas o rechazadas). |
| Tickets reabiertos | Tickets reabiertos ÷ (cerrados + reabiertos) en el periodo. |
| Envíos entre áreas | Reasignaciones aceptadas o manuales hacia un área distinta a la de la persona de origen. |
| CSAT | Promedio de las calificaciones (1–5) respondidas en el periodo. |
| Tasa de respuesta | Encuestas respondidas ÷ encuestas enviadas en el periodo. |
| Cerrados como resueltos | Cerrados como Resuelto ÷ cerrados en el periodo. |
| Clientes recurrentes | Clientes (por nombre, o por correo si no hay nombre) con más de un ticket creado en el periodo. |
| Mapa de calor | Tickets creados por día de la semana y hora local. |

Los tiempos de primera respuesta y de resolución se miden en **horas hábiles**: descuentan lo que queda fuera
del horario del área del ticket y, si el área pausa en festivos, esos días. La antigüedad de los abiertos se
mide en tiempo natural. Las primeras respuestas registradas antes de esta regla solo tienen horas naturales y se
usan tal cual.

## Pestañas
- **Resumen**: KPI de la tabla anterior; creados vs cerrados por día; evolución del backlog (abiertos al
  cierre de cada día); abiertos por estado.
- **Tiempos y SLA**: SLA cumplido, primera respuesta y resolución (mediana y p90), compromisos cumplidos y
  auto-escalamientos; SLA por semana y por área; distribución del tiempo de resolución; antigüedad de los
  abiertos.
- **Equipo**: tabla por persona (carga, cerrados, SLA, primera respuesta, resolución, CSAT, rechazos y
  escalamientos); carga por persona y por nivel de escalamiento.
- **Flujo**: decisiones por tipo de propuesta; escalamientos manuales vs automáticos por semana; abiertos por
  estatus de seguimiento; envíos entre áreas (de → a).
- **Clientes**: CSAT, tasa de respuesta, cerrados como resueltos y clientes recurrentes; distribución de
  calificaciones; CSAT por semana; resultado de los cierres; clientes con más tickets; comentarios recientes.
- **Demanda**: creados, promedio por día y hora pico; mapa de calor día × hora; creados por semana; por área y
  por prioridad.
- **Mi desempeño**: mis abiertos, SLA, primera respuesta, resolución y CSAT; mis cerrados por semana.

## Criterios de aceptación
- Tres respuestas en el periodo (una a tiempo, una tarde y un auto-escalamiento) → SLA cumplido de 33.3 %.
- Dos tickets cerrados en 2 h y 10 h → resolución mediana de 6 h.
- Filtro por área → los KPI y el CSV solo incluyen tickets de esa área.
- Un Usuario que pide una pestaña distinta de "Mi desempeño" recibe un error de permiso.

## Decisiones
- Pestañas por tipo de análisis en lugar de un solo tablero, para no saturar la vista.
- Se agregan indicadores que no estaban en la propuesta original, comunes en atención a clientes: percentil 90 de los tiempos, antigüedad de los abiertos, tasa de rechazo, reaperturas, envíos entre áreas, clientes recurrentes y mapa de calor de la demanda.
- El cumplimiento del SLA y del compromiso se registra al momento de la decisión, porque el plazo cambia con cada asignación y no se puede reconstruir después.
- Las métricas se calculan al consultar, sin tablas de resumen; es suficiente para miles de tickets.
- Horas hábiles para los tiempos, para no castigar a un área por las noches y fines de semana en que no atiende.
