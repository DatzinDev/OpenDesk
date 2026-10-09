import { BarChart } from "@mantine/charts";
import { Badge, Paper, SimpleGrid, Table, Text } from "@mantine/core";
import type { Report } from "../../api";
import { csat, hours, num, pct } from "../../format";
import { ChartCard } from "../ChartCard";
import { KpiCard } from "../KpiCard";

export function TeamTab({ r }: { r: Report }) {
  const k = r.kpis;
  const people = r.series.people;
  const avg = k.avg_load.value ?? 0;
  return (
    <>
      <SimpleGrid cols={{ base: 2, sm: 3 }} mb="lg">
        <KpiCard label="Personas atendiendo" kpi={k.people} format={num} />
        <KpiCard label="Carga promedio" kpi={k.avg_load} format={num} hint="Tickets abiertos por persona." />
        <KpiCard label="Carga máxima" kpi={k.max_load} format={num} />
      </SimpleGrid>
      <Paper withBorder radius="lg" mb="lg">
        <Table.ScrollContainer minWidth={900}>
          <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                {["Persona", "Carga actual", "Cerrados", "SLA cumplido", "1.ª respuesta (háb.)", "Resolución (háb.)", "CSAT", "Rechazos", "Escalamientos"].map((h) => (
                  <Table.Th key={h}>{h}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody style={{ fontVariantNumeric: "tabular-nums" }}>
              {people.map((p) => (
                <Table.Tr key={String(p.persona)}>
                  <Table.Td>
                    <Text size="sm" fw={500}>{p.persona}</Text>
                    <Text size="xs" c="dimmed">{p.area} · Nivel {p.nivel}</Text>
                  </Table.Td>
                  <Table.Td>
                    {num(p.carga as number)}{" "}
                    {avg > 0 && (p.carga as number) >= Math.max(3, avg * 1.5) && (
                      <Badge size="xs" color="orange" variant="light">Sobrecarga</Badge>
                    )}
                  </Table.Td>
                  <Table.Td>{num(p.cerrados as number)}</Table.Td>
                  <Table.Td>{pct(p.sla as number | null)}</Table.Td>
                  <Table.Td>{hours(p.primera_respuesta as number | null)}</Table.Td>
                  <Table.Td>{hours(p.resolucion as number | null)}</Table.Td>
                  <Table.Td>{csat(p.csat as number | null)}</Table.Td>
                  <Table.Td>{pct(p.rechazos as number | null)}</Table.Td>
                  <Table.Td>{num(p.escalamientos as number)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <ChartCard title="Carga actual por persona" question="¿El trabajo está bien repartido?" empty={!people.length}>
          <BarChart h={Math.max(220, people.length * 28)} data={people.slice(0, 15)} dataKey="persona" orientation="vertical"
            yAxisProps={{ width: 130 }} series={[{ name: "carga", label: "Tickets abiertos", color: "navy.6" }]} />
        </ChartCard>
        <ChartCard title="Carga por nivel de escalamiento" question="¿Los niveles altos están absorbiendo demasiado?" empty={!r.series.load_by_level.length}>
          <BarChart h={220} data={r.series.load_by_level} dataKey="nivel" series={[{ name: "tickets", label: "Tickets abiertos", color: "teal.6" }]} />
        </ChartCard>
      </SimpleGrid>
    </>
  );
}
