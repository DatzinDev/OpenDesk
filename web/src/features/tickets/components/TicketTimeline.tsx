import { Anchor, Badge, Group, Paper, Stack, Text, Timeline } from "@mantine/core";
import {
  IconAlertTriangle,
  IconArrowsExchange,
  IconCalendarEvent,
  IconCircleCheck,
  IconFileText,
  IconMessage,
  IconPlus,
  IconRefresh,
  IconTrendingUp,
  type Icon,
} from "@tabler/icons-react";
import { useAreas } from "@/features/areas";
import { OUTCOME_LABELS, type TicketDetail, type TicketEvent } from "../types";
import { dateFmt } from "./Badges";

const ICONS: Record<TicketEvent["kind"], Icon> = {
  created: IconPlus,
  update: IconCalendarEvent,
  escalate: IconTrendingUp,
  close: IconCircleCheck,
  reassign: IconArrowsExchange,
  assigned: IconArrowsExchange,
  comment: IconMessage,
  closed: IconCircleCheck,
  reopened: IconRefresh,
  needs_manager: IconAlertTriangle,
};

const STATE = {
  pending: { label: "Pendiente de aprobación", color: "orange" },
  accepted: { label: "Aceptada", color: "teal" },
  rejected: { label: "Rechazada", color: "red" },
  cancelled: { label: "Cancelada", color: "gray" },
} as const;

const REASONS: Record<string, string> = {
  escalate: "Escalado a",
  reassign: "Reasignado a",
  manual: "Reasignado por el Gestor a",
  reopen: "Asignado de nuevo a",
};

export function TicketTimeline({ ticket }: { ticket: TicketDetail }) {
  const { data: areas = [] } = useAreas();
  const who = (id?: number | null) => (id ? (ticket.names[String(id)] ?? "una persona") : "");
  const areaName = (id?: number) => areas.find((a) => a.id === id)?.name ?? "otra área";

  const title = (e: TicketEvent): string => {
    const by = e.actor_name ?? "Sistema";
    switch (e.kind) {
      case "created":
        return `${by} creó el ticket y lo asignó a ${who(e.data.to)}`;
      case "update":
        return `${by} propone una actualización para el ${dateFmt.format(new Date(e.data.due_at!))}`;
      case "escalate":
        return `${by} propone escalar el ticket`;
      case "close":
        return `${by} propone cerrar el ticket`;
      case "reassign":
        return e.data.user_id
          ? `${by} propone reasignar a ${who(e.data.user_id)}`
          : `${by} propone enviar el ticket a ${areaName(e.data.area_id)}`;
      case "assigned":
        return `${REASONS[e.data.reason ?? "manual"]} ${who(e.data.to)}${e.data.reason === "reassign" || e.data.reason === "manual" ? ` (${areaName(e.data.area_id)})` : ""}`;
      case "comment":
        return `${by} comentó`;
      case "closed":
        return `${by} cerró el ticket como ${OUTCOME_LABELS[e.data.outcome!]}`;
      case "reopened":
        return `${by} reabrió el ticket`;
      default:
        return "No hay un nivel superior con personas. Requiere intervención del Gestor.";
    }
  };

  return (
    <Timeline bulletSize={28} lineWidth={2}>
      {ticket.events.map((e) => {
        const Icon = ICONS[e.kind];
        const state = e.state ? STATE[e.state] : null;
        return (
          <Timeline.Item
            key={e.id}
            bullet={<Icon size={14} />}
            color={e.kind === "needs_manager" ? "red" : state?.color === "orange" ? "orange" : "navy"}
            title={
              <Group gap="xs" wrap="wrap">
                <Text size="sm" fw={500}>
                  {title(e)}
                </Text>
                {state && (
                  <Badge size="sm" variant="light" color={state.color} radius="sm">
                    {state.label}
                  </Badge>
                )}
              </Group>
            }
          >
            <Text size="xs" c="dimmed" mb={4}>
              {dateFmt.format(new Date(e.created_at))}
            </Text>
            <Stack gap={6}>
              {e.comment && (
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                  {e.comment}
                </Text>
              )}
              {e.attachments.length > 0 && (
                <Group gap="xs">
                  {e.attachments.map((a) => (
                    <Anchor key={a.id} href={`/api/attachments/${a.id}`} target="_blank" rel="noopener" size="sm">
                      <Group gap={4} wrap="nowrap">
                        <IconFileText size={14} />
                        {a.filename}
                      </Group>
                    </Anchor>
                  ))}
                </Group>
              )}
              {e.decided_by_name && (e.state === "accepted" || e.state === "rejected") && (
                <Paper withBorder radius="md" p="xs" bg="var(--mantine-color-gray-0)">
                  <Text size="xs" c="dimmed">
                    {e.state === "accepted" ? "Aceptada" : "Rechazada"} por {e.decided_by_name}
                    {e.data.outcome ? ` como ${OUTCOME_LABELS[e.data.outcome]}` : ""}
                  </Text>
                  {e.decision_comment && (
                    <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                      {e.decision_comment}
                    </Text>
                  )}
                </Paper>
              )}
            </Stack>
          </Timeline.Item>
        );
      })}
    </Timeline>
  );
}
