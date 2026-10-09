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
| `pink` | `#d9376e` | Alertas, vencimientos y acciones destructivas. |

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
- **Navegación lateral:** al pie, el logotipo de Datzin y el texto "Software de la familia Datzin",
  con enlace a datzin.com.mx.
- **Inicio de sesión:** panel en `navy` con el patrón hexagonal del logotipo y la leyenda
  "Hecho por Datzin".
- **Correos:** encabezado con el nombre de OpenDesk y pie "Enviado por OpenDesk, hecho por Datzin".
