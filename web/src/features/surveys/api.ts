import type { StarQuestion } from "@/features/settings";
import { http, json } from "@/shared/api/http";

export type SurveyStatus = {
  state: "pending" | "answered" | "expired";
  folio: string;
  title: string;
  question: string;
  rating: number | null;
  has_comment: boolean;
  questions: StarQuestion[];
  ratings: Record<string, number>;
};

export type TicketSurvey = { sent_at: string; expires_at: string; rating: number | null; comment: string; answered_at: string | null; questions: StarQuestion[]; ratings: Record<string, number> };

export const surveysApi = {
  status: (token: string) => http<SurveyStatus>(`/surveys/${token}`),
  rate: (token: string, ratings: Record<string, number>) => http<SurveyStatus>(`/surveys/${token}/rating`, { method: "POST", body: json({ ratings }) }),
  comment: (token: string, comment: string) =>
    http<SurveyStatus>(`/surveys/${token}/comment`, { method: "POST", body: json({ comment }) }),
  forTicket: (ticketId: string) => http<TicketSurvey | null>(`/tickets/${ticketId}/survey`),
};
