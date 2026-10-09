import { http, json } from "@/shared/api/http";

export type Functional = { org_name: string; reminder_hours: number; sla_warning_pct: number; survey_question: string };
export type Technical = { allowed_domain: string; timezone: string };
export type Settings = { functional: Functional; technical: Technical };

export const settingsApi = {
  read: () => http<Settings>("/settings"),
  save: (data: Partial<Settings>) => http<Settings>("/settings", { method: "PUT", body: json(data) }),
  testEmail: () => http<{ sent_to: string; error: string | null }>("/settings/test-email", { method: "POST" }),
};
