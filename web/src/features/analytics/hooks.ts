import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { analyticsApi, type Filters, type Tab } from "./api";

/** Datos casi en tiempo real: se actualizan solos cada 60 s (RF-07.1). */
export const useReport = (tab: Tab, f: Filters) =>
  useQuery({
    queryKey: ["analytics", tab, f],
    queryFn: () => analyticsApi.report(tab, f),
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
  });
