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
  TrackingStatus,
} from "./types";

const post = <T,>(path: string, body: unknown) => http<T>(path, { method: "POST", body: json(body) });
const qs = (f: TicketFilters) => new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();

export const ticketsApi = {
  list: (f: TicketFilters = {}) => http<Ticket[]>(`/tickets?${qs(f)}`),
  get: (id: number) => http<TicketDetail>(`/tickets/${id}`),
  peers: () => http<Person[]>("/tickets/peers"),
  people: (areaId: number) => http<Person[]>(`/tickets/people/${areaId}`),
  create: (data: TicketInput, files: File[]) => http<TicketDetail>("/tickets", { method: "POST", body: multipart(data, files) }),
  propose: (id: number, data: ProposalInput, files: File[]) =>
    http<TicketDetail>(`/tickets/${id}/proposals`, { method: "POST", body: multipart(data, files) }),
  accept: (id: number, eventId: number, data: DecisionInput) => post<TicketDetail>(`/tickets/${id}/proposals/${eventId}/accept`, data),
  reject: (id: number, eventId: number, data: DecisionInput) => post<TicketDetail>(`/tickets/${id}/proposals/${eventId}/reject`, data),
  reassign: (id: number, data: { user_id: number; comment: string }) => post<TicketDetail>(`/tickets/${id}/reassign`, data),
  close: (id: number, data: { outcome: Outcome; comment: string }) => post<TicketDetail>(`/tickets/${id}/close`, data),
  setStatus: (id: number, status_id: number | null) =>
    http<TicketDetail>(`/tickets/${id}/status`, { method: "PUT", body: json({ status_id }) }),
  statuses: () => http<TrackingStatus[]>("/ticket-statuses"),
  saveStatus: ({ id, ...data }: Omit<TrackingStatus, "id"> & { id?: number }) =>
    http<TrackingStatus>(id ? `/ticket-statuses/${id}` : "/ticket-statuses", { method: id ? "PUT" : "POST", body: json(data) }),
  reopen: (id: number, data: { comment: string; user_id?: number }) => post<TicketDetail>(`/tickets/${id}/reopen`, data),
};
