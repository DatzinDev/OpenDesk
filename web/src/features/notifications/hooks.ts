import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { notificationsApi } from "./api";

// La consulta periódica es solo respaldo; los avisos llegan al instante por SSE (useLiveNotifications).
export const useInbox = () => useQuery({ queryKey: ["notifications"], queryFn: notificationsApi.inbox, refetchInterval: 120_000 });

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: notificationsApi.read, onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) });
}

/** Una sola conexión SSE por pestaña: al llegar un aviso refresca la campana y las listas de tickets. */
export function useLiveNotifications() {
  const qc = useQueryClient();
  useEffect(() => {
    const es = new EventSource("/api/notifications/stream");
    es.addEventListener("refresh", () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.invalidateQueries({ queryKey: ["ticket"] });
    });
    return () => es.close();
  }, [qc]);
}
