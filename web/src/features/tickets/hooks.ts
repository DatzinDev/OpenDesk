import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ticketsApi } from "./api";
import type { TicketFilters } from "./types";

export const useTickets = (f: TicketFilters = {}) => useQuery({ queryKey: ["tickets", f], queryFn: () => ticketsApi.list(f) });
export const useTicket = (id: string) => useQuery({ queryKey: ["ticket", id], queryFn: () => ticketsApi.get(id) });
export const usePeers = (enabled: boolean) => useQuery({ queryKey: ["peers"], queryFn: ticketsApi.peers, enabled });
export const usePeople = (areaId: string | null) =>
  useQuery({ queryKey: ["people", areaId], queryFn: () => ticketsApi.people(areaId!), enabled: !!areaId });

export const useStatuses = () => useQuery({ queryKey: ["ticket-statuses"], queryFn: ticketsApi.statuses });

export function useSaveStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ticketsApi.saveStatus, onSuccess: () => qc.invalidateQueries({ queryKey: ["ticket-statuses"] }) });
}

/** Toda acción sobre un ticket refresca la lista y el detalle. */
export function useTicketAction<A, R = unknown>(fn: (args: A) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.invalidateQueries({ queryKey: ["ticket"] });
    },
  });
}
