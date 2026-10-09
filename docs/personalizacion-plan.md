# Plan de implementación de la personalización

> Implementación: superpowers:executing-plans o superpowers:subagent-driven-development, según el método elegido.

**Objetivo:** permitir al Admin configurar identidad y un formulario global, conservando historial y firmas del producto.

**Arquitectura:** ampliar settings con contratos separados de identidad y formulario; tickets almacena y valida valores adicionales; analytics los exporta. El frontend consume contratos públicos de features y reutiliza Mantine y el almacenamiento existente.

**Stack:** FastAPI, SQLAlchemy, Alembic, PostgreSQL, React, TypeScript, Mantine y S3. Pillow se incorpora únicamente para decodificar y normalizar imágenes en el servidor.

**Diseño aprobado:** [personalizacion-diseno.md](personalizacion-diseno.md).

## Restricciones

- Solo Admin cambia identidad y definición; Gestor y Usuario conservan sus permisos de tickets.
- PNG o WebP de hasta 1 MB, dimensiones de 32 a 2048 px; reencodificar en el servidor.
- Cuatro paletas y una personalizada; contraste normal mínimo 4.5:1.
- Máximo 20 campos activos; cinco tipos, sin fórmulas ni campos por área.
- Identificadores estables, desactivación sin eliminación, revisión para detectar cambios concurrentes.
- No modificar SLA, propuestas ni reglas de cierre.
- No incluir recomendaciones-negocio-local.md en commits ni transferencias.
- Desplegar en tank:/srv/apps/opendesk, con respaldo y compatibilidad de contratos durante la transición.

## Foco de revisión

1. Cero y falso no equivalen a un obligatorio vacío.
2. Desactivar campos/opciones no destruye valores históricos ni los vuelve editables.
3. Una definición obsoleta produce conflicto y no guarda parcialmente.
4. Las rutas públicas no filtran parámetros técnicos ni adjuntos.
5. El CSV no ejecuta fórmulas y los temas personalizados mantienen texto legible.

## 1. Identidad: servidor y configuración visual

**Archivos:** api/app/modules/settings/{schemas,service,router,__init__}.py; nueva lógica de imágenes en el mismo módulo; api/requirements.txt; api/tests/test_personalization.py; web/src/features/settings/{api,index}.ts y components; web/src/app/providers.tsx; web/src/shared/theme.ts; web/src/app/AppShell*; pantallas de acceso y encuesta; firma existente.

**Contrato:** GET /api/settings/branding público devuelve org_name, logo_url, icon_url y palette. PUT /api/settings/branding requiere Admin y guarda preset, primary, accent, logo_id e icon_id. POST /api/settings/branding/assets requiere Admin y devuelve id y url del recurso sanitizado. GET /api/settings/branding/assets/{id} sirve solo recursos registrados de marca. No recibe una clave S3 arbitraria.

- [ ] Pruebas de permisos, recurso inválido, formato falso, dimensiones, sustitución, quitar recurso y lectura pública segura.
- [ ] Guardar configuración en Param con valores predeterminados compatibles. Usar las interfaces públicas del módulo y eventos de auditoría existentes.
- [ ] Validar colores hexadecimales y generar escala y color de texto con cálculo WCAG; pruebas de contraste en colores claros y oscuros.
- [ ] Crear sección Identidad con vista previa sin publicar, subida de recursos, paletas y restauración de defaults.
- [ ] Aplicar identidad desde Providers y composición de app, conservando shared independiente de features.
- [ ] Personalizar navegación, acceso, encuesta e icono de pestaña; mantener firma OpenDesk · Datzin visible y enlazada.
- [ ] Ejecutar pruebas de backend, pruebas de colores, TypeScript, ESLint y build.

## 2. Formulario global: persistencia, controles y exportación

**Archivos:** api/app/modules/settings/form.py y contratos públicos; api/app/modules/tickets/{models,schemas,service}.py; api/app/modules/analytics/{repository,service}.py; nueva migración api/alembic/versions; api/tests/test_custom_fields.py; web/src/features/settings/components/FormEditor.tsx; web/src/features/tickets/components/{TicketDrawer,EditTicketDrawer,TicketTimeline}.tsx; nuevo CustomFields.tsx; web/src/features/tickets/{types,api}.ts; TicketPage.tsx.

**Contrato:** GET /api/settings/ticket-form autenticado devuelve {revision,fields}. PUT de la misma ruta requiere Admin y revisión vigente. Definición de campo: {id,label,type,help,required,active,options}; el orden es el de la lista. Tipos: text, number, date, select, boolean. Opción: {id,label,active}. TicketIn y TicketUpdate aceptan custom_values y form_revision; TicketOut devuelve custom_values. Identificadores de campos y opciones son UUID estables.

**Valores:** Record<id, string | number | boolean | null>; null borra opcional activo. Campos omitidos en PATCH permanecen. El backend entrega conflictos como 409 y valores inválidos como 422 con mensajes de campo.

- [ ] Pruebas de tipos, límites, valores falsy, obligatorio nuevo, edición histórica, definición obsoleta y escritura archivada.
- [ ] Crear migración aditiva JSON con default vacío y validar configuración: sin eliminar identificadores, sin cambio de tipo, sin duplicados, máximo 20 activos y 50 opciones por lista.
- [ ] Validar y combinar valores en create/update, mantener valores archivados y registrar cambios legibles con etiquetas al momento del evento.
- [ ] Añadir editor de campos solo Admin, con orden arriba/abajo, activar/desactivar y preview; opciones con identificadores estables.
- [ ] Añadir controles de datos adicionales en alta y edición; exponer valores históricos en detalle, sin editar archivados.
- [ ] Exportar columnas actuales más campos adicionales pertinentes, distinguiendo etiquetas duplicadas y neutralizando fórmulas en valores y encabezados.
- [ ] Ejecutar suite de backend y pruebas de API/formularios; TypeScript, ESLint y build.

## 3. Integración y despliegue

**Archivos:** documentación de requisitos, instalación y diseño si el contrato final lo requiere; docs/personalizacion-plan.md como registro de ejecución.

- [ ] Revisar el diff completo contra el diseño: permisos, recursos, contraste, valores históricos, exportación y estados de error/carga.
- [ ] Comprobar migración en PostgreSQL aislado y funcionamiento con tickets previos; no ejecutar tests destructivos sobre la base de producción.
- [ ] Inspección visual en escritorio y móvil si se recupera el navegador. Si sigue fallando, registrar esa limitación y comprobar los contratos reales sin eludir autenticación.
- [ ] Respaldar base y código de tank y etiquetar imágenes anteriores. Transferir únicamente archivos del cambio.
- [ ] Actualizar API con migración aditiva y después frontend; reconstruir worker solo cuando cambie su imagen compartida.
- [ ] Verificar servicios, rutas públicas, inicio OAuth y acceso protegido. Confirmar hashes de assets publicados.
- [ ] Registrar resultados y limitaciones; conservar respaldo para reversión.

## Resultado de ejecución — 9 de octubre de 2026

- Implementación directa en feat/personalizacion-opendesk, conservando los cambios de esta sesión.
- Identidad, definición global, formularios de alta/edición/detalle, historial y exportación implementados.
- 49 pruebas de backend y 6 pruebas de frontend aprobadas; TypeScript, ESLint, compilación y revisión independiente aprobadas.
- La revisión detectó y se corrigieron contraste en selección/hover, números JSON extremos y bloqueo de revisión cero. Se agregó recuperación de formularios obsoletos sin perder datos compatibles.
- PostgreSQL aislado: migración conservó 442 tickets; comprobación concurrente verificó espera y conflicto con revisión obsoleta.
- Producción: API, worker y frontend reconstruidos; migración 0011; 442 tickets antes y después. nginx válido, identidad pública 200 con contrato limitado, formulario sin sesión 401 y login OAuth 302.
- Respaldo previo de la base en /tmp/opendesk-before-personalization-20261009.dump; código e imágenes anteriores conservados en tank.
- No se ejecutaron pruebas destructivas en producción. La revisión visual con sesión y la carga de un logotipo mediante la interfaz siguen pendientes por el fallo del plugin de navegador.
- La implementación queda sin commit; recomendaciones-negocio-local.md sigue excluido localmente y no se transfirió.

## Ampliación aprobada — editores visuales y paleta de tres colores

Alcance confirmado por el usuario el 9 de octubre:
- Logotipo de empresa encima de la marca OpenDesk, sin recortes en navegación y móvil.
- Tercer color de contraste configurable y presente en presets, vista previa y controles secundarios.
- Vistas independientes en /formularios/tickets y /formularios/encuesta, solo Admin: preguntas en su orden real, edición de una pregunta a la vez y controles para reordenar.
- Ticket incluye sus ocho campos originales, mezclables con adicionales. Nombre, ayuda y obligatoriedad editables; título, área y responsable mantienen obligatoriedad por aprobación explícita. Prioridades con claves estables, etiquetas editables y opciones ocultables; áreas/personas vienen de sus catálogos. Adjuntos obligatorios se exigen solo en el alta.
- Encuesta con tantas preguntas de cinco estrellas como se necesiten, obligatorias u opcionales, ordenables y desactivables. La pregunta original de satisfacción general conserva su identidad, activa y obligatoria, para mantener CSAT comparable.
- Preguntas y respuestas quedan registradas por envío. Los cambios afectan nuevos envíos; migración 0012 conserva el texto vigente de los enlaces existentes y su calificación histórica. Elegir estrellas en el correo preselecciona una respuesta; el cliente confirma el envío en la página.
- Migración y concurrencia se verifican en PostgreSQL aislado antes del respaldo y despliegue en tank. No se escriben datos de prueba en producción.

### Verificación final de la ampliación

- 55 pruebas de backend y 8 de frontend aprobadas; TypeScript, ESLint y build aprobados. Detector estático de diseño sin hallazgos. El aviso de tamaño del bundle analítico permanece.
- Revisión independiente: corregidos pérdida de borrador al navegar y PATCH con revisión antigua que omitía custom_values. Se agregó protección al cerrar/recargar y confirmación al cambiar de pantalla.
- Regresión adicional RED→GREEN: una encuesta ya cargada en otra sesión no puede sobrescribir una respuesta nueva. Se refresca la fila al adquirir el bloqueo.
- PostgreSQL aislado: migración 0012 conservó 442 tickets y 237 encuestas, todas con snapshot; la prueba concurrente sigue rechazando revisiones obsoletas.
- Producción migrada a 0012 con respaldo de base/código e imágenes en /tmp/opendesk-before-builders-20261009.* y etiquetas before-builders-20261009. Conserva 442 tickets y 237 encuestas con snapshot. API, worker y nginx arrancaron correctamente.
- Las etiquetas de prioridades configuradas también se muestran en bandeja, detalle e historial, conservando las ocultas para los tickets históricos.
- Ruling: encuestas sin límite de cantidad impuesto en el editor, conforme a «pueden crear tantas quieran». La escala siempre es de cinco estrellas; CSAT sigue usando la pregunta original.
- Ruling: PATCH sin form_revision y sin custom_values mantiene compatibilidad de clientes anteriores, pero respeta la validación vigente de campos predeterminados; una revisión explícita antigua se rechaza.
- Menores diferidos de la revisión: errores generales en lugar de mensajes por control; en el editor una lista archivada requiere conservar una opción activa aunque el servidor permita todas inactivas. No afectan respuestas históricas.
- Pendiente: inspección visual e interacción con sesión en escritorio/móvil; el runtime del navegador sigue sin estar disponible. No se enviaron correos reales de prueba ni se crearon tickets de prueba en producción.
- Todo el código continúa sin commit; las recomendaciones privadas permanecen excluidas.


### Integración 0.1.2 solicitada

El usuario solicitó GitFlow hasta main, tag v0.1.2 y release0.1.2. Los cambios se registran por bloques con commits convencionales y archivos explícitos; se preserva la exclusión del documento privado. Las vistas operativas y su verificación se registran en docs/vistas-tickets-diseno.md. La limitación de revisión visual permanece en la documentación de la release.
