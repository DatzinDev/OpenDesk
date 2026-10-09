import { Anchor, Badge, Group, Paper, Stack, Text, ThemeIcon, Timeline } from "@mantine/core";
import {
  IconAlertTriangle,
  IconArrowsExchange,
  IconCalendarEvent,
  IconCircleCheck,
  IconCircleDot,
  IconFileText,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconTag,
  IconTrendingUp,
  type Icon,
} from "@tabler/icons-react";
import { useTicketForm } from "@/features/settings";
import classes from "../pages/TicketViews.module.css";
import { useAreas } from "@/features/areas";
import { OUTCOME_LABELS, priorityLabel, type Priority, type TicketDetail, type TicketEvent } from "../types";
import { dateFmt } from "./Badges";

const ICONS: Partial<Record<string, Icon>> = {
  created: IconPlus,
  update: IconCalendarEvent,
  escalate: IconTrendingUp,
  close: IconCircleCheck,
  reassign: IconArrowsExchange,
  assigned: IconArrowsExchange,
  status: IconTag,
  edited: IconPencil,
  closed: IconCircleCheck,
  reopened: IconRefresh,
  needs_manager: IconAlertTriangle,
  commitment_overdue: IconAlertTriangle,
};

const STATE = {
  pending: { label: "Pendiente de aprobación", color: "orange" },
  accepted: { label: "Aceptada", color: "teal" },
  rejected: { label: "Rechazada", color: "red" },
  cancelled: { label: "Cancelada", color: "gray" },
} as const;

const FIELD_LABELS: Record<string, string> = {
  title: "el título",
  description: "la descripción",
  priority: "la prioridad",
  client_name: "el nombre del cliente",
  client_email: "el correo del cliente",
};

const REASONS: Record<string, string> = {
  escalate: "Escalado a",
  auto: "Venció el SLA; escalado automáticamente a",
  reassign: "Reasignado a",
  manual: "Reasignado por el Gestor a",
  reopen: "Asignado de nuevo a",
};

export function TicketTimeline({ ticket }: { ticket: TicketDetail }) {
  const { data: areas = [] } = useAreas();
  const { data: form } = useTicketForm();
  const show = (field: string, value: string | null) => value ? (field === "priority" ? priorityLabel(value as Priority, form?.system.find(f => f.id === "priority")?.options) : `«${value}»`) : "vacío";
  const who = (id?: string | null) => (id ? (ticket.names[String(id)] ?? "una persona") : "");
  const areaName = (id?: string) => areas.find((a) => a.id === id)?.name ?? "otra área";

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
      case "status":
        return e.data.name ? `${by} cambió el estatus a «${e.data.name}»` : `${by} quitó el estatus de seguimiento`;
      case "edited": {
        const parts = Object.entries(e.data.changes ?? {}).map(([field, v]) =>
          v ? `${FIELD_LABELS[field] ?? field} (${show(field, v[0])} → ${show(field, v[1])})` : (FIELD_LABELS[field] ?? field),
        );
        parts.push(...(e.data.custom_changes ?? []).map(c => `${c.label} (${c.before || "vacío"} → ${c.after || "vacío"})`));
        return `${by} editó ${parts.join(", ")}`;
      }
      case "closed":
        return `${by} cerró el ticket como ${OUTCOME_LABELS[e.data.outcome!]}`;
      case "reopened":
        return `${by} reabrió el ticket`;
      case "commitment_overdue":
        return "Venció la fecha compromiso sin cierre";
      case "needs_manager":
        return "No hay un nivel superior con personas. Requiere intervención del Gestor.";
      default:
        return `${by} comentó`;
    }
  };

  return (
    <Timeline bulletSize={32} lineWidth={1}>
      {ticket.events.map((e) => {
        // Tipos de evento antiguos o desconocidos (p. ej. comentarios previos) se muestran sin romper la vista.
        const Icon = ICONS[e.kind] ?? IconCircleDot;
        const state = e.state ? STATE[e.state] : null;
        return (
          <Timeline.Item
            key={e.id}
            bullet={<ThemeIcon radius="xl" size={32} variant="light" color={e.kind === "needs_manager" ? "red" : e.kind === "update" ? "contrast" : e.kind === "assigned" ? "blue" : state?.color ?? "navy"}><Icon size={17} stroke={1.6} /></ThemeIcon>}
            color={e.kind === "needs_manager" || e.kind === "commitment_overdue" ? "red" : state?.color === "orange" ? "orange" : "navy"}
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
                <Text size="sm" className={classes.comment}>
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
                    {e.decided_at ? ` · ${dateFmt.format(new Date(e.decided_at))}` : ""}
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
