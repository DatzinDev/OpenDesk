import { BarChart, LineChart } from "@mantine/charts";
import { SimpleGrid } from "@mantine/core";
import type { Report } from "../../api";
import { day, hours, num, pct } from "../../format";
import { ChartCard } from "../ChartCard";
import { KpiCard } from "../KpiCard";

export function TimesTab({ r }: { r: Report }) {
  const k = r.kpis;
  return (
    <>
      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="lg">
        <KpiCard label="SLA cumplido" kpi={k.sla} format={pct} better="up" />
        <KpiCard label="Primera respuesta (mediana)" kpi={k.first_response_median} format={hours} better="down"
          hint="Desde la asignación hasta que el Gestor acepta la primera propuesta, en horas hábiles del área." />
        <KpiCard label="Primera respuesta (p90)" kpi={k.first_response_p90} format={hours} better="down"
          hint="El 90 % de las primeras respuestas tardó esto o menos." />
        <KpiCard label="Auto-escalamientos" kpi={k.auto_escalations} format={num} better="down" />
        <KpiCard label="Resolución (mediana)" kpi={k.resolution_median} format={hours} better="down" hint="Desde la creación hasta el cierre, en horas hábiles del área." />
        <KpiCard label="Resolución (p90)" kpi={k.resolution_p90} format={hours} better="down" />
        <KpiCard label="Compromisos cumplidos" kpi={k.commitment} format={pct} better="up"
          hint="Tickets con fecha compromiso que se cerraron a tiempo." />
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <ChartCard title="SLA cumplido por semana" question="¿Mejora o empeora el tiempo de respuesta?" empty={!r.series.weekly_sla.length}>
          <LineChart h={240} data={r.series.weekly_sla.map((w) => ({ ...w, semana: day(String(w.semana)) }))} dataKey="semana"
            curveType="monotone" yAxisProps={{ domain: [0, 100] }} valueFormatter={(v) => `${v} %`}
            series={[{ name: "sla", label: "SLA cumplido", color: "teal.6" }]} />
        </ChartCard>
        <ChartCard title="SLA cumplido por área" question="¿Qué equipo necesita apoyo?" empty={!r.series.sla_by_area.length}>
          <BarChart h={240} data={r.series.sla_by_area} dataKey="area" valueFormatter={(v) => `${v} %`} yAxisProps={{ domain: [0, 100] }}
            series={[{ name: "sla", label: "SLA cumplido", color: "navy.6" }]} />
        </ChartCard>
        <ChartCard title="Tiempo de resolución" question="¿Cuánto tardamos en cerrar la mayoría de los tickets? (horas hábiles)">
          <BarChart h={240} data={r.series.resolution} dataKey="rango" series={[{ name: "tickets", label: "Tickets cerrados", color: "navy.6" }]} />
        </ChartCard>
        <ChartCard title="Antigüedad de los abiertos" question="¿Hay tickets olvidados?">
          <BarChart h={240} data={r.series.aging} dataKey="rango" series={[{ name: "tickets", label: "Tickets abiertos", color: "orange.6" }]} />
        </ChartCard>
      </SimpleGrid>
    </>
  );
}
