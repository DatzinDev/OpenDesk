import { http, json } from "@/shared/api/http";

export type Notification = { id: number; ticket_id: number | null; title: string; body: string; read_at: string | null; created_at: string };
export type Inbox = { unread: number; items: Notification[] };

export const notificationsApi = {
  inbox: () => http<Inbox>("/notifications"),
  read: (ids?: number[]) => http<void>("/notifications/read", { method: "POST", body: json({ ids: ids ?? null }) }),
};
