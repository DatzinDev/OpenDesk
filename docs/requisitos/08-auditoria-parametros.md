# 08 — Auditoría y parámetros

## Auditoría (solo Admin)
- RF-08.1 Se registra quién, qué, cuándo y sobre qué entidad para: logins (exitosos y denegados),
  cambios de usuarios/roles/áreas/SLA/matriz, todas las acciones sobre tickets, envíos de correo fallidos.
- RF-08.2 Registro de solo lectura (no editable ni borrable desde la app).
- RF-08.3 Vista: tabla con filtros por usuario, tipo de evento y fecha.

## Parámetros globales
Técnicos (solo Admin): dominio permitido, zona horaria. Funcionales (Admin y Gestor): el resto.

| Parámetro | Default |
|---|---|
| Dominio permitido (opcional) | vacío |
| Nombre de la organización (en correos) | "OpenDesk" |
| Anticipación de recordatorio | 24 h |
| Aviso de SLA por consumir | 80 % |
| Texto de la pregunta de encuesta | ver 06 |
| Zona horaria | America/Mexico_City |

Configuración técnica (credenciales de Google, servidor SMTP y remitente, BD, URL pública) va en variables de entorno de
Docker, **no** en la UI.

## Preguntas abiertas
1. ¿Cuánto tiempo se conserva la auditoría? v1 propone indefinido.
