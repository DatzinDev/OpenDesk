import { AreaChart, BarChart, LineChart } from "@mantine/charts";
import { Anchor, Grid, Group, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { Link, useSearchParams } from "react-router-dom";
import type { Report } from "../../api";
import { csat, day, num, pct, STATUS } from "../../format";
import { ChartCard } from "../ChartCard";
import { KpiCard } from "../KpiCard";

export function SummaryTab({ r }: { r: Report }) {
  const [params] = useSearchParams();
  const tabLink = (tab: string) => {
    const next = new URLSearchParams(params);
    next.set("tab", tab);
    return `?${next}`;
  };
  const k = r.kpis;
  const daily = r.series.daily.map((d) => ({ ...d, dia: day(String(d.dia)) }));
  return (
    <>
      <Group justify="space-between" mb="xs">
        <Title order={2} fz="md">Atención ahora</Title>
        <Anchor component={Link} to="/bandeja" size="sm">Ir a la Bandeja</Anchor>
      </Group>
      <SimpleGrid cols={{ base: 2, sm: 3, xl: 5 }} spacing="xs" mb="lg">
        <KpiCard label="Tickets abiertos" kpi={k.open} format={num} hint="Tickets que no están cerrados en este momento." />
        <KpiCard label="Por decidir" kpi={k.pending} format={num} hint="Propuestas que esperan la decisión del Gestor." />
        <KpiCard label="SLA vencido" kpi={k.overdue_sla} format={num} hint="Abiertos sin propuesta aceptada cuyo SLA ya venció." />
        <KpiCard label="Compromiso vencido" kpi={k.overdue_commitment} format={num} hint="Abiertos con fecha compromiso pasada." />
        <KpiCard label="Requieren intervención" kpi={k.needs_manager} format={num} hint="No hay un nivel superior con personas para escalarlos." />
      </SimpleGrid>
      <Title order={2} fz="md" mb="xs">Resultados del periodo</Title>
      <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="xs" mb="md">
        <KpiCard label="Creados" kpi={k.created} format={num} />
        <KpiCard label="Cerrados" kpi={k.closed} format={num} better="up" />
        <KpiCard label="SLA cumplido" kpi={k.sla} format={pct} better="up" hint="Primeras respuestas aceptadas antes del vencimiento, sobre el total de respuestas y auto-escalamientos." />
        <KpiCard label="Satisfacción (CSAT)" kpi={k.csat} format={csat} better="up" hint="Promedio de las encuestas respondidas en el periodo." />
      </SimpleGrid>
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, lg: 8 }}>
        <ChartCard title="Entradas y cierres" question="Volumen diario del periodo seleccionado." empty={!daily.length}>
          <LineChart h={260} data={daily} dataKey="dia" curveType="linear" withDots={false} withLegend
            series={[{ name: "creados", label: "Creados", color: "navy.6" }, { name: "cerrados", label: "Cerrados", color: "teal.6" }]} />
        </ChartCard>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 4 }}>
        <ChartCard title="Evolución de pendientes" question="Tickets abiertos al cierre de cada día." empty={!daily.length}>
          <AreaChart h={260} data={daily} dataKey="dia" curveType="linear" withDots={false}
            series={[{ name: "abiertos", label: "Abiertos al cierre del día", color: "orange.6" }]} />
        </ChartCard>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 8 }}>
        <ChartCard title="Distribución del trabajo abierto" question="Situación actual, independiente del periodo seleccionado.">
          <BarChart h={220} data={r.series.by_status.map((s) => ({ ...s, estado: STATUS[String(s.estado)] }))} dataKey="estado"
            orientation="vertical" yAxisProps={{ width: 170 }} series={[{ name: "tickets", label: "Tickets", color: "navy.6" }]} />
        </ChartCard>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Paper withBorder radius="lg" p="md" h="100%">
            <Title order={3} fz="md" mb="sm">Dónde continuar</Title>
            <Stack gap="md">
              <div><Anchor component={Link} to={tabLink("times")} fw={500} size="sm">Tiempos y SLA</Anchor><Text size="xs" c="gray.7">Compara áreas y revisa la antigüedad de los pendientes.</Text></div>
              <div><Anchor component={Link} to={tabLink("team")} fw={500} size="sm">Equipo</Anchor><Text size="xs" c="gray.7">Contrasta carga actual y resultados antes de redistribuir.</Text></div>
              <div><Anchor component={Link} to={tabLink("clients")} fw={500} size="sm">Clientes</Anchor><Text size="xs" c="gray.7">Revisa cuántas respuestas respaldan la satisfacción.</Text></div>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </>
  );
}
