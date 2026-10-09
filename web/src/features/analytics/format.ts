export const num = (v: number | null) => (v == null ? "—" : new Intl.NumberFormat("es-MX").format(v));
export const pct = (v: number | null) => (v == null ? "—" : `${v.toFixed(1)} %`);
export const csat = (v: number | null) => (v == null ? "—" : `${v.toFixed(1)} / 5`);

/** Horas legibles: minutos, horas o días según la magnitud. */
export const hours = (v: number | null) => {
  if (v == null) return "—";
  if (v < 1) return `${Math.round(v * 60)} min`;
  if (v < 48) return `${v.toFixed(1)} h`;
  return `${(v / 24).toFixed(1)} d`;
};

const shortDate = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });
/** "2026-09-28" → "28 sept" sin desfase de zona horaria. */
export const day = (iso: string) => shortDate.format(new Date(`${iso}T12:00:00`));

export const STATUS: Record<string, string> = {
  asignado: "Asignado",
  pendiente: "Pendiente de aprobación",
  seguimiento: "En seguimiento",
};
export const PROPOSAL: Record<string, string> = {
  update: "Actualización",
  escalate: "Escalar",
  reassign: "Reasignar",
  close: "Cerrar",
};
export const PRIORITY: Record<string, string> = { alta: "Alta", media: "Media", baja: "Baja" };
export const OUTCOME: Record<string, string> = { resuelto: "Resuelto", no_resuelto: "No resuelto" };
