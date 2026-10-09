import { http } from "@/shared/api/http";

export type Tab = "summary" | "times" | "team" | "flow" | "clients" | "demand" | "me";
export type Kpi = { value: number | null; prev: number | null };
export type Row = Record<string, string | number | null>;
export type Report = { kpis: Record<string, Kpi>; series: Record<string, Row[]> };
export type Filters = { start: string; end: string; area_id?: string; priority?: string };

const qs = (f: Filters) => new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();

export const analyticsApi = {
  report: (tab: Tab, f: Filters) => http<Report>(`/analytics/${tab}?${qs(f)}`),
  exportUrl: (f: Filters) => `/api/analytics/export.csv?${qs(f)}`,
};
