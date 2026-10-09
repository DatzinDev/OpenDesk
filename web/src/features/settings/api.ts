import { http, json } from "@/shared/api/http";

export type Functional = { org_name: string; reminder_hours: number; sla_warning_pct: number; survey_question: string };
export type Technical = { allowed_domain: string; timezone: string };
export type Settings = { functional: Functional; technical: Technical };

export type Palette = { preset: "opendesk" | "blue" | "green" | "violet" | "custom"; primary: string; accent: string; secondary: string };
export type Branding = { org_name: string; logo_url: string | null; icon_url: string | null; palette: Palette };
export type BrandingInput = Palette & { logo_id: string | null; icon_id: string | null };
export type CustomValue = string | number | boolean | null;
export type CustomValues = Record<string, CustomValue>;
export type FieldOption = { id: string; label: string; active: boolean };
export type CustomField = { id: string; label: string; type: "text" | "number" | "date" | "select" | "boolean"; help: string; required: boolean; active: boolean; options: FieldOption[] };
export type SystemField = { id: "title" | "description" | "area_id" | "assignee_id" | "priority" | "client_name" | "client_email" | "files"; label: string; help: string; required: boolean; options: FieldOption[] };
export type FormDefinition = { revision: number; fields: CustomField[]; system: SystemField[]; order: string[] };
export type StarQuestion = { id: string; label: string; help: string; required: boolean; active: boolean };
export type SurveyDefinition = { revision: number; questions: StarQuestion[] };
export const CSAT_ID = "00000000-0000-0000-0000-000000000001";

export const settingsApi = {
  read: () => http<Settings>("/settings"),
  save: (data: Partial<Settings>) => http<Settings>("/settings", { method: "PUT", body: json(data) }),
  testEmail: () => http<{ sent_to: string; error: string | null }>("/settings/test-email", { method: "POST" }),
  branding: () => http<Branding>("/settings/branding"),
  saveBranding: (data: BrandingInput) => http<Branding>("/settings/branding", { method: "PUT", body: json(data) }),
  uploadAsset: (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return http<{ id: string; url: string }>("/settings/branding/assets", { method: "POST", body });
  },
  surveyForm: () => http<SurveyDefinition>("/settings/survey-form"),
  saveSurveyForm: (data: SurveyDefinition) => http<SurveyDefinition>("/settings/survey-form", { method: "PUT", body: json(data) }),
  form: () => http<FormDefinition>("/settings/ticket-form"),
  saveForm: (data: FormDefinition) => http<FormDefinition>("/settings/ticket-form", { method: "PUT", body: json(data) }),
};
