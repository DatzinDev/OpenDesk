import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "./api";

// ponytail: consulta cada 30 s; cambiar a SSE si se necesita inmediatez.
export const useInbox = () => useQuery({ queryKey: ["notifications"], queryFn: notificationsApi.inbox, refetchInterval: 30_000 });

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: notificationsApi.read, onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) });
}
