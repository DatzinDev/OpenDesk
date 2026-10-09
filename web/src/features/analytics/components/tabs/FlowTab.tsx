import { BarChart } from "@mantine/charts";
import { SimpleGrid, Table, Text } from "@mantine/core";
import type { Report } from "../../api";
import { day, num, pct, PROPOSAL } from "../../format";
import { ChartCard } from "../ChartCard";
import { KpiCard } from "../KpiCard";

export function FlowTab({ r }: { r: Report }) {
  const k = r.kpis;
  return (
    <>
      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="lg">
        <KpiCard label="Propuestas" kpi={k.proposals} format={num} />
        <KpiCard label="Propuestas rechazadas" kpi={k.rejection} format={pct} hint="Rechazadas sobre decididas. Un valor alto indica retrabajo." />
        <KpiCard label="Tickets reabiertos" kpi={k.reopen} format={pct} hint="Reabiertos sobre cerrados en el periodo: mide la calidad del cierre." />
        <KpiCard label="Envíos entre áreas" kpi={k.cross_area} format={num} hint="Reasignaciones a otra área: tickets que llegaron al equipo equivocado." />
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <ChartCard title="Decisiones por tipo de propuesta" question="¿Qué propuestas se rechazan más?">
          <BarChart h={240} type="stacked" data={r.series.proposals.map((p) => ({ ...p, tipo: PROPOSAL[String(p.tipo)] }))} dataKey="tipo" withLegend
            series={[
              { name: "aceptadas", label: "Aceptadas", color: "teal.6" },
              { name: "rechazadas", label: "Rechazadas", color: "red.6" },
              { name: "pendientes", label: "Pendientes", color: "orange.5" },
              { name: "canceladas", label: "Canceladas", color: "gray.5" },
            ]} />
        </ChartCard>
        <ChartCard title="Escalamientos por semana" question="¿Escalamos por decisión o porque se venció el SLA?" empty={!r.series.escalations.length}>
          <BarChart h={240} type="stacked" withLegend data={r.series.escalations.map((w) => ({ ...w, semana: day(String(w.semana)) }))} dataKey="semana"
            series={[{ name: "manuales", label: "Manuales", color: "navy.6" }, { name: "automaticos", label: "Por SLA vencido", color: "orange.6" }]} />
        </ChartCard>
        <ChartCard title="Abiertos por estatus de seguimiento" question="¿En qué punto se quedan detenidos?" empty={!r.series.tracking.length}>
          <BarChart h={240} orientation="vertical" yAxisProps={{ width: 150 }} data={r.series.tracking} dataKey="estatus"
            series={[{ name: "tickets", label: "Tickets abiertos", color: "navy.6" }]} />
        </ChartCard>
        <ChartCard title="Envíos entre áreas" question="¿Qué tickets llegan al área equivocada?" empty={!r.series.cross_area.length}>
          <Table verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr><Table.Th>De</Table.Th><Table.Th>A</Table.Th><Table.Th ta="right">Tickets</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {r.series.cross_area.map((x) => (
                <Table.Tr key={`${x.origen}-${x.destino}`}>
                  <Table.Td><Text size="sm">{x.origen}</Text></Table.Td>
                  <Table.Td><Text size="sm">{x.destino}</Text></Table.Td>
                  <Table.Td ta="right">{num(x.tickets as number)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ChartCard>
      </SimpleGrid>
    </>
  );
}
