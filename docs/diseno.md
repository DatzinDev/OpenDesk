# OpenDesk — Diseño

## Propósito
OpenDesk es una herramienta de trabajo diario para equipos de atención a clientes. La interfaz debe
sentirse corporativa y confiable, mostrar solo lo necesario para decidir y asumir que quien la usa es
un profesional: sin tutoriales invasivos, sin textos de relleno y sin formularios innecesarios.

## Principios
1. **Una acción principal por vista.** Cada pantalla responde a una pregunta ("¿qué tengo pendiente?",
   "¿quién tiene acceso?") y destaca una sola acción.
2. **El control adecuado para cada dato.** Antes de agregar un campo de texto, se busca un control más
   preciso (ver tabla). Un formulario con más de 6 campos se revisa.
3. **Formularios en contexto.** Alta y edición se abren en un panel lateral (*drawer*) o modal sobre la
   lista; el usuario no pierde el lugar donde estaba.
4. **Información progresiva.** Las listas muestran lo esencial; el detalle se abre a demanda.
5. **Estados explícitos.** Toda lista vacía indica qué hacer; todo error indica qué ocurrió y cómo
   resolverlo; toda acción confirma su resultado con el mismo verbo del botón ("Crear usuario" →
   "Usuario creado").
6. **Lenguaje del usuario.** Se nombra lo que la persona entiende ("Desactivar acceso"), no cómo está
   construido el sistema.

## Controles por tipo de dato

| Dato | Control |
|---|---|
| Opción entre 2 y 4 valores (rol, resultado de cierre) | `SegmentedControl` |
| Persona o área | `Select` con búsqueda y avatar |
| Prioridad | `Chip` de selección única con color |
| Fecha / fecha y hora | `DatePickerInput` / `DateTimePicker` |
| Días de la semana | Grupo de `Chip` (L M M J V S D) |
| Ventana horaria | Dos `TimeInput` |
| Duración del SLA | `NumberInput` con sufijo "h" |
| Activo / inactivo | `Switch` |
| Estado de ticket o cuenta | `Badge` |
| Tiempo restante de SLA | Barra de progreso con semáforo |
| Comentario | `Textarea` con autoajuste de altura |
| Aceptar / rechazar | Dos botones; rechazar exige comentario en línea |

## Identidad visual
Basada en la marca Datzin (sitio oficial y logotipo).

| Token | Valor | Uso |
|---|---|---|
| `navy` | `#0b1d3a` | Color del logotipo. Navegación lateral, botones primarios, texto de énfasis. |
| `ink` | `#0d0d0d` | Texto principal. |
| `paper` | `#ffffff` | Superficies de contenido. |
| `soft` | `#eff0f3` | Fondo de la aplicación, separadores. |
| `orange` | `#ff8e3c` | Acento de marca: indicador de sección activa, foco, elementos destacados. No se usa para texto sobre blanco (contraste insuficiente). |
| `contrast` | `#087f8c` | Tercer color de la identidad predeterminada; aporta contraste en seguimiento, eventos y plazo dentro de su umbral. |
| `pink` | `#d9376e` | Alertas, vencimientos y acciones destructivas. |

La identidad es editable: Principal, Acento y Contraste corresponden a `primary`, `accent` y
`secondary` en la configuración. El proveedor genera las escalas de interfaz `navy`, `orange` y
`contrast`, oscureciendo su color base cuando es necesario para alcanzar 4.5:1 sobre blanco; la
navegación usa el principal original y texto blanco o negro según su contraste. El editor permite
paletas OpenDesk, Azul, Verde, Violeta y Personalizada, además de logotipo e icono propios. Los colores
de estados semánticos (por ejemplo rojo para vencimiento) siguen siendo independientes de la marca.
La regla de sección activa naranja de la tabla es previa: la navegación actual marca la selección
con fondo tonal, borde del color del texto y peso 600.

- **Tipografía:** DM Sans (400, 500, 600), la misma del sitio de Datzin. Escala: 13 / 14 (cuerpo) /
  16 / 20 / 26 px. Títulos en peso 600, texto en mayúsculas y minúsculas normales (sin etiquetas en
  mayúsculas sostenidas).
- **Forma:** radio de 8 px en controles y 12 px en paneles; sombras solo en elementos flotantes
  (drawer, menú, modal).
- **Densidad:** media. Filas de tabla de 44 px; espaciado base de 4 px.
- **Movimiento:** solo como respuesta a una acción (abrir panel, confirmar); se respeta
  `prefers-reduced-motion`.
- **Accesibilidad:** contraste AA, foco visible con el acento naranja, navegación completa por teclado.

## Firma Datzin
OpenDesk es software de la familia Datzin y lo comunica de forma discreta:
- **Navegación lateral:** al pie, enlace "OpenDesk" al repositorio público y logotipo con texto
  "Datzin", enlazado a datzin.com.mx. Un logotipo de empresa no elimina el de OpenDesk: ambos
  se muestran en la cabecera de navegación.
- **Inicio de sesión:** panel de marca con el isotipo de OpenDesk como marca de agua y la leyenda
  "Hecho por Datzin".
- **Correos:** pie "Enviado por [organización] con OpenDesk, hecho por Datzin", con enlace a Datzin.

## Logotipo de OpenDesk

| Archivo | Uso |
|---|---|
| `web/src/shared/assets/opendesk-isotipo-blanco.png` y `opendesk-letras-blanco.png` | Sobre fondos azul marino: barra lateral, encabezado móvil y panel de inicio de sesión. |
| `web/src/shared/assets/opendesk-isotipo-navy.png` y `opendesk-letras-navy.png` | Sobre fondos claros, por ejemplo la página pública de la encuesta. |
| `web/public/favicon.png` y `apple-touch-icon.png` | Isotipo blanco sobre un cuadro azul marino redondeado; se distingue en pestañas claras y oscuras. |
| `docs/assets/opendesk-logo-claro.png` y `-oscuro.png` | Logotipo completo (isotipo y letras) del README, según el tema de GitHub. |
| `docs/assets/fuente/` | Originales en alta resolución, de los que se derivan los anteriores. |

En la interfaz se usa el componente `Logo` (`web/src/shared/ui/Logo.tsx`). El isotipo blanco funciona también como
marca de agua en el panel de inicio de sesión.

## Composición implementada de bandeja y detalle

Esta extensión conserva la identidad existente. Las reglas siguientes describen el código de
`InboxPage`, `TicketPage`, `TicketViews.module.css`, `TicketTimeline`, `TicketFiles` y el contenedor
de aplicación; no certifican fidelidad visual a las referencias aprobadas.

**Regla de superficie clara.** El espacio de trabajo tiene fondo `soft`, ancho máximo de 1760 px
y margen centrado. Los bloques usan superficies blancas con borde tenue y radio de 12 px; la
separación proviene de bordes y espacio, sin sombras propias de estas vistas. El relleno exterior
es de 24 × 28 px y pasa a 20 × 16 px hasta 48 em.

**Regla de lectura por bloques.** La bandeja presenta título y Nuevo ticket, cuatro indicadores,
propuestas, filtros y tabla. Los indicadores tienen cuatro columnas y las propuestas tres, con
14 px entre bloques. Se muestran hasta tres propuestas inicialmente; Ver todas revela las restantes.
La búsqueda está en los filtros, junto a estado, área, prioridad y asignado. La tabla conserva
folio y título separados, área, asignado, estado, plazo, prioridad, última actividad y acciones;
usa desplazamiento horizontal a partir de un ancho mínimo de contenido de 1120 px, relleno vertical
de 10 px y paginación con rango y total. La fila abre el detalle con clic o Enter, y ofrece Ver y
un menú de acciones independientes.

En Detalle, la cabecera reúne folio, intervención, prioridad, título y metadatos; debajo aparecen
Detalle, Archivos e Historial. En escritorio ancho, descripción e información quedan a la izquierda,
seguimiento al centro y estado, acciones, plazo y adjuntos a la derecha. La rejilla usa columnas
`minmax(280px, 1fr)`, `minmax(340px, 1.15fr)` y 300 px, separadas por 16 px. Las pestañas Archivos
e Historial presentan los mismos archivos y eventos en una superficie dedicada. Anterior y
Siguiente recorren únicamente los tickets de la página de bandeja desde la que se abrió el detalle.

### Layout responsive

- Hasta 88 em, el detalle usa contenido flexible más una columna lateral de 290 px: información
  arriba y seguimiento debajo, con el lateral abarcando ambos bloques.
- Hasta 70 em, los indicadores pasan a dos columnas, las propuestas a una y los filtros a dos,
  con búsqueda ocupando todo el ancho.
- Hasta 48 em, el detalle se apila en el orden estado/acciones/plazo/adjuntos, información y
  seguimiento. Cabecera e información/seguimiento reciben 16 px de relleno; los indicadores, 14 px.
  La tabla mantiene su desplazamiento horizontal.

### Typography y componentes de estas vistas

Se conserva DM Sans y la escala global 13/14/16/20/26 px. Los títulos de sección usan 16 px,
el cuerpo 14 px y los metadatos 13 px. El título de ticket añade 22 px en base y 27 px desde `md`,
con interlineado 1.25; los indicadores usan 30 px, peso 650 e interlineado 1.3, con cifras tabulares.
Estos valores son propios de las vistas y no sustituyen la escala global.

Los comentarios mantienen saltos de línea, fondo claro `#f7f8fa`, borde tenue, radio de 8 px y
relleno de 10 × 12 px. El seguimiento usa línea de 1 px y nodos de 32 px con iconos SVG; conserva
actor, fecha, estado y decisión de cada evento. Los adjuntos son enlaces con nombre, tamaño y fecha,
borde, radio de 8 px, relleno de 10 px y foco visible de 2 px en el color de contraste. Los nombres
largos y valores de información permiten salto de palabra para no ensanchar los paneles.

**Regla de datos verificables.** Los indicadores proceden del resumen real de tickets y muestran
un guion mientras no hay datos; los errores ofrecen Reintentar. No incluyen curvas ni variaciones
inventadas. El plazo muestra horas transcurridas, total y porcentaje devueltos por el servicio;
usa el umbral de advertencia recibido, distingue SLA y compromiso y señala la medición al cierre.
Los archivos proceden de los eventos y enlazan a las descargas existentes. Información conserva
valores de campos personalizados, incluidos los archivados, y usa las etiquetas configuradas;
las acciones se muestran según rol, asignación y estado del ticket.

### Deriva y verificación pendiente

Las reglas previas de revisar formularios con más de seis campos y usar Chips para prioridad no
describen por completo los formularios globales configurables actuales: alta y edición usan Select
para prioridad y pueden incorporar campos adicionales. Se registra esta deriva sin promoverla a
regla para nuevas superficies ni reformar aquí el sistema de controles. La cabecera de bandeja no
incluye la búsqueda del contrato aprobado: el código la coloca en el bloque de filtros.

Esta documentación se contrastó con fuentes y estilos. No se dispone de capturas actuales de
escritorio y móvil: queda pendiente comprobar composición renderizada, contraste efectivo,
desbordamientos y fidelidad a las referencias. Los objetivos generales de accesibilidad y acabado
son criterios del sistema, no una certificación de estas vistas.
