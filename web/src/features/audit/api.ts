import { http } from "@/shared/api/http";

export type Entry = {
  id: string;
  at: string;
  action: string;
  entity: string | null;
  ref: string | null;
  ticket_id: string | null;
  actor: string | null;
  data: Record<string, unknown>;
};
export type AuditFilters = { actor_id?: string; action?: string; start?: string; end?: string };

export const auditApi = {
  page: (f: AuditFilters, before?: string) => {
    const q = new URLSearchParams(Object.entries({ ...f, before }).filter(([, v]) => v) as [string, string][]);
    return http<{ items: Entry[]; more: boolean }>(`/audit?${q}`);
  },
};
