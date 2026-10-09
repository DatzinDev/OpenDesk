import type { Report, Tab } from "./api";

export type Reading = { title: string; detail: string };

/** Observaciones calculadas del reporte; no atribuyen causas ni inventan metas. */
export function readReport(tab: Tab, r: Report): Reading[] {
  const value = (key: string) => r.kpis[key]?.value;
  if (tab === "summary") {
    const created = value("created"), closed = value("closed");
    const balance = created != null && closed != null ? created - closed : null;
    return [
      { title: balance == null ? "Sin balance disponible" : balance > 0 ? `${balance} entradas más que cierres` : balance < 0 ? `${-balance} cierres más que entradas` : "Entradas y cierres al mismo ritmo",
        detail: "Balance del periodo seleccionado. Consulta la evolución de pendientes para ver su efecto en la cola." },
      { title: `${value("pending") ?? 0} propuestas por decidir`, detail: "Situación actual. Revisa la Bandeja para aceptar o rechazar; este conteo no se suma a los vencimientos." },
    ];
  }
  if (tab === "times") {
    const slow = r.series.sla_by_area.filter(x => x.sla != null).reduce<(typeof r.series.sla_by_area)[number] | null>((a, b) => !a || Number(b.sla) < Number(a.sla) ? b : a, null);
    return [
      { title: slow ? `${slow.area}: ${Number(slow.sla).toFixed(1)} % de SLA cumplido` : "Sin respuestas para comparar áreas", detail: "Menor cumplimiento del periodo. Revisa el volumen y las esperas antes de atribuirlo al equipo." },
      { title: `${value("auto_escalations") ?? 0} escalamientos por vencimiento`, detail: "El plazo incluye la espera de aprobación del Gestor. Compara la mediana con el p90 para detectar los casos más lentos." },
    ];
  }
  if (tab === "team") {
    const people = r.series.people;
    const threshold = Math.max(3, (value("avg_load") ?? 0) * 1.5);
    const heavy = people.filter(p => Number(p.carga) >= threshold);
    return [
      { title: `${heavy.length} personas con sobrecarga`, detail: "Carga actual de al menos 3 tickets y 1.5 veces el promedio. El conteo no mide dificultad ni disponibilidad." },
      { title: `${people.filter(p => Number(p.carga) === 0).length} personas sin tickets abiertos`, detail: "Consulta la tabla para valorar una redistribución según área y nivel. No implica que estén disponibles." },
    ];
  }
  if (tab === "clients") {
    const total = r.series.ratings.reduce((n, x) => n + Number(x.respuestas), 0);
    const low = r.series.ratings.filter(x => Number(x.calificacion) <= 2).reduce((n, x) => n + Number(x.respuestas), 0);
    return [
      { title: `${total} respuestas sustentan el CSAT`, detail: "Solo se encuestan cierres resueltos con correo de cliente. La satisfacción no representa todos los tickets." },
      { title: `${low} calificaciones de 1 o 2`, detail: "Revisa los comentarios para entender la experiencia. Una calificación por sí sola no explica la causa." },
    ];
  }
  if (tab === "flow") {
    const pending = r.series.proposals.reduce((n, p) => n + Number(p.pendientes), 0);
    return [
      { title: `${pending} propuestas del periodo siguen pendientes`, detail: "Consulta las decisiones por tipo. Este conteo corresponde a propuestas del periodo, no a toda la Bandeja actual." },
      { title: `${value("cross_area") ?? 0} transferencias entre áreas`, detail: "Revisa las rutas más frecuentes; una transferencia puede ser colaboración necesaria, no necesariamente un error de asignación." },
    ];
  }
  if (tab === "demand") {
    const top = r.series.by_area.reduce<(typeof r.series.by_area)[number] | null>((a, b) => !a || Number(b.tickets) > Number(a.tickets) ? b : a, null);
    return [
      { title: top ? `${top.area}: ${top.tickets} tickets` : "Sin demanda en este periodo", detail: "Área con más tickets en el reporte. Contrasta con la carga del equipo antes de ajustar la cobertura." },
      { title: value("peak_hour") == null ? "Sin hora pico disponible" : `Mayor entrada a las ${value("peak_hour")}:00`, detail: "Hora local de la organización. El mapa de calor muestra en qué días se concentra esa demanda." },
    ];
  }
  return [];
}
