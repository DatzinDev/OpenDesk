import { Alert, Button, Center, Group, Loader, SegmentedControl, Select, Tabs, TextInput } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { useSearchParams } from "react-router-dom";
import { useAreas } from "@/features/areas";
import { useMe } from "@/features/auth";
import { PageHeader } from "@/shared/ui";
import { analyticsApi, type Filters, type Report, type Tab } from "../api";
import { ClientsTab } from "../components/tabs/ClientsTab";
import { DemandTab } from "../components/tabs/DemandTab";
import { FlowTab } from "../components/tabs/FlowTab";
import { MeTab } from "../components/tabs/MeTab";
import { SummaryTab } from "../components/tabs/SummaryTab";
import { TeamTab } from "../components/tabs/TeamTab";
import { TimesTab } from "../components/tabs/TimesTab";
import { useReport } from "../hooks";

const TABS: { value: Tab; label: string; view: (r: Report) => JSX.Element }[] = [
  { value: "summary", label: "Resumen", view: (r) => <SummaryTab r={r} /> },
  { value: "times", label: "Tiempos y SLA", view: (r) => <TimesTab r={r} /> },
  { value: "team", label: "Equipo", view: (r) => <TeamTab r={r} /> },
  { value: "flow", label: "Flujo", view: (r) => <FlowTab r={r} /> },
  { value: "clients", label: "Clientes", view: (r) => <ClientsTab r={r} /> },
  { value: "demand", label: "Demanda", view: (r) => <DemandTab r={r} /> },
];
const ME = { value: "me" as Tab, label: "Mi desempeño", view: (r: Report) => <MeTab r={r} /> };

const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
const daysAgo = (n: number) => iso(new Date(Date.now() - n * 86_400_000));

export function AnalyticsPage() {
  const { data: me } = useMe();
  const { data: areas = [] } = useAreas();
  const [params, setParams] = useSearchParams();
  const staff = me?.role === "admin" || me?.role === "gestor";
  const tabs = staff ? TABS : [ME];
  const tab = (tabs.find((t) => t.value === params.get("tab")) ?? tabs[0]).value;
  const range = params.get("rango") ?? "30";
  const filters: Filters = {
    start: range === "custom" ? (params.get("desde") ?? daysAgo(29)) : daysAgo(Number(range) - 1),
    end: range === "custom" ? (params.get("hasta") ?? iso(new Date())) : iso(new Date()),
    area_id: staff ? (params.get("area") ?? undefined) : undefined,
    priority: staff ? (params.get("prioridad") ?? undefined) : undefined,
  };
  const set = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };
  const { data, isError, error } = useReport(tab, filters);
  const current = tabs.find((t) => t.value === tab)!;

  return (
    <>
      <PageHeader
        title="Analítica"
        description={staff ? "Indicadores de atención, actualizados cada minuto." : "Tus indicadores de atención, actualizados cada minuto."}
        action={
          staff && tab === "summary" && (
            <Button component="a" href={analyticsApi.exportUrl(filters)} variant="default" leftSection={<IconDownload size={16} />}>
              Exportar CSV
            </Button>
          )
        }
      />
      <Group gap="sm" mb="lg" wrap="wrap" align="flex-end">
        <SegmentedControl
          value={range}
          onChange={(v) => set({ rango: v, desde: null, hasta: null })}
          data={[
            { value: "7", label: "7 días" },
            { value: "30", label: "30 días" },
            { value: "90", label: "90 días" },
            { value: "custom", label: "Rango" },
          ]}
        />
        {range === "custom" && (
          <>
            <TextInput type="date" aria-label="Desde" value={filters.start} max={filters.end} onChange={(e) => set({ desde: e.currentTarget.value })} />
            <TextInput type="date" aria-label="Hasta" value={filters.end} min={filters.start} onChange={(e) => set({ hasta: e.currentTarget.value })} />
          </>
        )}
        {staff && (
          <>
            <Select aria-label="Área" placeholder="Todas las áreas" clearable w={{ base: "100%", sm: 200 }}
              data={areas.map((a) => ({ value: a.id, label: a.name }))} value={filters.area_id ?? null} onChange={(v) => set({ area: v })} />
            <Select aria-label="Prioridad" placeholder="Todas las prioridades" clearable w={{ base: "100%", sm: 190 }}
              data={[{ value: "alta", label: "Alta" }, { value: "media", label: "Media" }, { value: "baja", label: "Baja" }]}
              value={filters.priority ?? null} onChange={(v) => set({ prioridad: v })} />
          </>
        )}
      </Group>
      <Tabs value={tab} onChange={(v) => set({ tab: v })} keepMounted={false}>
        {tabs.length > 1 && (
          <Tabs.List mb="lg">
            {tabs.map((t) => (
              <Tabs.Tab key={t.value} value={t.value}>
                {t.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        )}
        <Tabs.Panel value={tab}>
          {isError ? (
            <Alert color="red" variant="light">{error.message}</Alert>
          ) : data ? (
            current.view(data)
          ) : (
            <Center py="xl"><Loader color="navy" /></Center>
          )}
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
