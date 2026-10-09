import { useQuery } from "@tanstack/react-query";
import { settingsApi } from "./api";

export function useBranding() {
  return useQuery({ queryKey: ["branding"], queryFn: settingsApi.branding, staleTime: 60_000 });
}

export function useTicketForm(enabled = true) {
  return useQuery({ queryKey: ["ticket-form"], queryFn: settingsApi.form, enabled, staleTime: 0 });
}
