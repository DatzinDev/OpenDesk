import { Alert, Button, Drawer, Group, Select, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { useTicketForm, type CustomValues, type FormDefinition } from "@/features/settings";
import { TicketFormFields } from "./TicketFormFields";
import { ticketsApi } from "../api";
import { useTicketAction } from "../hooks";
import { type Priority, type Ticket, type TicketUpdate } from "../types";

type Props = { ticket: Ticket; opened: boolean; onClose: () => void };

/** Corrige los datos descriptivos; área y asignado se cambian con Reasignar. */
export function EditTicketDrawer({ ticket, opened, onClose }: Props) {
  const save = useTicketAction((data: TicketUpdate) => ticketsApi.update(ticket.id, data));
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("media");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const definition = useTicketForm(opened);
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [customValues, setCustomValues] = useState<CustomValues>({});
  useEffect(() => { if (opened && !form && definition.data && !definition.isFetching) setForm(structuredClone(definition.data)); }, [opened, form, definition.data, definition.isFetching]);

  useEffect(() => {
    if (!opened) return;
    setTitle(ticket.title);
    setDescription(ticket.description);
    setPriority(ticket.priority);
    setClientName(ticket.client_name ?? "");
    setClientEmail(ticket.client_email ?? "");
    setForm(null);
    setCustomValues(ticket.custom_values ?? {});
    save.reset();
  }, [opened, ticket.id]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const changed = Object.fromEntries(form.fields.filter(f => f.active && (customValues[f.id] ?? null) !== (ticket.custom_values?.[f.id] ?? null)).map(f => [f.id, customValues[f.id] ?? null]));
    save.mutate(
      { title: title.trim(), description: description.trim(), priority, client_name: clientName.trim(), client_email: clientEmail.trim(), custom_values: changed, form_revision: form.revision },
      {
        onSuccess: () => {
          notifications.show({ message: "Cambios guardados." });
          onClose();
        },
      },
    );
  };

  const reloadForm = async () => {
    const result = await definition.refetch();
    if (!result.data) return;
    const active = new Set(result.data.fields.filter(f => f.active).map(f => f.id));
    setCustomValues(current => ({ ...(ticket.custom_values ?? {}), ...Object.fromEntries(Object.entries(current).filter(([id]) => active.has(id))) }));
    setForm(structuredClone(result.data));
    save.reset();
  };

  const meta = (id: string) => {
    const field = form?.system.find(f => f.id === id);
    return { label: field?.label, description: field?.help || undefined, required: !!field?.required };
  };
  const priorities = form?.system.find(f => f.id === "priority")?.options ?? [];
  return (
    <Drawer opened={opened} onClose={onClose} size="md" title={<Text fw={600} fz="lg">Editar {ticket.folio}</Text>}>
      <form onSubmit={submit}>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Los cambios quedan en el historial. Para cambiar el área o la persona asignada, usa Reasignar.
          </Text>
          <TicketFormFields form={form} values={customValues} onChange={setCustomValues} original={ticket.custom_values ?? {}} slots={{
            title: <TextInput {...meta("title")} maxLength={160} value={title} onChange={e => setTitle(e.currentTarget.value)} data-autofocus />,
            description: <Textarea {...meta("description")} required={!!meta("description").required && !!ticket.description} autosize minRows={4} maxRows={10} maxLength={10000} value={description} onChange={e => setDescription(e.currentTarget.value)} />,
            priority: <Select {...meta("priority")} value={priority} data={priorities.filter(o => o.active || o.id === ticket.priority).map(o => ({ value: o.id, label: o.label, disabled: !o.active }))} onChange={v => v && setPriority(v as Priority)} />,
            client_name: <TextInput {...meta("client_name")} required={!!meta("client_name").required && !!ticket.client_name} maxLength={120} value={clientName} onChange={e => setClientName(e.currentTarget.value)} />,
            client_email: <TextInput {...meta("client_email")} required={!!meta("client_email").required && !!ticket.client_email} type="email" value={clientEmail} onChange={e => setClientEmail(e.currentTarget.value)} />,
          }} />
          {definition.isError && <Alert color="red">No se pudo cargar el formulario. <Button variant="subtle" onClick={() => definition.refetch()}>Reintentar</Button></Alert>}
          {save.error && <Alert color="red" variant="light">{save.error.message}<Button variant="subtle" size="xs" onClick={reloadForm}>Actualizar formulario</Button></Alert>}
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={save.isPending} disabled={!title.trim() || !form}>
              Guardar cambios
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
}
