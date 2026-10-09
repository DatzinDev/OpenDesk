<div align="center">

<img src="web/src/shared/assets/datzin-marca.png" alt="Datzin" width="72" />

# OpenDesk

### Ningún cliente se queda sin respuesta.

La mesa de ayuda que asigna cada solicitud a una persona, vigila que se responda a tiempo y te dice qué
tan satisfechos quedan tus clientes. Gratuita, de código abierto y tuya.

[**Pruébalo en 5 minutos**](docs/instalacion.md) · [Qué incluye](#todo-lo-que-tu-equipo-necesita) · [Novedades](CHANGELOG.md)

![Versión](https://img.shields.io/badge/versi%C3%B3n-0.1.0-ff8e3c)
![Licencia](https://img.shields.io/badge/licencia-AGPL--3.0-0b1d3a)
![Gratis](https://img.shields.io/badge/costo%20por%20usuario-%240-0b1d3a)

</div>

---

## ¿Te suena familiar?

- Un cliente escribe por tercera vez preguntando por su solicitud… y nadie sabe quién la tenía.
- Los pendientes viven en un Excel que se actualiza cuando alguien se acuerda.
- El reporte del mes se arma a mano, copiando datos de tres lugares distintos.
- La plataforma de tickets cobra por cada persona del equipo, y cada año cuesta más.

**OpenDesk ordena todo eso en un solo lugar**, con reglas claras y sin costo por usuario.

## Cómo cambia el día a día

**Cada solicitud tiene dueño desde el primer minuto.**
El Gestor registra la solicitud en menos de 30 segundos y la asigna a una persona del área correcta. Desde ese
momento corre el reloj del tiempo de respuesta comprometido.

**Nadie avanza sin que alguien lo revise.**
Quien atiende propone el siguiente paso: una fecha de solución, escalarlo, pasarlo a otra persona o cerrarlo.
El Gestor aprueba o rechaza con un clic. Cada decisión queda registrada.

**El tiempo de respuesta se cuida solo.**
Si una solicitud está por vencer, OpenDesk avisa. Si vence, la pasa automáticamente al siguiente nivel del
equipo, a la persona con menos carga. Los plazos respetan el horario de cada área y los días festivos.

**El cliente califica la atención con un clic.**
Al cerrar una solicitud resuelta, el cliente recibe una encuesta breve en su correo. Sin cuentas ni
formularios largos.

**Sabes cómo va tu operación sin armar reportes.**
Tiempos de respuesta, cumplimiento, carga del equipo, satisfacción y horas pico, siempre actualizados.

## Todo lo que tu equipo necesita

| | |
|---|---|
| **Tickets claros** | Folio, prioridad, datos del cliente, adjuntos e historial completo de cada solicitud. |
| **Tiempos de respuesta por área** | Cada equipo define su compromiso de atención, su horario y sus días festivos. |
| **Escalamiento automático** | Niveles por área, con reparto inteligente de la carga. |
| **Aprobación de cada avance** | Las fechas, los escalamientos, las reasignaciones y los cierres pasan por el Gestor. |
| **Avisos oportunos** | Notificaciones en la aplicación y por correo, con recordatorios antes de cada fecha comprometida. |
| **Estatus a tu medida** | "Esperando al cliente", "Con proveedor"… tú defines las etapas. |
| **Encuesta de satisfacción** | Calificación de 1 a 5 con comentario, visible en cada ticket. |
| **Analítica lista para usar** | Seis tableros y exportación a Excel (CSV), sin Power BI de por medio. |
| **Acceso con Google** | Sin contraseñas nuevas que recordar ni administrar. |

## Decisiones con datos, no con suposiciones

La sección de analítica responde a las preguntas que se hace cualquier responsable de atención a clientes:

- **¿Cómo vamos hoy?** Solicitudes abiertas, vencidas y por decidir, con su tendencia.
- **¿Cumplimos lo que prometemos?** Cumplimiento del tiempo de respuesta, por semana y por área.
- **¿Quién necesita apoyo?** La carga de cada persona, con alerta de sobrecarga.
- **¿Dónde se atora el proceso?** Rechazos, reaperturas y solicitudes que llegan al área equivocada.
- **¿Qué opinan los clientes?** Satisfacción, comentarios y quién nos busca más.
- **¿Cuándo reforzar el equipo?** Un mapa de calor con los días y las horas de mayor demanda.

Cada persona del equipo ve además sus propios indicadores, para mejorar con información y no con presión.

## Hecho para cada rol

| | Qué hace en OpenDesk |
|---|---|
| **Gestor** | Recibe las solicitudes, las asigna, aprueba cada avance y revisa la operación en la analítica. |
| **Quien atiende** | Ve sus pendientes ordenados por urgencia y propone el siguiente paso en segundos. |
| **Administrador** | Da acceso al equipo y mantiene la configuración. |
| **Tu cliente** | Recibe una respuesta a tiempo y califica la atención con un clic. |

## Por qué código abierto

- **Sin costo por usuario.** Agrega a todo tu equipo sin pensar en licencias.
- **Tus datos se quedan contigo.** OpenDesk corre en tu servidor; nadie más tiene acceso a la información de tus clientes.
- **Sin depender de un proveedor.** El código es tuyo para adaptarlo o ampliarlo.
- **Listo en minutos.** Un solo comando para tenerlo funcionando, con datos de ejemplo para explorarlo.

## Empieza hoy

Si tu equipo de sistemas tiene Docker, OpenDesk queda listo en unos minutos:

```bash
git clone https://github.com/DatzinDev/OpenDesk.git && cd OpenDesk
cp .env.example .env && docker compose up -d --build
```

La [guía de instalación](docs/instalacion.md) explica la configuración, el despliegue en producción y los
respaldos.

## Lo que viene

- Bitácora de auditoría visible para el Administrador.
- Configuración desde la aplicación: nombre de la organización, recordatorios, texto de la encuesta y más.
- Avisos instantáneos en pantalla.

Revisa las [novedades de cada versión](CHANGELOG.md) o propón una idea abriendo un *issue*.

## Comunidad

OpenDesk crece con quienes lo usan. Las ideas, los reportes de errores y las mejoras son bienvenidos: consulta
la [guía de contribución](CONTRIBUTING.md). Para reportar una vulnerabilidad, escribe a
**contacto@datzin.com.mx**.

<sub>OpenDesk se distribuye bajo la licencia [AGPL-3.0](LICENSE): puedes usarlo, modificarlo y desplegarlo libremente. ·
Documentación técnica: [instalación](docs/instalacion.md), [arquitectura](docs/arquitectura.md),
[requisitos](docs/requisitos/README.md) y [bitácora](docs/bitacora.md).</sub>

---

<div align="center">

Software de la familia **[Datzin](https://datzin.com.mx)**, hecho en Guadalajara.

</div>
