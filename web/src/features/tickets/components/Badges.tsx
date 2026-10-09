import { Badge, Group, Text, Tooltip } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { OUTCOME_LABELS, PRIORITY_LABELS, STATUS_LABELS, slaState, type Priority, type Ticket } from "../types";

export const dateFmt = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" });

const STATUS_COLORS = { asignado: "navy", pendiente: "orange", seguimiento: "teal", cerrado: "gray" } as const;
const PRIORITY_COLORS: Record<Priority, string> = { alta: "red", media: "yellow", baja: "gray" };

export function StatusBadge({ ticket }: { ticket: Ticket }) {
  const label = ticket.status === "cerrado" && ticket.outcome ? OUTCOME_LABELS[ticket.outcome] : STATUS_LABELS[ticket.status];
  return (
    <Badge variant="light" color={STATUS_COLORS[ticket.status]} radius="sm">
      {label}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant="dot" color={PRIORITY_COLORS[priority]} radius="sm">
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

/** Plazo vigente con semáforo: SLA de primera respuesta o fecha compromiso. */
export function DueLabel({ ticket }: { ticket: Ticket }) {
  if (ticket.status === "cerrado") return <Text size="sm" c="dimmed">—</Text>;
  const { color, overdue } = slaState(ticket);
  const what = ticket.committed ? "Compromiso" : "SLA";
  return (
    <Tooltip label={`${what}: ${dateFmt.format(new Date(ticket.due_at))}`}>
      <Group gap={6} wrap="nowrap">
        <span
          aria-hidden
          style={{ width: 8, height: 8, borderRadius: 8, background: `var(--mantine-color-${color}-6)`, flex: "none" }}
        />
        <Text size="sm" c={overdue ? "red.7" : undefined} fw={overdue ? 500 : undefined}>
          {overdue ? `${what} vencido` : `${what} ${dateFmt.format(new Date(ticket.due_at))}`}
        </Text>
      </Group>
    </Tooltip>
  );
}

export function ManagerFlag({ ticket }: { ticket: Ticket }) {
  if (!ticket.needs_manager) return null;
  return (
    <Badge color="red" variant="light" radius="sm" leftSection={<IconAlertTriangle size={12} />}>
      Requiere intervención del Gestor
    </Badge>
  );
}
