import { Alert, Button, Group, Modal, SegmentedControl, Select, Stack, Text, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { useAreas } from "@/features/areas";
import { ticketsApi } from "../api";
import { usePeople, useTicketAction } from "../hooks";
import { OUTCOME_LABELS, PROPOSAL_LABELS, type Outcome, type Ticket } from "../types";

export type StaffAction = "accept" | "reject" | "reassign" | "close" | "reopen";

type Props = { ticket: Ticket | null; action: StaffAction | null; onClose: () => void };

const TITLES: Record<StaffAction, string> = {
  accept: "Aceptar propuesta",
  reject: "Rechazar propuesta",
  reassign: "Reasignar ticket",
  close: "Cerrar ticket",
  reopen: "Reabrir ticket",
};

const DONE: Record<StaffAction, string> = {
  accept: "Propuesta aceptada.",
  reject: "Propuesta rechazada.",
  reassign: "Ticket reasignado.",
  close: "Ticket cerrado.",
  reopen: "Ticket reabierto.",
};

/** Decisiones y acciones directas del Gestor sobre un ticket. */
export function ActionModal({ ticket, action, onClose }: Props) {
  const opened = !!ticket && !!action;
  const p = ticket?.pending;
  const { data: areas = [] } = useAreas();
  const [comment, setComment] = useState("");
  const [outcome, setOutcome] = useState<Outcome>("resuelto");
  const [areaId, setAreaId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Elegir persona: al reasignar (cualquier área) o al aceptar un envío a otra área.
  const fixedArea = action === "accept" && p?.kind === "reassign" ? (p.data.area_id ?? null) : null;
  const pickPerson = action === "reassign" || !!fixedArea;
  const area = fixedArea ?? areaId;
  const { data: people = [] } = usePeople(pickPerson ? area : null);
  const needsOutcome = action === "close" || (action === "accept" && p?.kind === "close");
  const commentRequired = action === "reject" || action === "close" || action === "reopen";

  const run = useTicketAction(async () => {
    const id = ticket!.id;
    const text = comment.trim();
    const uid = userId ?? undefined;
    switch (action) {
      case "accept":
        return ticketsApi.accept(id, p!.id, { comment: text, outcome: needsOutcome ? outcome : undefined, user_id: uid });
      case "reject":
        return ticketsApi.reject(id, p!.id, { comment: text });
      case "reassign":
        return ticketsApi.reassign(id, { user_id: uid!, comment: text });
      case "close":
        return ticketsApi.close(id, { outcome, comment: text });
      default:
        return ticketsApi.reopen(id, { comment: text });
    }
  });

  useEffect(() => {
    if (!opened) return;
    setComment("");
    setOutcome("resuelto");
    setAreaId(ticket ? String(ticket.area_id) : null);
    setUserId(null);
    run.reset();
  }, [opened, action, ticket?.id]);


  if (!ticket || !action) return <Modal opened={false} onClose={onClose} />;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run.mutate(undefined, {
      onSuccess: () => {
        notifications.show({ message: DONE[action] });
        onClose();
      },
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={600}>{TITLES[action]}</Text>} size="md">
      <form onSubmit={submit}>
        <Stack gap="md">
          <div>
            <Text size="xs" c="dimmed">
              {ticket.folio}
            </Text>
            <Text fw={500}>{ticket.title}</Text>
          </div>
          {(action === "accept" || action === "reject") && p && (
            <Alert variant="light" color="navy" title={`${p.actor_name ?? "Usuario"} propone: ${PROPOSAL_LABELS[p.kind as keyof typeof PROPOSAL_LABELS].toLowerCase()}`}>
              <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                {p.comment}
              </Text>
            </Alert>
          )}
          {action === "reassign" && (
            <Select
              label="Área"
              data={areas.filter((a) => a.is_active).map((a) => ({ value: String(a.id), label: a.name }))}
              value={areaId}
              onChange={(v) => {
                setAreaId(v);
                setUserId(null);
              }}
            />
          )}
          {pickPerson && (
            <Select
              label={fixedArea ? `Persona de ${areas.find((a) => a.id === fixedArea)?.name ?? "el área destino"}` : "Persona"}
              required
              searchable
              nothingFoundMessage="El área no tiene personas activas."
              data={people.filter((x) => x.id !== ticket.assignee_id).map((x) => ({ value: String(x.id), label: `${x.name} · Nivel ${x.level}` }))}
              value={userId}
              onChange={setUserId}
            />
          )}
          {needsOutcome && (
            <SegmentedControl
              fullWidth
              value={outcome}
              onChange={(v) => setOutcome(v as Outcome)}
              data={(["resuelto", "no_resuelto"] as Outcome[]).map((o) => ({ value: o, label: OUTCOME_LABELS[o] }))}
            />
          )}
          <Textarea
            label={action === "reject" ? "Motivo del rechazo" : "Comentario"}
            required={commentRequired}
            placeholder={commentRequired ? undefined : "Opcional"}
            autosize
            minRows={3}
            maxRows={8}
            value={comment}
            onChange={(e) => setComment(e.currentTarget.value)}
            data-autofocus
          />
          {run.error && <Alert color="red" variant="light">{run.error.message}</Alert>}
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              color={action === "reject" ? "red" : undefined}
              loading={run.isPending}
              disabled={(pickPerson && !userId) || (commentRequired && !comment.trim())}
            >
              {TITLES[action].split(" ")[0]}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
