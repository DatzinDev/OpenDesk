import { Alert, Button, Drawer, Group, SegmentedControl, Select, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { useAreas } from "@/features/areas";
import { ticketsApi } from "../api";
import { usePeers, useTicketAction } from "../hooks";
import { PROPOSAL_LABELS, type ProposalInput, type ProposalKind, type Ticket } from "../types";
import { FilesField, filesOk } from "./FilesField";

type Props = { ticket: Ticket | null; kind: ProposalKind | null; onClose: () => void };

const HELP: Record<ProposalKind, string> = {
  update: "Cuéntale al Gestor qué harás y para cuándo. Al aprobarse, esa fecha se vuelve tu compromiso.",
  escalate: "El ticket subirá al siguiente nivel de tu área cuando el Gestor lo apruebe.",
  close: "Describe lo que se hizo. El Gestor confirmará si quedó resuelto.",
  reassign: "Propón a un compañero de tu área o envíalo a otra área. El Gestor decide.",
};

const COMMENT_LABEL: Record<ProposalKind, string> = {
  update: "¿Qué vas a hacer?",
  escalate: "Motivo",
  close: "¿Qué se hizo?",
  reassign: "Motivo",
};

/** Fecha y hora local mínima para un input datetime-local (ahora + 1 h). */
const minLocal = () => {
  const d = new Date(Date.now() + 3600_000 - new Date().getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 16);
};

export function ProposalDrawer({ ticket, kind, onClose }: Props) {
  const opened = !!ticket && !!kind;
  const propose = useTicketAction(({ id, data, files }: { id: number; data: ProposalInput; files: File[] }) =>
    ticketsApi.propose(id, data, files),
  );
  const [comment, setComment] = useState("");
  const [due, setDue] = useState("");
  const [target, setTarget] = useState<"peer" | "area">("peer");
  const [choice, setChoice] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const { data: peers = [] } = usePeers(opened && kind === "reassign");
  const { data: areas = [] } = useAreas();

  useEffect(() => {
    if (!opened) return;
    setComment("");
    setDue("");
    setTarget("peer");
    setChoice(null);
    setFiles([]);
    propose.reset();
  }, [opened, kind, ticket?.id]);

  if (!ticket || !kind) return <Drawer opened={false} onClose={onClose} />;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: ProposalInput = { kind, comment: comment.trim() };
    if (kind === "update") data.due_at = new Date(due).toISOString();
    if (kind === "reassign" && choice) data[target === "peer" ? "user_id" : "area_id"] = Number(choice);
    propose.mutate(
      { id: ticket.id, data, files },
      {
        onSuccess: () => {
          notifications.show({ message: "Propuesta enviada al Gestor." });
          onClose();
        },
      },
    );
  };

  const missing = (kind === "update" && !due) || (kind === "reassign" && !choice);

  return (
    <Drawer opened={opened} onClose={onClose} size="md" title={<Text fw={600} fz="lg">{PROPOSAL_LABELS[kind]}</Text>}>
      <form onSubmit={submit}>
        <Stack gap="md">
          <div>
            <Text size="xs" c="dimmed">
              {ticket.folio}
            </Text>
            <Text fw={500}>{ticket.title}</Text>
          </div>
          <Text size="sm" c="dimmed">
            {HELP[kind]}
          </Text>
          {kind === "reassign" && (
            <>
              <SegmentedControl
                fullWidth
                value={target}
                onChange={(v) => {
                  setTarget(v as "peer" | "area");
                  setChoice(null);
                }}
                data={[
                  { value: "peer", label: "A un compañero" },
                  { value: "area", label: "A otra área" },
                ]}
              />
              <Select
                label={target === "peer" ? "Compañero" : "Área destino"}
                required
                searchable
                nothingFoundMessage="No hay opciones disponibles."
                data={
                  target === "peer"
                    ? peers.map((p) => ({ value: String(p.id), label: `${p.name} · Nivel ${p.level}` }))
                    : areas.filter((a) => a.is_active && a.id !== ticket.area_id).map((a) => ({ value: String(a.id), label: a.name }))
                }
                value={choice}
                onChange={setChoice}
              />
            </>
          )}
          {kind === "update" && (
            <TextInput
              type="datetime-local"
              label="Fecha tentativa de resolución"
              required
              min={minLocal()}
              value={due}
              onChange={(e) => setDue(e.currentTarget.value)}
            />
          )}
          <Textarea
            label={COMMENT_LABEL[kind]}
            required
            autosize
            minRows={3}
            maxRows={8}
            value={comment}
            onChange={(e) => setComment(e.currentTarget.value)}
          />
          <FilesField value={files} onChange={setFiles} />
          {propose.error && <Alert color="red" variant="light">{propose.error.message}</Alert>}
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={propose.isPending} disabled={missing || !filesOk(files)}>
              Enviar propuesta
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
}
