import { http, json, multipart } from "@/shared/api/http";
import type {
  DecisionInput,
  Outcome,
  Person,
  ProposalInput,
  Ticket,
  TicketDetail,
  TicketFilters,
  TicketInput,
  TicketUpdate,
  TrackingStatus,
} from "./types";

const post = <T,>(path: string, body: unknown) => http<T>(path, { method: "POST", body: json(body) });
const qs = (f: TicketFilters) => new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();

export const ticketsApi = {
  list: (f: TicketFilters = {}) => http<Ticket[]>(`/tickets?${qs(f)}`),
  get: (id: string) => http<TicketDetail>(`/tickets/${id}`),
  peers: () => http<Person[]>("/tickets/peers"),
  people: (areaId: string) => http<Person[]>(`/tickets/people/${areaId}`),
  create: (data: TicketInput, files: File[]) => http<TicketDetail>("/tickets", { method: "POST", body: multipart(data, files) }),
  propose: (id: string, data: ProposalInput, files: File[]) =>
    http<TicketDetail>(`/tickets/${id}/proposals`, { method: "POST", body: multipart(data, files) }),
  accept: (id: string, eventId: string, data: DecisionInput) => post<TicketDetail>(`/tickets/${id}/proposals/${eventId}/accept`, data),
  reject: (id: string, eventId: string, data: DecisionInput) => post<TicketDetail>(`/tickets/${id}/proposals/${eventId}/reject`, data),
  reassign: (id: string, data: { user_id: string; comment: string }) => post<TicketDetail>(`/tickets/${id}/reassign`, data),
  close: (id: string, data: { outcome: Outcome; comment: string }) => post<TicketDetail>(`/tickets/${id}/close`, data),
  update: (id: string, data: TicketUpdate) => http<TicketDetail>(`/tickets/${id}`, { method: "PATCH", body: json(data) }),
  setStatus: (id: string, status_id: string | null) =>
    http<TicketDetail>(`/tickets/${id}/status`, { method: "PUT", body: json({ status_id }) }),
  statuses: () => http<TrackingStatus[]>("/ticket-statuses"),
  saveStatus: ({ id, ...data }: Omit<TrackingStatus, "id"> & { id?: string }) =>
    http<TrackingStatus>(id ? `/ticket-statuses/${id}` : "/ticket-statuses", { method: id ? "PUT" : "POST", body: json(data) }),
  reopen: (id: string, data: { comment: string; user_id?: string }) => post<TicketDetail>(`/tickets/${id}/reopen`, data),
};
