import { Alert, Badge, Button, Checkbox, Group, Paper, Select, Stack, Switch, Text, TextInput, Textarea } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { settingsApi, type CustomField, type FormDefinition, type SystemField } from "../api";
import { useTicketForm } from "../hooks";
import { FieldInputs } from "./FieldInputs";
import { BuilderCard } from "./BuilderCard";
import { UnsavedChanges } from "./UnsavedChanges";
import { hasDraftChanges } from "../editor";
import classes from "./Builder.module.css";

const TYPES = [{ value: "text", label: "Texto" }, { value: "number", label: "Número" }, { value: "date", label: "Fecha" }, { value: "select", label: "Lista" }, { value: "boolean", label: "Sí / No" }];
const CORE_TYPES: Record<SystemField["id"], string> = { title: "Texto", description: "Párrafo", area_id: "Áreas", assignee_id: "Personas del área", priority: "Prioridades", client_name: "Texto", client_email: "Correo", files: "Archivos" };
const FIXED = new Set(["title", "area_id", "assignee_id"]);

export function FormEditor() {
  const query = useTicketForm();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<FormDefinition | null>(null);
  const [selected, setSelected] = useState("title");
  useEffect(() => { if (query.data) setDraft(structuredClone(query.data)); }, [query.data]);
  const save = useMutation({ mutationFn: settingsApi.saveForm, onSuccess: data => { qc.setQueryData(["ticket-form"], data); notifications.show({ message: "Formulario actualizado." }); } });
  if (query.isError) return <Alert color="red">No se pudo cargar el formulario. <Button variant="subtle" onClick={() => query.refetch()}>Reintentar</Button></Alert>;
  if (!draft) return null;
  const existing = new Set(query.data?.fields.map(f => f.id));
  const active = draft.fields.filter(f => f.active).length;
  const patch = (id: string, changes: Partial<CustomField & SystemField>) => setDraft(current => current && ({ ...current, fields: current.fields.map(f => f.id === id ? { ...f, ...changes } : f), system: current.system.map(f => f.id === id ? { ...f, ...changes } : f) }));
  const move = (index: number, offset: number) => { const order = [...draft.order]; [order[index], order[index + offset]] = [order[index + offset], order[index]]; setDraft({ ...draft, order }); };
  const invalid = [...draft.system, ...draft.fields].some(f => !f.label.trim() || (f.options.length > 0 && (f.options.some(o => !o.label.trim()) || !f.options.some(o => o.active)))) || draft.fields.some(f => f.type === "select" && !f.options.length);
  return <><UnsavedChanges dirty={hasDraftChanges(draft, query.data)} /><div className={classes.layout}>
    <Stack className={classes.canvas} gap="md">
      {draft.order.map((id, index) => {
        const core = draft.system.find(f => f.id === id);
        const custom = draft.fields.find(f => f.id === id);
        const field = core ?? custom;
        if (!field) return null;
        const editing = selected === id;
        const activeField = core || custom?.active;
        return <BuilderCard key={id} label={field.label} selected={editing} onSelect={() => setSelected(id)} index={index} total={draft.order.length} onMove={offset => move(index, offset)} badge={core ? "Predeterminado" : !activeField ? "Inactivo" : undefined}>
          {editing && <Group grow align="flex-start"><TextInput label="Pregunta" value={field.label} maxLength={80} onChange={e => patch(id, { label: e.currentTarget.value })} /><Select label="Tipo" value={core ? CORE_TYPES[core.id] : custom!.type} data={core ? [CORE_TYPES[core.id]] : TYPES} disabled={!!core || existing.has(id)} onChange={value => value && patch(id, { type: value as CustomField["type"], options: value === "select" ? [{ id: crypto.randomUUID(), label: "Opción 1", active: true }] : [] })} /></Group>}
          <fieldset disabled style={{ border: 0, margin: 0, padding: 0 }}>
            {custom ? <FieldInputs fields={[{ ...custom, active: true }]} values={{}} onChange={() => {}} /> : core?.id === "description" ? <Textarea label={field.label} description={field.help} required={field.required} minRows={3} readOnly /> : core?.id === "priority" || core?.id === "area_id" || core?.id === "assignee_id" ? <Select label={field.label} description={field.help} required={field.required} placeholder={core.id === "area_id" ? "Áreas activas" : core.id === "assignee_id" ? "Personas del área seleccionada" : "Selecciona una prioridad"} data={core.options.filter(o => o.active).map(o => ({ value: o.id, label: o.label }))} /> : <TextInput label={field.label} description={field.help} required={field.required} placeholder={core?.id === "files" ? "Seleccionar archivos" : undefined} readOnly />}
          </fieldset>
          {editing && <>
            <TextInput label="Ayuda (opcional)" value={field.help} maxLength={200} onChange={e => patch(id, { help: e.currentTarget.value })} />
            {core && (core.id === "area_id" || core.id === "assignee_id") && <Text size="xs" c="dimmed">Las opciones vienen del catálogo de {core.id === "area_id" ? "áreas" : "usuarios"}.</Text>}
            {field.options.length > 0 && <Stack gap="xs">{field.options.map(o => <Group key={o.id} wrap="nowrap"><TextInput aria-label="Opción" value={o.label} maxLength={80} style={{ flex: 1 }} onChange={e => patch(id, { options: field.options.map(x => x.id === o.id ? { ...x, label: e.currentTarget.value } : x) })} /><Switch aria-label={`Opción ${o.label} activa`} checked={o.active} onChange={e => patch(id, { options: field.options.map(x => x.id === o.id ? { ...x, active: e.currentTarget.checked } : x) })} /></Group>)}{custom && <Button variant="subtle" size="xs" disabled={field.options.length >= 50} onClick={() => patch(id, { options: [...field.options, { id: crypto.randomUUID(), label: "Nueva opción", active: true }] })}>Agregar opción</Button>}</Stack>}
            <Group justify="space-between"><Checkbox label={core?.id === "files" ? "Obligatorio al crear" : "Obligatorio"} checked={field.required} disabled={FIXED.has(id)} onChange={e => patch(id, { required: e.currentTarget.checked })} />{custom && <Switch label="Activo" checked={custom.active} disabled={!custom.active && active >= 20} onChange={e => patch(id, { active: e.currentTarget.checked })} />}</Group>
            {custom && !existing.has(id) && <Button color="red" variant="subtle" size="xs" onClick={() => { setDraft({ ...draft, fields: draft.fields.filter(f => f.id !== id), order: draft.order.filter(key => key !== id) }); setSelected("title"); }}>Quitar pregunta sin guardar</Button>}
          </>}
        </BuilderCard>;
      })}
    </Stack>
    <Stack className={classes.tools} gap="md"><Paper withBorder radius="lg" p="lg"><Stack gap="md"><Text fw={600}>Ticket nuevo</Text><Badge color="contrast" variant="light">{8 + active} campos visibles</Badge><Button variant="default" leftSection={<IconPlus size={16} />} disabled={active >= 20 || draft.fields.length >= 200} onClick={() => { const id = crypto.randomUUID(); setDraft({ ...draft, order: [...draft.order, id], fields: [...draft.fields, { id, label: "Nueva pregunta", type: "text", help: "", required: false, active: true, options: [] }] }); setSelected(id); }}>Agregar pregunta</Button><Button loading={save.isPending} disabled={invalid} onClick={() => save.mutate(draft)}>Guardar formulario</Button><Text size="xs" c="dimmed">Los cambios se aplican al guardar.</Text></Stack></Paper>{save.error && <Alert color="red">{save.error.message}<Button variant="subtle" onClick={() => { save.reset(); query.refetch(); }}>Recargar configuración</Button></Alert>}</Stack>
  </div></>;
}
