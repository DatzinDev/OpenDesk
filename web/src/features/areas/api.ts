import { http, json } from "@/shared/api/http";
import type { Area, AreaInput, Holiday } from "./types";

export const areasApi = {
  list: () => http<Area[]>("/areas"),
  create: (data: AreaInput) => http<Area>("/areas", { method: "POST", body: json(data) }),
  update: (id: number, data: AreaInput) => http<Area>(`/areas/${id}`, { method: "PUT", body: json(data) }),
  holidays: () => http<Holiday[]>("/holidays"),
  addHoliday: (data: Holiday) => http<Holiday>("/holidays", { method: "POST", body: json(data) }),
  removeHoliday: (day: string) => http<void>(`/holidays/${day}`, { method: "DELETE" }),
};
