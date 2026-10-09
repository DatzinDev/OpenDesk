import { Alert, Button, Drawer, Group, Select, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAreas } from "@/features/areas";
import { useTicketForm, type CustomValues, type FormDefinition } from "@/features/settings";
import { TicketFormFields } from "./TicketFormFields";
import { ticketsApi } from "../api";
import { usePeople, useTicketAction } from "../hooks";
import { type Priority, type TicketInput } from "../types";
import { FilesField, filesOk } from "./FilesField";

type Props = { opened: boolean; onClose: () => void };

export function TicketDrawer({ opened, onClose }: Props) {
  const navigate = useNavigate();
  const create = useTicketAction(({ data, files }: { data: TicketInput; files: File[] }) => ticketsApi.create(data, files));
  const { data: areas = [] } = useAreas();
  const definition = useTicketForm(opened);
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [customValues, setCustomValues] = useState<CustomValues>({});
  useEffect(() => { if (opened && !form && definition.data && !definition.isFetching) { setForm(structuredClone(definition.data)); const options = definition.data.system.find(f => f.id === "priority")!.options; setPriority(current => options.some(o => o.id === current && o.active) ? current : options.find(o => o.active)!.id as Priority); } }, [opened, form, definition.data, definition.isFetching]);
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
    setForm(null);
    setCustomValues({});
    create.reset();
  }, [opened]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaId || !assigneeId || !form) return;
    const data: TicketInput = {
      title: title.trim(),
      description: description.trim(),
      area_id: areaId,
      assignee_id: assigneeId,
      priority,
      client_name: clientName.trim() || null,
      client_email: clientEmail.trim() || null,
      custom_values: customValues,
      form_revision: form.revision,
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

  const reloadForm = async () => {
    const result = await definition.refetch();
    if (!result.data) return;
    const active = new Set(result.data.fields.filter(f => f.active).map(f => f.id));
    setCustomValues(current => Object.fromEntries(Object.entries(current).filter(([id]) => active.has(id))));
    setForm(structuredClone(result.data));
    const options = result.data.system.find(f => f.id === "priority")!.options;
    setPriority(current => options.some(o => o.id === current && o.active) ? current : options.find(o => o.active)!.id as Priority);
    create.reset();
  };

  const meta = (id: string) => {
    const field = form?.system.find(f => f.id === id);
    return { label: field?.label, description: field?.help || undefined, required: !!field?.required };
  };
  const priorities = form?.system.find(f => f.id === "priority")?.options ?? [];
  return (
    <Drawer opened={opened} onClose={onClose} size="md" title={<Text fw={600} fz="lg">Nuevo ticket</Text>}>
      <form onSubmit={submit}>
        <Stack gap="md">
          <TicketFormFields form={form} values={customValues} onChange={setCustomValues} slots={{
            title: <TextInput {...meta("title")} maxLength={160} value={title} onChange={e => setTitle(e.currentTarget.value)} data-autofocus />,
            description: <Textarea {...meta("description")} autosize minRows={4} maxRows={10} maxLength={10000} value={description} onChange={e => setDescription(e.currentTarget.value)} />,
            area_id: <Select {...meta("area_id")} placeholder="Selecciona un área" data={areas.filter(a => a.is_active).map(a => ({ value: String(a.id), label: a.name }))} value={areaId} onChange={v => { setAreaId(v); setAssigneeId(null); }} />,
            assignee_id: <Select {...meta("assignee_id")} searchable disabled={!areaId} placeholder={areaId ? "Selecciona a una persona" : "Primero elige el área"} nothingFoundMessage="El área no tiene personas activas." data={people.map(p => ({ value: String(p.id), label: `${p.name} · Nivel ${p.level}` }))} value={assigneeId} onChange={setAssigneeId} />,
            priority: <Select {...meta("priority")} value={priority} data={priorities.filter(o => o.active).map(o => ({ value: o.id, label: o.label }))} onChange={v => v && setPriority(v as Priority)} />,
            client_name: <TextInput {...meta("client_name")} maxLength={120} value={clientName} onChange={e => setClientName(e.currentTarget.value)} />,
            client_email: <TextInput {...meta("client_email")} type="email" value={clientEmail} onChange={e => setClientEmail(e.currentTarget.value)} />,
            files: <FilesField {...meta("files")} value={files} onChange={setFiles} />,
          }} />
          {definition.isError && <Alert color="red">No se pudo cargar el formulario. <Button variant="subtle" onClick={() => definition.refetch()}>Reintentar</Button></Alert>}
          {create.error && <Alert color="red" variant="light">{create.error.message}<Button variant="subtle" size="xs" onClick={reloadForm}>Actualizar formulario</Button></Alert>}
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={create.isPending} disabled={!filesOk(files) || !areaId || !assigneeId || !form}>
              Crear ticket
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
}
