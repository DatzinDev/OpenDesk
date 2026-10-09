export type Area = {
  id: number;
  name: string;
  description: string;
  sla_hours: number;
  always_open: boolean;
  days: number[]; // 0 = lunes
  start_time: string; // HH:MM[:SS]
  end_time: string;
  pause_on_holidays: boolean;
  is_active: boolean;
};

export type AreaInput = Omit<Area, "id">;

export type Holiday = { day: string; name: string };

export const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const hhmm = (t: string) => t.slice(0, 5);

export function describeSchedule(a: Pick<Area, "always_open" | "days" | "start_time" | "end_time">): string {
  if (a.always_open) return "24/7";
  const key = a.days.join("");
  const days =
    key === "01234" ? "Lunes a viernes" : key === "012345" ? "Lunes a sábado" : key === "0123456" ? "Todos los días" : a.days.map((d) => DAY_LABELS[d]).join(", ");
  return `${days}, ${hhmm(a.start_time)} a ${hhmm(a.end_time)}`;
}
