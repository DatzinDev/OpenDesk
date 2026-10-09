import { BarChart, DonutChart, LineChart } from "@mantine/charts";
import { Group, Rating, SimpleGrid, Stack, Table, Text } from "@mantine/core";
import type { Report } from "../../api";
import { csat, day, num, OUTCOME, pct } from "../../format";
import { ChartCard } from "../ChartCard";
import { KpiCard } from "../KpiCard";

const when = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });

export function ClientsTab({ r }: { r: Report }) {
  const k = r.kpis;
  const outcomes = r.series.outcomes.map((o, i) => ({ name: OUTCOME[String(o.resultado)], value: Number(o.tickets), color: i ? "gray.5" : "teal.6" }));
  return (
    <>
      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="lg">
        <KpiCard label="Satisfacción (CSAT)" kpi={k.csat} format={csat} better="up" />
        <KpiCard label="Tasa de respuesta" kpi={k.response_rate} format={pct} hint="Encuestas respondidas sobre enviadas en el periodo." />
        <KpiCard label="Cerrados como resueltos" kpi={k.resolved} format={pct} better="up" />
        <KpiCard label="Clientes recurrentes" kpi={k.recurrent} format={num} hint="Clientes con más de un ticket en el periodo." />
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, lg: 2 }} mb="lg">
        <ChartCard title="Calificaciones" question="¿Cómo se reparten las respuestas de 1 a 5?" empty={!r.series.ratings.some((x) => Number(x.respuestas))}>
          <BarChart h={220} data={r.series.ratings} dataKey="calificacion" series={[{ name: "respuestas", label: "Respuestas", color: "orange.6" }]} />
        </ChartCard>
        <ChartCard title="Satisfacción por semana" question="¿La percepción del cliente mejora?" empty={!r.series.weekly_csat.length}>
          <LineChart h={220} data={r.series.weekly_csat.map((w) => ({ ...w, semana: day(String(w.semana)) }))} dataKey="semana"
            yAxisProps={{ domain: [1, 5] }} curveType="monotone" series={[{ name: "csat", label: "CSAT", color: "navy.6" }]} />
        </ChartCard>
        <ChartCard title="Resultado de los cierres" question="¿Cuántos tickets resolvemos de verdad?" empty={!outcomes.some((o) => o.value)}>
          <Group justify="center">
            <DonutChart data={outcomes} withLabelsLine withLabels size={170} thickness={26} />
          </Group>
        </ChartCard>
        <ChartCard title="Clientes con más tickets" question="¿Quién nos busca más?" empty={!r.series.top_clients.length}>
          <Table verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr><Table.Th>Cliente</Table.Th><Table.Th ta="right">Tickets</Table.Th><Table.Th ta="right">Abiertos</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {r.series.top_clients.map((c) => (
                <Table.Tr key={String(c.cliente)}>
                  <Table.Td><Text size="sm">{c.cliente}</Text></Table.Td>
                  <Table.Td ta="right">{num(c.tickets as number)}</Table.Td>
                  <Table.Td ta="right">{num(c.abiertos as number)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ChartCard>
      </SimpleGrid>
      <ChartCard title="Comentarios recientes" question="Lo que dicen los clientes, en sus palabras." empty={!r.series.comments.length}>
        <Stack gap="sm">
          {r.series.comments.map((c) => (
            <div key={`${c.folio}-${c.fecha}`}>
              <Group gap="xs">
                <Rating value={Number(c.calificacion)} readOnly size="xs" color="orange" />
                <Text size="xs" c="dimmed">{c.folio} · {when.format(new Date(String(c.fecha)))}</Text>
              </Group>
              <Text size="sm">{c.comentario}</Text>
            </div>
          ))}
        </Stack>
      </ChartCard>
    </>
  );
}
