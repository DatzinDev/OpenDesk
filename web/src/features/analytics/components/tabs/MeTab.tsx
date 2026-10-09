import { BarChart } from "@mantine/charts";
import { SimpleGrid } from "@mantine/core";
import type { Report } from "../../api";
import { csat, day, hours, num, pct } from "../../format";
import { ChartCard } from "../ChartCard";
import { KpiCard } from "../KpiCard";

export function MeTab({ r }: { r: Report }) {
  const k = r.kpis;
  return (
    <>
      <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }} mb="lg">
        <KpiCard label="Mis tickets abiertos" kpi={k.open} format={num} />
        <KpiCard label="SLA cumplido" kpi={k.sla} format={pct} better="up" />
        <KpiCard label="Primera respuesta (mediana)" kpi={k.first_response_median} format={hours} better="down" hint="En horas hábiles de tu área." />
        <KpiCard label="Resolución (mediana)" kpi={k.resolution_median} format={hours} better="down" hint="En horas hábiles de tu área." />
        <KpiCard label="Satisfacción (CSAT)" kpi={k.csat} format={csat} better="up" />
      </SimpleGrid>
      <ChartCard title="Mis tickets cerrados por semana" empty={!r.series.weekly_closed.length}>
        <BarChart h={240} data={r.series.weekly_closed.map((w) => ({ ...w, semana: day(String(w.semana)) }))} dataKey="semana"
          series={[{ name: "cerrados", label: "Cerrados", color: "teal.6" }]} />
      </ChartCard>
    </>
  );
}
