# 09 — Identidad y formulario global

Solo el Administrador modifica estas opciones desde Configuración. El Gestor y el Usuario usan la identidad y el formulario definidos, conservando sus permisos actuales.

## Identidad

- Logotipo e icono de pestaña separados, con restauración de los originales.
- PNG y WebP fijos de hasta 1 MB, entre 32 y 2048 px por lado. Se decodifican y vuelven a codificar en el servidor.
- Paletas OpenDesk, Azul, Verde, Violeta o Personalizada (principal, acento y contraste).
- Vista previa antes de guardar. El servidor conserva la configuración para todos los usuarios.
- Navegación, acceso y encuesta usan la identidad. La firma OpenDesk y Datzin permanece visible y enlazada.
- Los controles sobre blanco usan variantes legibles del color; la navegación mantiene el principal elegido y ajusta el color del texto.
- Los correos conservan su diseño y el nombre de organización configurado.

## Formulario

- Editor independiente en `/formularios/tickets`, accesible desde Configuración.
- Un formulario global con hasta 20 campos adicionales activos; máximo 200 definiciones contando archivados.
- Tipos: texto (500 caracteres), número finito, fecha, lista de una opción y sí/no.
- Etiqueta (80 caracteres), ayuda opcional (200), orden, obligatorio al crear y activo.
- Listas de hasta 50 opciones con identificadores estables y activación independiente.
- Un campo guardado no cambia de tipo ni se elimina; se desactiva. Las opciones tampoco se eliminan.
- Los ocho campos predeterminados aparecen en el editor y pueden cambiar de nombre, ayuda y orden, mezclándose con los adicionales. Título, área y responsable siguen obligatorios; el resto permite ajustar obligatoriedad.
- Prioridades conservan claves Alta/Media/Baja, con etiquetas editables y opciones ocultables; al menos una debe quedar activa. Áreas y personas vienen de sus catálogos.
- Adjuntos obligatorios se validan al crear. Un compromiso no se altera al cambiar la prioridad.
- Alta valida los obligatorios; cero y No son respuestas válidas. La edición histórica no exige completar campos incorporados después.
- Solo los campos activos son editables. Los valores archivados siguen visibles en detalle y CSV.
- Los cambios de valores aparecen en el historial con etiqueta, valor previo y nuevo.
- Una revisión obsoleta impide guardar y permite actualizar el formulario conservando datos compatibles.
- CSV agrega campos activos y archivados con valores en la selección, y neutraliza celdas de texto interpretables como fórmulas.

## Encuesta de clientes

- Editor independiente en `/formularios/encuesta`, solo Administrador.
- Preguntas ordenables de cinco estrellas, sin cota de cantidad en el editor; ayuda opcional, activación y obligatoriedad configurables.
- La pregunta original de satisfacción general permanece activa y obligatoria para conservar el indicador CSAT.
- Las preguntas guardadas se desactivan, sin eliminarlas. Cada envío conserva sus preguntas y su orden; editar el formulario no cambia correos enviados.
- Respuestas entre 1 y 5, identificadores conocidos y todas las obligatorias contestadas antes de guardar. El cliente confirma la encuesta en la página; los enlaces de correo preseleccionan una calificación.
- El bloqueo y la actualización de la fila impiden sobrescribir una respuesta ya registrada.
- Los resultados de todas las preguntas aparecen en la encuesta y el detalle del ticket.

## Actualización de instalaciones

Migraciones aditivas: 0011 agrega valores personalizados y revisión inicial; 0012 agrega preguntas/respuestas por envío y conserva el texto vigente de encuestas anteriores; 0013 registra fecha de decisiones sobre propuestas. No eliminan tickets, encuestas ni eventos. Actualizar API y worker y luego reconstruir frontend; respaldar previamente la base y adjuntos.
