import { Alert, Button, Drawer, Group, SegmentedControl, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { ticketsApi } from "../api";
import { useTicketAction } from "../hooks";
import { PRIORITY_LABELS, type Priority, type Ticket, type TicketUpdate } from "../types";

type Props = { ticket: Ticket; opened: boolean; onClose: () => void };

/** Corrige los datos descriptivos; área y asignado se cambian con Reasignar. */
export function EditTicketDrawer({ ticket, opened, onClose }: Props) {
  const save = useTicketAction((data: TicketUpdate) => ticketsApi.update(ticket.id, data));
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("media");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  useEffect(() => {
    if (!opened) return;
    setTitle(ticket.title);
    setDescription(ticket.description);
    setPriority(ticket.priority);
    setClientName(ticket.client_name ?? "");
    setClientEmail(ticket.client_email ?? "");
    save.reset();
  }, [opened, ticket.id]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate(
      { title: title.trim(), description: description.trim(), priority, client_name: clientName.trim(), client_email: clientEmail.trim() },
      {
        onSuccess: () => {
          notifications.show({ message: "Cambios guardados." });
          onClose();
        },
      },
    );
  };

  return (
    <Drawer opened={opened} onClose={onClose} size="md" title={<Text fw={600} fz="lg">Editar {ticket.folio}</Text>}>
      <form onSubmit={submit}>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Los cambios quedan en el historial. Para cambiar el área o la persona asignada, usa Reasignar.
          </Text>
          <TextInput label="Título" required maxLength={160} value={title} onChange={(e) => setTitle(e.currentTarget.value)} data-autofocus />
          <Textarea label="Descripción" required autosize minRows={4} maxRows={10} value={description}
            onChange={(e) => setDescription(e.currentTarget.value)} />
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
          <TextInput label="Correo del cliente" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.currentTarget.value)} />
          {save.error && <Alert color="red" variant="light">{save.error.message}</Alert>}
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={save.isPending} disabled={!title.trim() || !description.trim()}>
              Guardar cambios
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
}
