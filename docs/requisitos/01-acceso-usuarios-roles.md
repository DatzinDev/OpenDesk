# 01 — Acceso, usuarios y roles

## Objetivo
Que solo las personas autorizadas entren, con su cuenta de Google, y vean únicamente lo que
su rol necesita.

## Acceso
- RF-01.1 Inicio de sesión exclusivamente con Google (OpenID Connect). No hay registro ni contraseñas.
- RF-01.2 Solo pueden entrar correos **dados de alta previamente** por un Admin o Gestor
  (lista blanca). Un correo no registrado ve "No tienes acceso, contacta a tu administrador".
- RF-01.3 Opcional por parámetro: restringir a un dominio (`@empresa.com`).
- RF-01.4 Primer arranque: el correo definido en la variable `ADMIN_EMAIL` se crea como
  **Admin principal**. Este usuario es **inborrable**: no se puede desactivar, cambiar de rol
  ni editar desde la app (solo cambiando la variable de entorno).
- RF-01.5 Un usuario desactivado no puede iniciar sesión; su historial se conserva.

## Usuarios
Campos mínimos: nombre, correo (Google), rol, área, responsable directo (ver 03), activo.
Foto y nombre se toman de Google en el primer login.

- RF-01.6 Alta/edición/desactivación de usuarios (no se eliminan). El correo es editable (excepto el del
  Admin principal) para corregir errores de captura; al cambiarlo se cierran las sesiones abiertas de esa
  cuenta y se envía el aviso de acceso al nuevo correo.
- RF-01.7 Las personas con rol Usuario pertenecen a **una sola** área (obligatoria). Admin y Gestor
  operan sobre todas las áreas y no requieren una.
- RF-01.8 Los roles son excluyentes: un usuario tiene un único rol. Solo el rol Usuario puede recibir tickets.
- RF-01.9 Puede haber varios Admins. Solo un Admin puede crear, editar o desactivar otra cuenta Admin (excepto el Admin principal, ver RF-01.4).

## Roles (fijos)
- **Admin**: acceso total, incluida la configuración técnica (auditoría, parámetros globales).
- **Gestor**: responsable de la operación diaria. Administra todo lo funcional (usuarios, áreas, SLA, matriz,
  tickets, analítica) sin acceso a la configuración técnica. Permite delegar la operación sin otorgar permisos de Admin.
- **Usuario**: atiende los tickets que le asignan.

| Acción | Admin | Gestor | Usuario |
|---|:-:|:-:|:-:|
| Crear / editar / desactivar usuarios | ✅ | ✅ (excepto cuentas Admin) | ❌ |
| Asignar área y responsable directo | ✅ | ✅ | ❌ |
| Crear / editar áreas y SLA | ✅ | ✅ | ❌ |
| Parámetros globales técnicos (dominio permitido, zona horaria) | ✅ | ❌ | ❌ |
| Parámetros funcionales (recordatorio, aviso SLA, texto encuesta) | ✅ | ✅ | ❌ |
| Crear y asignar tickets | ✅ | ✅ | ❌ |
| Ver tickets | Todos | Todos | Solo asignados a él / escalados a él |
| Aprobar / rechazar propuestas | ✅ | ✅ | ❌ |
| Proponer actualización / escalar / cerrar | ❌ | ❌ | ✅ |
| Analítica | Global | Global | Solo la propia (deseable) |
| Auditoría | ✅ | ❌ | ❌ |

## Criterios de aceptación
- Login con Google de un correo dado de alta → entra con su rol.
- Login con correo no dado de alta → pantalla de acceso denegado, no se crea usuario.
- Un Usuario no puede abrir por URL un ticket que no le corresponde (403).
- Gestor crea un usuario nuevo → puede elegir rol Usuario o Gestor, nunca Admin.
- Nadie puede desactivar ni cambiar el rol del Admin principal.
