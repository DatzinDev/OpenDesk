# 04 — Tickets y flujo

## Objetivo
Crear un ticket en menos de 30 segundos y que todo su seguimiento sea una conversación clara de
propuestas y decisiones.

## Crear ticket (Gestor o Admin): un solo formulario, 7 campos
| Campo | Obligatorio | Nota |
|---|:-:|---|
| Título | ✅ | una línea |
| Descripción | ✅ | texto libre |
| Área | ✅ | filtra la lista de asignables |
| Asignado a | ✅ | persona activa del área |
| Prioridad | ✅ | Alta / Media / Baja; valor por defecto: Media |
| Nombre del cliente | ❌ | |
| Correo del cliente | ❌ | habilita la encuesta (06) |

Opcionalmente se pueden agregar adjuntos (ver RF-04.14).

- RF-04.0 La prioridad es únicamente informativa: sirve para clasificar, filtrar y para la
  analítica. No modifica el SLA ni el orden de atención.
- RF-04.1 Cada ticket tiene un **folio** visible con el formato `OD-000123`. Se muestra en listas,
  detalle y correos, y se puede buscar por él.

Categorías y etiquetas: fuera de v1.

## Estados
```
Asignado ──(propuesta)──> Pendiente de aprobación ──(acepta)──> En seguimiento / Asignado (nuevo responsable) / Cerrado
    ^                              │
    └──(rechaza; vuelve a En seguimiento si ya hay compromiso)
Cerrado ──(el Gestor reabre)──> Asignado
```
| Estado | Significado |
|---|---|
| Asignado | El Usuario debe proponer algo. Corre el SLA de primera respuesta. |
| Pendiente de aprobación | El Usuario envió una propuesta; el Gestor debe decidir. |
| En seguimiento | Actualización aceptada; hay fecha compromiso vigente. |
| Cerrado | Resultado: **Resuelto** o **No resuelto**. |

Escalamientos y reasignaciones no son un estado: quedan en la línea de tiempo y el ticket vuelve a
"Asignado" para el nuevo responsable.

## Acciones del Usuario asignado (4 propuestas)
- RF-04.2 **Agregar actualización**: comentario de lo que hará y **fecha tentativa** de resolución (obligatoria, futura).
- RF-04.3 **Escalar**: comentario del motivo. Al aceptarse, sube al siguiente nivel de su área (03).
- RF-04.4 **Reasignar**: comentario del motivo y destino: un **compañero activo de su área** o **otra área**.
- RF-04.5 **Cerrar**: comentario de lo que se hizo.
- RF-04.6 Solo puede haber **una propuesta pendiente** a la vez por ticket.

## Decisiones del Gestor
Cualquier Gestor o Admin puede decidir cualquier propuesta.
- RF-04.7 **Aceptar** (comentario opcional) aplica la acción:
  - Actualización: su fecha tentativa se vuelve la **fecha compromiso** y el ticket pasa a "En seguimiento".
  - Escalar: se aplica la matriz (RF-03.4 y RF-03.5).
  - Reasignar a un compañero: el ticket pasa a esa persona.
  - Reasignar a otra área: el Gestor **elige a la persona** del área destino al aceptar.
  - Cerrar: el Gestor marca **Resuelto** o **No resuelto**.
- RF-04.8 **Rechazar** (comentario obligatorio): el ticket vuelve a "En seguimiento" si ya tenía
  compromiso, o a "Asignado" si no; el Usuario debe proponer otra acción.
- RF-04.9 Además, el Gestor puede en cualquier momento **reasignar** a cualquier persona y **cerrar
  directamente** (Resuelto / No resuelto, con comentario). Si había una propuesta pendiente, queda
  **cancelada**.
- RF-04.10 El Gestor puede **reabrir** un ticket cerrado (comentario obligatorio): vuelve a "Asignado"
  con la última persona asignada y reinicia el SLA.
- RF-04.11 Toda asignación (creación, escalamiento, reasignación o reapertura) reinicia el SLA con la
  configuración vigente del área destino y descarta la fecha compromiso anterior.

## Edición
- RF-04.20 El Gestor, el Admin y el Usuario asignado pueden **editar** los datos descriptivos de un ticket
  abierto: título, descripción, prioridad, nombre y correo del cliente. El área y la persona asignada solo
  cambian mediante reasignación, para que el SLA se reinicie correctamente.
- RF-04.21 Cada edición queda en el historial con los campos modificados y sus valores anterior y nuevo;
  para la descripción solo se indica que cambió.

## Estatus de seguimiento
- RF-04.17 Existe un **catálogo global de estatus de seguimiento** (por ejemplo, "Esperando al cliente" o
  "Con proveedor"), editable por Admin y Gestor en la pestaña **Estatus** de la sección Áreas. Los estatus
  no se eliminan; se desactivan.
- RF-04.18 El Gestor fija el estatus de seguimiento de un ticket abierto desde su detalle. Es informativo:
  no cambia el estado del flujo ni el plazo, y cada cambio queda en el historial.

## Historial
- RF-04.19 El historial muestra solo el progreso del ticket: creación, asignaciones, propuestas con su
  descripción, decisiones, ediciones, cambios de estatus, cierre y reapertura. No admite comentarios sueltos.

## Plazos
- RF-04.12 El plazo vigente es el SLA de primera respuesta o, tras aceptar una actualización, la
  fecha compromiso. Se muestra con el semáforo de RF-02.15.
- RF-04.13 Si el plazo vence sin cierre, el ticket se marca **"SLA vencido"** o **"Compromiso vencido"**.
  El auto-escalamiento y los avisos por correo se definen en 05.

## Adjuntos
- RF-04.14 Se pueden adjuntar **imágenes y PDF** (hasta 5 archivos de 10 MB por acción) al crear el
  ticket y al enviar una propuesta.
- RF-04.15 Los archivos se guardan en un almacenamiento compatible con S3 dentro del despliegue y
  solo se descargan a través de la aplicación, por personas que pueden ver el ticket.

## Visibilidad
- RF-04.16 El Usuario ve únicamente los tickets que tiene asignados. Admin y Gestor ven todos.

## Vistas
- **Usuario, "Mis actividades"**: sus tickets ordenados por plazo (el más próximo primero), con el
  semáforo y las 4 acciones.
- **Gestor, "Bandeja"**: arriba las propuestas por decidir (aceptar o rechazar); abajo todos los
  tickets con filtros por estado, área y asignado, y búsqueda por folio o título, paginados de 50 en 50 con el total visible.
- **Detalle de ticket**: datos, semáforo, línea de tiempo (creación, asignaciones, propuestas,
  decisiones, cambios de estatus, cierre y reapertura) con sus adjuntos, el estatus de seguimiento y las
  acciones según el rol.

## Criterios de aceptación
- Crear ticket con los campos obligatorios → folio asignado, estado Asignado, SLA corriendo, aparece en "Mis actividades" del asignado.
- Usuario propone actualización → aparece en la bandeja del Gestor; el Usuario no puede enviar otra mientras esté pendiente.
- Gestor rechaza sin comentario → no se permite.
- Gestor acepta actualización → estado En seguimiento con la fecha propuesta como compromiso.
- Usuario propone enviar a otra área → al aceptar, el Gestor debe elegir a una persona de esa área; el SLA se reinicia con el horario de esa área.
- Ticket cerrado → el Gestor lo reabre con comentario y vuelve a Asignado con la última persona.
- Un Usuario intenta abrir un ticket que no tiene asignado → no lo encuentra.
- Gestor acepta cierre "Resuelto" con correo de cliente → se dispara encuesta (06).

## Decisiones
- La reasignación a un compañero o a otra área la **solicita el Usuario** y la **aprueba el Gestor**.
  Para otra área, el Gestor elige a la persona al aprobar.
- Adjuntos en v1, almacenados en SeaweedFS (compatible con S3, Apache-2.0).
- Folio visible `OD-000123`.
- Un ticket cerrado se puede reabrir, solo por el Gestor.
- Cualquier Gestor o Admin decide las propuestas, no solo quien creó el ticket.
- El historial es solo de progreso: se retira la acción "Comentar" del Gestor.
- Catálogo de estatus de seguimiento único para toda la organización.
