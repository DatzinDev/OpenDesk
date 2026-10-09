import { Alert, Button, Drawer, Group, SegmentedControl, Select, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAreas } from "@/features/areas";
import { ticketsApi } from "../api";
import { usePeople, useTicketAction } from "../hooks";
import { PRIORITY_LABELS, type Priority, type TicketInput } from "../types";
import { FilesField, filesOk } from "./FilesField";

type Props = { opened: boolean; onClose: () => void };

export function TicketDrawer({ opened, onClose }: Props) {
  const navigate = useNavigate();
  const create = useTicketAction(({ data, files }: { data: TicketInput; files: File[] }) => ticketsApi.create(data, files));
  const { data: areas = [] } = useAreas();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [areaId, setAreaId] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority>("media");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const { data: people = [] } = usePeople(areaId);

  useEffect(() => {
    if (!opened) return;
    setTitle("");
    setDescription("");
    setAreaId(null);
    setAssigneeId(null);
    setPriority("media");
    setClientName("");
    setClientEmail("");
    setFiles([]);
    create.reset();
  }, [opened]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaId || !assigneeId) return;
    const data: TicketInput = {
      title: title.trim(),
      description: description.trim(),
      area_id: areaId,
      assignee_id: assigneeId,
      priority,
      client_name: clientName.trim() || null,
      client_email: clientEmail.trim() || null,
    };
    create.mutate(
      { data, files },
      {
        onSuccess: (t) => {
          notifications.show({ message: `Ticket ${t.folio} creado y asignado.` });
          onClose();
          navigate(`/tickets/${t.id}`);
        },
      },
    );
  };

  return (
    <Drawer opened={opened} onClose={onClose} size="md" title={<Text fw={600} fz="lg">Nuevo ticket</Text>}>
      <form onSubmit={submit}>
        <Stack gap="md">
          <TextInput label="Título" required maxLength={160} value={title} onChange={(e) => setTitle(e.currentTarget.value)} data-autofocus />
          <Textarea
            label="Descripción"
            required
            autosize
            minRows={4}
            maxRows={10}
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
          />
          <Select
            label="Área"
            required
            placeholder="Selecciona un área"
            data={areas.filter((a) => a.is_active).map((a) => ({ value: String(a.id), label: a.name }))}
            value={areaId}
            onChange={(v) => {
              setAreaId(v);
              setAssigneeId(null);
            }}
          />
          <Select
            label="Asignado a"
            required
            searchable
            disabled={!areaId}
            placeholder={areaId ? "Selecciona a una persona" : "Primero elige el área"}
            nothingFoundMessage="El área no tiene personas activas."
            data={people.map((p) => ({ value: String(p.id), label: `${p.name} · Nivel ${p.level}` }))}
            value={assigneeId}
            onChange={setAssigneeId}
          />
          <div>
            <Text size="sm" fw={500} mb={4}>
              Prioridad
            </Text>
            <SegmentedControl
              fullWidth
              value={priority}
              onChange={(v) => setPriority(v as Priority)}
              data={(["alta", "media", "baja"] as Priority[]).map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
            />
          </div>
          <TextInput label="Nombre del cliente" maxLength={120} value={clientName} onChange={(e) => setClientName(e.currentTarget.value)} />
          <TextInput
            label="Correo del cliente"
            type="email"
            description="Si lo capturas, el cliente recibirá la encuesta de satisfacción al cerrar."
            value={clientEmail}
            onChange={(e) => setClientEmail(e.currentTarget.value)}
          />
          <FilesField value={files} onChange={setFiles} />
          {create.error && <Alert color="red" variant="light">{create.error.message}</Alert>}
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={create.isPending} disabled={!filesOk(files) || !areaId || !assigneeId}>
              Crear ticket
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
}
