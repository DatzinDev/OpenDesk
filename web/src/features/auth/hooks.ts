import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "./api";

export const useMe = () => useQuery({ queryKey: ["me"], queryFn: authApi.me, staleTime: 60_000 });

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      qc.clear();
      window.location.assign("/login");
    },
  });
}
