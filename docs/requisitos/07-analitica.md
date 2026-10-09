# 07 — Analítica

## Objetivo
Reemplazar el Excel + Power BI: una sola pantalla que responda "¿cómo vamos?".

## Filtros (globales a la pantalla)
Rango de fechas (default últimos 30 días), área, asignado, prioridad.

## KPIs (tarjetas arriba)
| KPI | Definición |
|---|---|
| Tickets abiertos | Estado ≠ Cerrado |
| Cumplimiento de SLA | % de tickets con primera propuesta aceptada antes del vencimiento |
| Tiempo medio de primera respuesta | Asignación → primera aceptación |
| Tiempo medio de resolución | Creación → cierre |
| % Resueltos | Resueltos / cerrados |
| CSAT | Promedio de encuesta (y tasa de respuesta) |
| Compromisos vencidos | Tickets abiertos con fecha compromiso pasada |

## Gráficas
1. **Tendencia**: tickets creados vs cerrados por día (líneas).
2. **Por área**: abiertos y % SLA cumplido (barras).
3. **Por asignado**: carga actual y % SLA cumplido (barras horizontales, top 10).
4. **Escalamientos**: manuales vs automáticos por semana (barras apiladas).
5. **CSAT**: distribución 1–5 (barras).
6. **Por prioridad**: tickets abiertos y cerrados por prioridad (barras).

## Reglas
- RF-07.1 Datos en tiempo casi real: la pantalla se refresca sola cada 60 s.
- RF-07.2 Admin y Gestor ven todas las áreas (filtro por área disponible).
- RF-07.3 Exportar a CSV el listado de tickets filtrado.
- RF-07.4 (Deseable) El Usuario dispone de una vista personal con sus propios indicadores: tickets abiertos, cumplimiento de SLA, tiempo medio de primera respuesta y de resolución, y CSAT.

## Preguntas abiertas
1. ¿Qué indicador revisan hoy en Power BI que no esté aquí?
