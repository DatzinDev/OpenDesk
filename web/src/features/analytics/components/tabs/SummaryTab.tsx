import { AreaChart, BarChart, LineChart } from "@mantine/charts";
import { SimpleGrid } from "@mantine/core";
import type { Report } from "../../api";
import { csat, day, num, pct, STATUS } from "../../format";
import { ChartCard } from "../ChartCard";
import { KpiCard } from "../KpiCard";

export function SummaryTab({ r }: { r: Report }) {
  const k = r.kpis;
  const daily = r.series.daily.map((d) => ({ ...d, dia: day(String(d.dia)) }));
  return (
    <>
      <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }} mb="lg">
        <KpiCard label="Tickets abiertos" kpi={k.open} format={num} hint="Tickets que no están cerrados en este momento." />
        <KpiCard label="Por decidir" kpi={k.pending} format={num} hint="Propuestas que esperan la decisión del Gestor." />
        <KpiCard label="SLA vencido" kpi={k.overdue_sla} format={num} hint="Abiertos sin propuesta aceptada cuyo SLA ya venció." />
        <KpiCard label="Compromiso vencido" kpi={k.overdue_commitment} format={num} hint="Abiertos con fecha compromiso pasada." />
        <KpiCard label="Requieren intervención" kpi={k.needs_manager} format={num} hint="No hay un nivel superior con personas para escalarlos." />
        <KpiCard label="Creados" kpi={k.created} format={num} />
        <KpiCard label="Cerrados" kpi={k.closed} format={num} better="up" />
        <KpiCard label="SLA cumplido" kpi={k.sla} format={pct} better="up" hint="Primeras respuestas aceptadas antes del vencimiento, sobre el total de respuestas y auto-escalamientos." />
        <KpiCard label="Satisfacción (CSAT)" kpi={k.csat} format={csat} better="up" hint="Promedio de las encuestas respondidas en el periodo." />
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <ChartCard title="Creados vs cerrados por día" question="¿Estamos resolviendo al ritmo en que llegan?" empty={!daily.length}>
          <LineChart h={260} data={daily} dataKey="dia" curveType="monotone" withDots={false} withLegend
            series={[{ name: "creados", label: "Creados", color: "navy.6" }, { name: "cerrados", label: "Cerrados", color: "teal.6" }]} />
        </ChartCard>
        <ChartCard title="Evolución del backlog" question="¿La cola de tickets abiertos crece o se reduce?" empty={!daily.length}>
          <AreaChart h={260} data={daily} dataKey="dia" curveType="monotone" withDots={false}
            series={[{ name: "abiertos", label: "Abiertos al cierre del día", color: "orange.6" }]} />
        </ChartCard>
        <ChartCard title="Abiertos por estado" question="¿Dónde está detenido el trabajo ahora?">
          <BarChart h={220} data={r.series.by_status.map((s) => ({ ...s, estado: STATUS[String(s.estado)] }))} dataKey="estado"
            orientation="vertical" yAxisProps={{ width: 170 }} series={[{ name: "tickets", label: "Tickets", color: "navy.6" }]} />
        </ChartCard>
      </SimpleGrid>
    </>
  );
}
