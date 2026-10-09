import { BarChart } from "@mantine/charts";
import { Box, SimpleGrid, Text, Tooltip } from "@mantine/core";
import type { Report } from "../../api";
import { day, num, PRIORITY } from "../../format";
import { ChartCard } from "../ChartCard";
import { KpiCard } from "../KpiCard";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** Mapa de calor día × hora: la intensidad del color es el número de tickets creados. */
function Heatmap({ cells }: { cells: Report["series"][string] }) {
  const grid = new Map(cells.map((c) => [`${c.dia}-${c.hora}`, Number(c.tickets)]));
  const max = Math.max(1, ...grid.values());
  return (
    <Box style={{ overflowX: "auto" }}>
      <Box style={{ display: "grid", gridTemplateColumns: "36px repeat(24, minmax(16px, 1fr))", gap: 3, minWidth: 560 }}>
        <span />
        {Array.from({ length: 24 }, (_, h) => (
          <Text key={h} size="10px" c="dimmed" ta="center">{h % 3 === 0 ? h : ""}</Text>
        ))}
        {DAYS.map((d, dw) => (
          <Box key={d} style={{ display: "contents" }}>
            <Text size="xs" c="dimmed">{d}</Text>
            {Array.from({ length: 24 }, (_, h) => {
              const n = grid.get(`${dw}-${h}`) ?? 0;
              return (
                <Tooltip key={h} label={`${d} ${h}:00 · ${n} tickets`}>
                  <Box style={{ aspectRatio: "1", borderRadius: 3,
                    background: n ? `color-mix(in srgb, var(--mantine-color-navy-6) ${Math.round(15 + 85 * (n / max))}%, white)` : "var(--mantine-color-gray-1)" }} />
                </Tooltip>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function DemandTab({ r }: { r: Report }) {
  const k = r.kpis;
  return (
    <>
      <SimpleGrid cols={{ base: 2, sm: 3 }} mb="lg">
        <KpiCard label="Tickets creados" kpi={k.created} format={num} />
        <KpiCard label="Promedio por día" kpi={k.per_day} format={num} />
        <KpiCard label="Hora pico" kpi={k.peak_hour} format={(v) => (v == null ? "—" : `${v}:00`)} hint="Hora del día con más tickets creados." />
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <ChartCard title="Cuándo llegan los tickets" question="¿En qué días y horas reforzar el equipo?" empty={!r.series.heatmap.length}>
          <Heatmap cells={r.series.heatmap} />
        </ChartCard>
        <ChartCard title="Tickets creados por semana" question="¿La demanda está creciendo?" empty={!r.series.weekly.length}>
          <BarChart h={240} data={r.series.weekly.map((w) => ({ ...w, semana: day(String(w.semana)) }))} dataKey="semana"
            series={[{ name: "tickets", label: "Creados", color: "navy.6" }]} />
        </ChartCard>
        <ChartCard title="Por área" question="¿Qué equipo recibe más trabajo?" empty={!r.series.by_area.length}>
          <BarChart h={220} orientation="vertical" yAxisProps={{ width: 130 }} data={r.series.by_area} dataKey="area"
            series={[{ name: "tickets", label: "Creados", color: "teal.6" }]} />
        </ChartCard>
        <ChartCard title="Por prioridad" question="¿Cuánto de lo que llega es urgente?">
          <BarChart h={220} data={r.series.by_priority.map((p) => ({ ...p, prioridad: PRIORITY[String(p.prioridad)] }))} dataKey="prioridad"
            series={[{ name: "tickets", label: "Creados", color: "orange.6" }]} />
        </ChartCard>
      </SimpleGrid>
    </>
  );
}
