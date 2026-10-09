# 08 — Auditoría y parámetros

## Auditoría (solo Admin)
- RF-08.1 Se registra quién, qué, cuándo y sobre qué entidad para:
  - inicios de sesión, exitosos y denegados;
  - cambios de usuarios, roles, áreas, festivos y configuración;
  - todas las acciones sobre tickets;
  - respuestas de encuestas;
  - correos que no se pudieron enviar.
- RF-08.2 El registro es de solo lectura: no se edita ni se borra desde la aplicación. Se conserva indefinidamente.
- RF-08.3 La pantalla **Auditoría** permite filtrar por persona, tipo de evento y rango de fechas. Muestra 100 registros por página y un botón "Cargar más".
- RF-08.4 Cada registro muestra la acción en lenguaje claro y, en lugar de ids internos, los nombres de las personas y áreas involucradas. Si el registro es de un ticket, el folio enlaza a su detalle. El detalle técnico se despliega a pedido.

## Parámetros globales
Pantalla **Configuración**. Cada cambio queda en la auditoría.

| Parámetro | Por defecto | Quién lo edita |
|---|---|---|
| Nombre de la organización (encabezado y pie de los correos) | "OpenDesk" | Admin y Gestor |
| Anticipación del recordatorio de fecha compromiso | 24 h (o `REMINDER_HOURS`) | Admin y Gestor |
| Aviso de SLA por consumir | 80 % | Admin y Gestor |
| Pregunta de la encuesta (con el marcador `{titulo}`) | ver 06 | Admin y Gestor |
| Dominio permitido para iniciar sesión (opcional) | vacío | Admin |
| Zona horaria de plazos, avisos y analítica | `APP_TIMEZONE` | Admin |

- RF-08.5 Si se define un dominio permitido, solo los correos de ese dominio pueden iniciar sesión. El Admin principal (`ADMIN_EMAIL`) siempre puede entrar.
- RF-08.6 El Admin puede enviar un **correo de prueba** a su propia cuenta para confirmar que el envío funciona. Si falla, la pantalla muestra el error del servidor de correo.
- RF-08.7 La configuración técnica (credenciales de Google, servidor SMTP y remitente, base de datos, almacenamiento y URL pública) permanece en las variables de entorno, **no** en la interfaz.

## Criterios de aceptación
- Un Gestor cambia el aviso de SLA a 50 % → el aviso se emite al consumir la mitad del plazo.
- Un Gestor intenta cambiar la zona horaria → no se permite.
- Dominio permitido `empresa.com` → un correo `@otra.com` no puede iniciar sesión.
- Un Gestor intenta abrir la auditoría → no tiene permiso.
- Filtrar la auditoría por "Configuración" → muestra solo los cambios de parámetros, con su valor anterior y el nuevo.

## Decisiones
- La auditoría se conserva indefinidamente y solo la ve el Administrador.
- Los parámetros se leen en cada uso: un cambio aplica de inmediato, también en el proceso en segundo plano.
- El nombre de la organización cambia la presentación de los correos; el remitente sigue definido en `MAIL_FROM_NAME`.
