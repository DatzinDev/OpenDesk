import { Group, Paper, Text, Tooltip } from "@mantine/core";
import { IconArrowDownRight, IconArrowUpRight, IconInfoCircle } from "@tabler/icons-react";
import type { Kpi } from "../api";
import { csat, num, pct } from "../format";

type Props = {
  label: string;
  kpi?: Kpi;
  format: (v: number | null) => string;
  /** Qué dirección es buena; sin valor, la variación se muestra en gris. */
  better?: "up" | "down";
  hint?: string;
};

export function KpiCard({ label, kpi, format, better, hint }: Props) {
  const value = kpi?.value ?? null;
  const prev = kpi?.prev ?? null;
  const diff = value != null && prev != null ? value - prev : null;
  const good = diff == null || diff === 0 || !better ? null : (diff > 0) === (better === "up");
  const Arrow = diff != null && diff < 0 ? IconArrowDownRight : IconArrowUpRight;
  return (
    <Paper withBorder radius="lg" p="sm" h="100%">
      <Group gap={4} wrap="nowrap">
        <Text size="xs" c="gray.7">
          {label}
        </Text>
        {hint && (
          <Tooltip label={hint} multiline w={240}>
            <IconInfoCircle size={13} color="var(--mantine-color-gray-5)" aria-label={hint} />
          </Tooltip>
        )}
      </Group>
      <Text fz={24} fw={600} mt={4} style={{ fontVariantNumeric: "tabular-nums" }}>
        {format(value)}
      </Text>
      {diff != null && (
        <Group gap={2} mt={2} c={good == null ? "dimmed" : good ? "teal.7" : "red.7"}>
          {diff !== 0 && <Arrow size={14} />}
          <Text size="xs" c="inherit">
            {diff === 0 ? "Sin cambio" : `${format === pct ? `${num(Math.abs(diff))} pp` : format === csat ? `${num(Math.abs(diff))} puntos` : format(Math.abs(diff))} ${diff > 0 ? "más" : "menos"}`} vs. periodo anterior
          </Text>
        </Group>
      )}
    </Paper>
  );
}
