import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { areasApi } from "./api";
import type { AreaInput, Holiday } from "./types";

export const useAreas = () => useQuery({ queryKey: ["areas"], queryFn: areasApi.list });
export const useHolidays = () => useQuery({ queryKey: ["holidays"], queryFn: areasApi.holidays });

export function useSaveArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: AreaInput }) => (id ? areasApi.update(id, data) : areasApi.create(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["areas"] }),
  });
}

export function useHolidayMutations() {
  const qc = useQueryClient();
  const onSuccess = () => qc.invalidateQueries({ queryKey: ["holidays"] });
  return {
    add: useMutation({ mutationFn: (h: Holiday) => areasApi.addHoliday(h), onSuccess }),
    remove: useMutation({ mutationFn: (day: string) => areasApi.removeHoliday(day), onSuccess }),
  };
}
