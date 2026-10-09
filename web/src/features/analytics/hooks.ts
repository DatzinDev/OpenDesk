import { useQuery } from "@tanstack/react-query";
import { analyticsApi, type Filters, type Tab } from "./api";

/** Datos casi en tiempo real: se actualizan solos cada 60 s (RF-07.1). */
export const useReport = (tab: Tab, f: Filters) =>
  useQuery({
    queryKey: ["analytics", tab, f],
    queryFn: () => analyticsApi.report(tab, f),
    refetchInterval: 60_000,
    // Al cambiar un filtro se conserva la vista mientras carga; al cambiar de pestaña no, porque cada
    // pestaña tiene series distintas.
    placeholderData: (prev, prevQuery) => (prevQuery?.queryKey[1] === tab ? prev : undefined),
  });
