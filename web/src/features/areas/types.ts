export type Area = {
  id: number;
  name: string;
  description: string;
  sla_hours: number;
  levels: number; // niveles de escalamiento
  always_open: boolean;
  week: DayHours[]; // 7 entradas, 0 = lunes
  pause_on_holidays: boolean;
  is_active: boolean;
};

export type DayHours = [string, string] | null; // ["09:00", "18:00"] o null si no se atiende

export type AreaInput = Omit<Area, "id">;

export type Holiday = { day: string; name: string };

export const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const hhmm = (t: string) => t.slice(0, 5);

/** Agrupa días consecutivos con el mismo horario: "Lun a Vie 09:00 a 18:00; Sáb 09:00 a 14:00". */
export function describeSchedule(a: Pick<Area, "always_open" | "week">): string {
  if (a.always_open) return "24/7";
  const parts: string[] = [];
  let i = 0;
  while (i < 7) {
    const w = a.week[i];
    let j = i;
    while (j + 1 < 7 && JSON.stringify(a.week[j + 1]) === JSON.stringify(w)) j++;
    if (w) parts.push(`${DAY_LABELS[i]}${j > i ? ` a ${DAY_LABELS[j]}` : ""} ${hhmm(w[0])} a ${hhmm(w[1])}`);
    i = j + 1;
  }
  return parts.join("; ");
}
