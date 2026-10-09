import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "./api";
import type { UserCreate, UserUpdate } from "./types";

const KEY = ["users"];

export const useUsers = () => useQuery({ queryKey: KEY, queryFn: usersApi.list });

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UserCreate) => usersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdate }) => usersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
