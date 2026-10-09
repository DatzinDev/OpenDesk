# Bandeja y detalle de tickets — referencia aprobada

El usuario pidió implementar las composiciones de ejemplo_vista_bandeja.png y ejemplo_vista_ticket.png, usando los datos y funciones reales del proyecto. Trabajo directo y despliegue en tank ya autorizados.

## Dirección

Modo Operate. Conservar DM Sans, identidad editable y paleta navy/acento/contraste. Superficie clara, contenedores con borde tenue, tabla compacta y jerarquía similar a las imágenes. Los ejemplos fijan la composición; los valores inventados y los módulos inexistentes no forman parte del alcance.

## Bandeja

Cabecera con Nuevo ticket; búsqueda dentro de la fila de filtros. Cuatro indicadores actuales: pendientes de decidir, seguimiento, plazos en riesgo e intervención requerida, usando datos reales y sin variaciones ni curvas ficticias. Propuestas en tres columnas con decisiones disponibles y acceso a todas. Filtros compactos y tabla con folio/título separados, área, asignado, estado, plazo, prioridad y acciones. Paginación con rango visible. Conservar permisos y decisiones actuales.

## Detalle

Cabecera de folio, título, prioridad, intervención y metadatos. En escritorio ancho: datos y descripción a la izquierda, seguimiento al centro, estado/acciones/plazo/adjuntos a la derecha. En pantallas menores los bloques se reorganizan sin perder acciones ni historial. Adjuntos reales de eventos, enlaces existentes de descarga. Campos personalizados actuales e históricos incluidos en Información. No introducir categorías, relaciones, base de conocimiento, acciones masivas, búsqueda global ni permisos que no existan.

## Verificación

Pruebas focalizadas para indicadores, orden de adjuntos y cálculo de plazo si cambia el contrato. Suite, TypeScript, ESLint y build. Revisión independiente del flujo. Comparación visual pendiente si el navegador de la sesión continúa indisponible: no afirmar fidelidad exacta sin capturas del resultado. Respaldo antes de desplegar; no usar datos de prueba en producción.

## Resultado de implementación

- 60 pruebas de backend y 9 de frontend aprobadas, además de TypeScript, ESLint y compilación. Detector estático sin hallazgos.
- Corregidos tres hallazgos funcionales de revisión: fechas de aceptación/rechazo e historial previo mediante auditoría; vuelta a página válida tras acciones; aislamiento del estado de modales al cambiar de ticket.
- Migración 0013 verificada en PostgreSQL aislado: 1322 eventos, 442 tickets y 237 encuestas conservados.
- El revisor visual devolvió `recapture` porque no hay capturas del build. El runtime oficial del navegador sigue bloqueado; no hay aprobación de fidelidad visual ni de interacción responsive.
- La documentación de composición y paleta se derivó de los archivos implementados en docs/diseno.md.
