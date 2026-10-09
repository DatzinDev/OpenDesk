export type Priority = "alta" | "media" | "baja";
export type Status = "asignado" | "pendiente" | "seguimiento" | "cerrado";
export type Outcome = "resuelto" | "no_resuelto";
export type ProposalKind = "update" | "escalate" | "close" | "reassign";

export type Attachment = { id: number; event_id: number; filename: string; content_type: string; size: number };

export type TicketEvent = {
  id: number;
  kind: ProposalKind | "created" | "assigned" | "comment" | "closed" | "reopened" | "needs_manager";
  actor_id: number | null;
  actor_name: string | null;
  comment: string;
  data: { due_at?: string; user_id?: number; area_id?: number; outcome?: Outcome; from?: number; to?: number; reason?: string };
  state: "pending" | "accepted" | "rejected" | "cancelled" | null;
  decided_by: number | null;
  decided_by_name: string | null;
  decision_comment: string;
  created_at: string;
  attachments: Attachment[];
};

export type Ticket = {
  id: number;
  folio: string;
  title: string;
  description: string;
  area_id: number;
  assignee_id: number;
  assignee_name: string | null;
  priority: Priority;
  client_name: string | null;
  client_email: string | null;
  status: Status;
  outcome: Outcome | null;
  due_from: string;
  due_at: string;
  committed: boolean;
  needs_manager: boolean;
  created_by: number;
  created_at: string;
  closed_at: string | null;
  pending: TicketEvent | null;
};

export type TicketDetail = Ticket & { events: TicketEvent[]; names: Record<string, string> };

export type TicketInput = {
  title: string;
  description: string;
  area_id: number;
  assignee_id: number;
  priority: Priority;
  client_name: string | null;
  client_email: string | null;
};

export type ProposalInput = { kind: ProposalKind; comment: string; due_at?: string; user_id?: number; area_id?: number };
export type DecisionInput = { comment: string; outcome?: Outcome; user_id?: number };
export type Person = { id: number; name: string; level: number | null };
export type TicketFilters = { status?: string; area_id?: string; assignee_id?: string; q?: string };

export const STATUS_LABELS: Record<Status, string> = {
  asignado: "Asignado",
  pendiente: "Pendiente de aprobación",
  seguimiento: "En seguimiento",
  cerrado: "Cerrado",
};

export const PRIORITY_LABELS: Record<Priority, string> = { alta: "Alta", media: "Media", baja: "Baja" };
export const OUTCOME_LABELS: Record<Outcome, string> = { resuelto: "Resuelto", no_resuelto: "No resuelto" };

export const PROPOSAL_LABELS: Record<ProposalKind, string> = {
  update: "Agregar actualización",
  escalate: "Escalar",
  close: "Cerrar",
  reassign: "Reasignar",
};

export const MAX_FILES = 5;
export const MAX_SIZE = 10 * 1024 * 1024;
export const ACCEPT = "image/png,image/jpeg,image/gif,image/webp,application/pdf";

/** Semáforo del plazo vigente (RF-02.15): verde > 50 %, amarillo ≤ 50 %, rojo ≤ 10 % o vencido. */
export function slaState(t: Pick<Ticket, "due_from" | "due_at" | "status">, at = Date.now()) {
  const from = Date.parse(t.due_from);
  const due = Date.parse(t.due_at);
  // ponytail: porcentaje en tiempo de reloj, no en horas hábiles; basta para el color.
  const left = (due - at) / Math.max(due - from, 1);
  const color = t.status === "cerrado" ? "gray" : left <= 0.1 ? "red" : left <= 0.5 ? "yellow" : "teal";
  return { color, overdue: t.status !== "cerrado" && due < at };
}
