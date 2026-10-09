# Personalización de OpenDesk

Estado: diseño aprobado, implementado y desplegado en tank el 9 de octubre de 2026. Revisión visual autenticada pendiente por indisponibilidad del plugin de navegador.

## Resultado esperado

El Administrador adapta la identidad visual y un único formulario global a su empresa desde Configuración. Los equipos siguen usando el mismo flujo de tickets y OpenDesk conserva una firma visible de producto y de Datzin.

La limpieza de textos redundantes es independiente y ya se publica. Se conservan instrucciones que explican una consecuencia, una validación o el alcance de un dato.

## Experiencia de configuración

Configuración mantiene Operación y Acceso y zona horaria. Solo el Admin ve dos secciones adicionales: **Identidad** y **Formulario de tickets**. No se añaden submenús ni un constructor visual de pantallas.

Cada sección guarda por separado, conserva cambios sin publicar hasta pulsar Guardar y muestra errores junto al control correspondiente. Guardar requiere validación en el servidor. Un cambio fallido deja vigente la configuración anterior.

## Identidad

- Logotipo de empresa e icono de pestaña configurables por separado.
- El logotipo identifica a la empresa en navegación y acceso. El icono identifica su pestaña. La encuesta pública usa la misma identidad.
- La firma **OpenDesk · Datzin**, enlazada al proyecto y a Datzin, permanece visible en navegación, acceso y encuesta. En una navegación móvil cerrada, queda disponible al abrir el menú.
- Sin personalización, se conserva la identidad actual. Quitar un recurso vuelve al original.
- Subida de PNG o WebP, máximo 1 MB y dimensiones de 32 a 2048 px por lado. El servidor decodifica y vuelve a codificar la imagen; no acepta SVG, HTML ni direcciones externas.
- Vista previa del recurso sobre las superficies donde se mostrará; el logo conserva sus proporciones sin recorte. Un icono rectangular se encaja en una superficie cuadrada.
- Se reutiliza el almacenamiento privado S3 existente. Una ruta pública sirve exclusivamente recursos de identidad aprobados, nunca claves arbitrarias ni adjuntos de tickets. Los recursos tienen identificadores nuevos al reemplazarse para evitar caché antigua.
- No se personalizan las plantillas de correo en esta entrega: conservan el nombre de organización configurado y la firma actual.

### Paleta

- Cuatro paletas: OpenDesk (actual), Azul, Verde y Violeta. Una opción Personalizada permite elegir color principal y acento mediante selector y valor hexadecimal.
- La vista previa incluye navegación, botón, selección, tabla y estados. Solo Guardar publica la paleta para todos los usuarios.
- Fondos claros y tipografía actual se mantienen. Los colores de error, vencimiento, aviso y éxito conservan su significado.
- El sistema genera las escalas necesarias para Mantine, elige texto claro u oscuro según contraste y valida que el texto normal alcance 4.5:1. El estado seleccionado también tiene una señal distinta del color.
- Los colores fijos de navegación y componentes compartidos se sustituyen por tokens de identidad. Las series de gráficas usan colores legibles y leyendas; no dependen únicamente de diferencias cromáticas.
- La configuración se guarda en el servidor, no en el navegador. Los demás usuarios la reciben al cargar o actualizar la vista; la vista previa local no altera sus pantallas.

## Un formulario global

El Admin define campos adicionales que aplican a todos los tickets, sin variantes por área.

### Definición de campos

Cada campo tiene identificador estable, etiqueta, tipo, orden, obligatorio y activo. Puede tener ayuda breve opcional. Tipos: texto corto, número, fecha, lista de una opción y sí/no.

- Máximo 20 campos activos para mantener un formulario utilizable.
- Etiqueta de 1 a 80 caracteres; ayuda opcional de hasta 200.
- Texto: hasta 500 caracteres. Número: valor finito. Fecha: fecha de calendario válida, sin hora. Sí/no: valor booleano; falso es una respuesta válida para un campo obligatorio.
- Lista: entre 1 y 50 opciones, cada una con identificador estable y etiqueta de hasta 80 caracteres. Una opción se puede desactivar sin borrar respuestas existentes.
- No se aceptan fórmulas, scripts, archivos ni condiciones entre campos.
- Se puede cambiar etiqueta, ayuda, orden y obligatoriedad. El tipo de un campo existente es inmutable: para cambiarlo se desactiva y se crea otro.
- Los campos se desactivan, no se eliminan. También se conserva la definición de las opciones desactivadas.
- La configuración usa una revisión para rechazar cambios basados en una versión antigua; la pantalla permite recargar antes de guardar nuevamente.

### Campos existentes y reglas

Título, descripción, área, responsable y prioridad se conservan, porque sostienen el flujo actual. Nombre y correo del cliente siguen siendo opcionales; el correo continúa habilitando la encuesta.

Los campos personalizados se muestran en una sección **Datos adicionales** del alta y la edición. Se muestran los valores guardados en el detalle, incluidos los campos que posteriormente se desactivaron. Los valores archivados son de solo lectura.

La obligatoriedad aplica al crear tickets nuevos. En la edición, un ticket anterior puede conservar la ausencia de un campo que se volvió obligatorio después de su creación. Si tenía valor en un campo obligatorio activo, no se permite borrarlo. No se exige completar campos nuevos para editar datos históricos no relacionados.

Una configuración nueva afecta formularios futuros. Si la definición cambió mientras una persona completaba el alta, el servidor rechaza el envío con un mensaje claro para recargar; no interpreta silenciosamente los datos con otro formulario.

### Persistencia e historial

- El módulo settings guarda la definición global como parámetro JSON validado y expone una interfaz pública de lectura para tickets.
- El módulo tickets añade una columna JSON de valores personalizados, con valor inicial vacío para tickets existentes, mediante migración Alembic.
- Las claves son los identificadores de campo; las listas guardan identificadores de opción. No se usan etiquetas como claves.
- El servidor valida tipos, tamaño, campos conocidos, campos activos y obligatoriedad. Un cliente no puede escribir valores archivados ni campos desconocidos.
- Actualizar valores es una combinación parcial explícita: omitir una clave conserva el dato; enviar null borra un campo opcional activo. No se sustituye todo el historial de valores al editar un campo.
- Cada modificación queda en el historial del ticket con identificador, etiqueta al momento del cambio y valores anterior/nuevo. Los cambios de definición quedan en auditoría.
- Cambiar una etiqueta actualiza su presentación actual, pero no reescribe etiquetas registradas en eventos históricos.
- Las respuestas del API de detalle y los contratos de alta/edición incorporan los campos adicionales; no se crean permisos alternativos para acceder a ellos.

### Exportación

El CSV conserva sus columnas actuales y agrega una columna por campo personalizado, incluyendo campos archivados que tengan valores en los tickets exportados. El encabezado incluye etiqueta e identificador corto para distinguir campos con nombres iguales. Opciones se exportan con su etiqueta; sí/no con lenguaje legible; fechas en formato ISO.

Se protegen celdas de texto y encabezados que puedan interpretarse como fórmulas al abrirlos en una hoja de cálculo. No se agregan filtros ni gráficas por campos personalizados en esta entrega.

## Límites entre módulos

- settings conserva sus parámetros actuales y añade identidad y definición de formulario, con escritura solo Admin.
- Una ruta pública entrega solo nombre de organización, recursos de identidad y paleta. No expone restricciones de acceso ni configuración técnica.
- Una ruta autenticada permite a los roles operativos leer la definición del formulario. Solo Admin puede modificarla.
- Providers consume identidad dentro del contexto de consultas, aplica tema y actualiza el icono. El frontend usa las interfaces públicas de features; shared no importa features.
- Los componentes Logo originales permanecen disponibles para la firma de producto y la restauración de valores predeterminados.
- tickets consulta la interfaz pública de settings para validar campos; analytics la usa para columnas de exportación. No se importan modelos internos entre módulos.
- No hay cambios en permisos de tickets, propuestas, SLA, encuesta ni autenticación.

## Pruebas de aceptación

1. Gestor y Usuario no pueden modificar identidad ni definición, incluso enviando peticiones directamente.
2. Las páginas sin sesión reciben identidad, sin parámetros técnicos ni datos de tickets.
3. Una imagen inválida, demasiado grande o de formato no permitido se rechaza; la marca anterior sigue disponible.
4. Cambiar o quitar logotipo e icono se refleja en sus superficies, conservando firma OpenDesk · Datzin.
5. Una paleta predefinida o personalizada mantiene contraste y legibilidad en controles y estados; restaurar devuelve la actual.
6. Crear y editar tickets guarda valores válidos de los cinco tipos; fecha inválida, infinito, clave desconocida y opción desactivada se rechazan.
7. Cero y falso son respuestas válidas; un campo obligatorio ausente en un ticket nuevo impide guardar.
8. Cambiar obligatoriedad no bloquea la edición de tickets anteriores con ese campo vacío.
9. Desactivar campo u opción conserva su valor visible y exportable. Cambiar tipo se rechaza.
10. Editar un valor conserva los demás y registra antes/después. Borrar un opcional no borra valores archivados.
11. Configuración concurrente y formulario obsoleto producen conflicto explícito, sin guardar parcialmente.
12. La migración conserva tickets existentes y su flujo; pruebas de arquitectura y reglas actuales siguen pasando.
13. El CSV incluye valores y etiquetas correctas, distingue encabezados repetidos y neutraliza texto interpretable como fórmula.
14. Revisión visual conjunta en escritorio y móvil de configuración, alta, edición, detalle, acceso y encuesta; teclado, carga, error y recursos ausentes.

## Entrega y despliegue

Una vez aprobado este diseño, preparar el plan de implementación. El trabajo se ejecuta en el repositorio local y se valida antes de publicar en tank:/srv/apps/opendesk.

El despliegue necesitará API y frontend, y una migración de datos. Se respalda la base y se conservan imágenes anteriores antes de actualizar. Las nuevas columnas y los contratos deben permitir una transición compatible; no se eliminan columnas ni tickets.

El Markdown de recomendaciones de negocio continúa excluido de Git. Este diseño no cambia esas reglas de negocio ni presume que estén aprobadas.
