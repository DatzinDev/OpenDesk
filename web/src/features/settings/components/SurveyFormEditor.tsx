import { Alert, Badge, Button, Checkbox, Group, Paper, Rating, Stack, Switch, Text, Textarea, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import { CSAT_ID, settingsApi, type StarQuestion, type SurveyDefinition } from "../api";
import { BuilderCard } from "./BuilderCard";
import { UnsavedChanges } from "./UnsavedChanges";
import { hasDraftChanges } from "../editor";
import classes from "./Builder.module.css";

export function SurveyFormEditor() {
  const query = useQuery({ queryKey: ["survey-form"], queryFn: settingsApi.surveyForm });
  const qc = useQueryClient();
  const [draft, setDraft] = useState<SurveyDefinition | null>(null);
  const [selected, setSelected] = useState(CSAT_ID);
  useEffect(() => { if (query.data) setDraft(structuredClone(query.data)); }, [query.data]);
  const save = useMutation({ mutationFn: settingsApi.saveSurveyForm, onSuccess: data => { qc.setQueryData(["survey-form"], data); notifications.show({ message: "Encuesta actualizada." }); } });
  if (query.isError) return <Alert color="red">No se pudo cargar la encuesta. <Button variant="subtle" onClick={() => query.refetch()}>Reintentar</Button></Alert>;
  if (!draft) return null;
  const existing = new Set(query.data?.questions.map(q => q.id));
  const patch = (id: string, changes: Partial<StarQuestion>) => setDraft({ ...draft, questions: draft.questions.map(q => q.id === id ? { ...q, ...changes } : q) });
  const move = (index: number, offset: number) => { const questions = [...draft.questions]; [questions[index], questions[index + offset]] = [questions[index + offset], questions[index]]; setDraft({ ...draft, questions }); };
  return <><UnsavedChanges dirty={hasDraftChanges(draft, query.data)} /><div className={classes.layout}><Stack className={classes.canvas} gap="md">{draft.questions.map((q, index) => <BuilderCard key={q.id} label={q.label} selected={selected === q.id} onSelect={() => setSelected(q.id)} index={index} total={draft.questions.length} onMove={offset => move(index, offset)} badge={q.id === CSAT_ID ? "Satisfacción general · CSAT" : !q.active ? "Inactiva" : undefined}>
    {selected === q.id && <><Textarea label="Pregunta" autosize minRows={2} maxLength={300} value={q.label} onChange={e => patch(q.id, { label: e.currentTarget.value })} /><TextInput label="Ayuda (opcional)" maxLength={200} value={q.help} onChange={e => patch(q.id, { help: e.currentTarget.value })} /></>}
    <Text fw={500}>{q.label.replaceAll("{titulo}", "Solicitud de ejemplo")}{q.required ? " *" : ""}</Text>{q.help && <Text size="sm" c="dimmed">{q.help}</Text>}<Rating count={5} size="xl" color="orange" value={0} readOnly /><Group justify="space-between"><Text size="xs" c="dimmed">1 estrella</Text><Text size="xs" c="dimmed">5 estrellas</Text></Group>
    {selected === q.id && <><Group justify="space-between"><Checkbox label="Obligatoria" checked={q.required} disabled={q.id === CSAT_ID} onChange={e => patch(q.id, { required: e.currentTarget.checked })} /><Switch label="Activa" checked={q.active} disabled={q.id === CSAT_ID} onChange={e => patch(q.id, { active: e.currentTarget.checked })} /></Group>{!existing.has(q.id) && <Button color="red" variant="subtle" size="xs" onClick={() => { setDraft({ ...draft, questions: draft.questions.filter(x => x.id !== q.id) }); setSelected(CSAT_ID); }}>Quitar pregunta sin guardar</Button>}</>}
  </BuilderCard>)}</Stack><Stack className={classes.tools} gap="md"><Paper withBorder radius="lg" p="lg"><Stack gap="md"><Text fw={600}>Encuesta por correo</Text><Badge color="contrast" variant="light">{draft.questions.filter(q => q.active).length} preguntas · 5 estrellas</Badge><Button variant="default" leftSection={<IconPlus size={16} />} onClick={() => { const id = crypto.randomUUID(); setDraft({ ...draft, questions: [...draft.questions, { id, label: "Nueva pregunta", help: "", required: true, active: true }] }); setSelected(id); }}>Agregar pregunta</Button><Button loading={save.isPending} disabled={draft.questions.some(q => !q.label.trim())} onClick={() => save.mutate(draft)}>Guardar encuesta</Button><Text size="xs" c="dimmed">Los cambios se aplican a los próximos envíos.</Text><Text size="xs" c="dimmed">Puedes usar {"{titulo}"} para incluir el título del ticket. CSAT usa la pregunta de satisfacción general.</Text></Stack></Paper>{save.error && <Alert color="red">{save.error.message}<Button variant="subtle" onClick={() => { save.reset(); query.refetch(); }}>Recargar configuración</Button></Alert>}</Stack></div></>;
}
