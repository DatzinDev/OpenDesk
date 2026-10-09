import { http, json } from "@/shared/api/http";

export type Notification = { id: string; ticket_id: string | null; title: string; body: string; read_at: string | null; created_at: string };
export type Inbox = { unread: number; items: Notification[] };

export const notificationsApi = {
  inbox: () => http<Inbox>("/notifications"),
  read: (ids?: string[]) => http<void>("/notifications/read", { method: "POST", body: json({ ids: ids ?? null }) }),
};
