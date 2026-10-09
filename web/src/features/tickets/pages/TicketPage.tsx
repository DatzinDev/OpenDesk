import { ActionIcon, Anchor, Avatar, Badge, Button, Group, Loader, Paper, Progress, Stack, Tabs, Text, Title, Tooltip } from "@mantine/core";
import { IconArrowLeft, IconChevronLeft, IconChevronRight, IconCircleCheck, IconPencil, IconPlus, IconRefresh, IconUsers } from "@tabler/icons-react";
import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useAreas } from "@/features/areas";
import { useMe } from "@/features/auth";
import { SurveyCard } from "@/features/surveys";
import { useTicketForm } from "@/features/settings";
import { ActionModal, type StaffAction } from "../components/ActionModal";
import { DueLabel, ManagerFlag, PriorityBadge, StatusBadge, dateFmt } from "../components/Badges";
import { EditTicketDrawer } from "../components/EditTicketDrawer";
import { ProposalDrawer } from "../components/ProposalDrawer";
import { TicketTimeline } from "../components/TicketTimeline";
import { TicketFiles } from "../components/TicketFiles";
import { TrackingSelect, useTrackingName } from "../components/TrackingSelect";
import { useTicket } from "../hooks";
import { PROPOSAL_LABELS, type ProposalKind } from "../types";
import classes from "./TicketViews.module.css";

const KINDS: ProposalKind[] = ["update", "escalate", "reassign", "close"];
const hours = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 });
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className={classes.field}><Text size="sm" c="dimmed">{label}</Text><Text size="sm" component="div">{children}</Text></div>;
}

export function TicketPage() {
  const id = useParams().id ?? "";
  const location = useLocation();
  const ids = (location.state as { ticketIds?: string[] } | null)?.ticketIds ?? [];
  const index = ids.indexOf(id);
  const { data: me } = useMe();
  const { data: t, isError } = useTicket(id);
  const { data: areas = [] } = useAreas();
  const form = useTicketForm();
  const trackingName = useTrackingName();
  const [action, setAction] = useState<StaffAction | null>(null);
  const [kind, setKind] = useState<ProposalKind | null>(null);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<string | null>("detail");
  const staff = me?.role === "admin" || me?.role === "gestor";
  const back = staff ? "/bandeja" : "/mis-actividades";
  if (isError) return <Text c="dimmed">No encontramos este ticket o no tienes acceso a él.</Text>;
  if (!t || !me) return <Group justify="center" py="xl"><Loader size="sm" /><Text size="sm" c="dimmed">Cargando ticket…</Text></Group>;
  const closed = t.status === "cerrado";
  const mayPropose = !staff && t.assignee_id === me.id && !closed;
  const mayEdit = !closed && (staff || t.assignee_id === me.id);
  const createdBy = t.names[t.created_by] ?? "";
  const area = areas.find(a => a.id === t.area_id)?.name;
  const fileCount = t.events.reduce((count, event) => count + event.attachments.length, 0);
  const deadline = t.deadline;
  const coreLabel = (id: string, fallback: string) => form.data?.system.find(f => f.id === id)?.label ?? fallback;
  const elapsed = deadline ? `${hours.format(deadline.elapsed_hours)} h` : "—";
  const total = deadline ? `${hours.format(deadline.total_hours)} h` : "—";
  const percent = deadline ? Math.round(deadline.percent) : 0;
  const stateColor = deadline?.overdue ? "red" : percent >= (deadline?.warning_percent ?? 80) ? "orange" : "contrast";
  const information = <Paper withBorder radius="lg" className={classes.info}>
    <Title order={2} fz="md" mb="xs">{coreLabel("description", "Descripción")}</Title><Text size="sm" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{t.description || "Sin descripción."}</Text>
    <div className={classes.section}><Title order={2} fz="md" mb="sm">Información</Title>{(t.client_name || t.client_email) && <Field label="Cliente">{t.client_name || t.client_email}{t.client_name && t.client_email && <Text size="xs" c="dimmed">{t.client_email}</Text>}</Field>}<Field label={coreLabel("area_id", "Área")}>{area}</Field><Field label={coreLabel("priority", "Prioridad")}><PriorityBadge priority={t.priority} /></Field>{form.data?.fields.filter(f => t.custom_values?.[f.id] != null).map(f => { const value = t.custom_values[f.id]; const text = f.type === "select" ? f.options.find(o => o.id === value)?.label ?? String(value) : f.type === "boolean" ? value ? "Sí" : "No" : String(value); return <Field key={f.id} label={`${f.label}${!f.active ? " (archivado)" : ""}`}>{text}</Field>; })}</div>
    <div className={classes.section}><Title order={2} fz="md" mb="sm">Asignación</Title><Field label={coreLabel("assignee_id", "Asignado a")}><Group gap="xs" wrap="nowrap"><Avatar name={t.assignee_name ?? undefined} color="initials" size={28} /><Text size="sm" fw={500}>{t.assignee_name}</Text></Group></Field>{createdBy && <Field label="Creado por">{createdBy}</Field>}</div>
    <div className={classes.section}><Title order={2} fz="md" mb="sm">Fechas y plazo</Title><Field label="Creación">{dateFmt.format(new Date(t.created_at))}</Field><Field label={t.committed ? "Compromiso" : "Vencimiento SLA"}>{dateFmt.format(new Date(t.due_at))}</Field><Field label="Última actividad">{dateFmt.format(new Date(t.last_activity_at ?? t.created_at))}</Field>{t.closed_at && <Field label="Cierre">{dateFmt.format(new Date(t.closed_at))}</Field>}</div>
  </Paper>;
  const followup = <Paper withBorder radius="lg" className={classes.timeline}><Group justify="space-between" mb="lg"><Title order={2} fz="md">Seguimiento</Title>{mayPropose && <Button size="compact-sm" leftSection={<IconPlus size={14} />} disabled={!!t.pending} onClick={() => setKind("update")}>Agregar actualización</Button>}</Group><TicketTimeline ticket={t} /></Paper>;
  const side = <Stack gap="md" className={classes.aside}>
    <Paper withBorder radius="lg" p="md"><Title order={2} fz="md" mb="sm">Estado actual</Title><StatusBadge ticket={t} />{staff ? <div style={{ marginTop: 12 }}><TrackingSelect ticket={t} label={false} /></div> : t.status_id && <Text size="sm" mt="sm" c="contrast.7">{trackingName(t.status_id)}</Text>}</Paper>
    {(staff || mayPropose) && <Paper withBorder radius="lg" p="md"><Title order={2} fz="md" mb="sm">Acciones</Title><Stack gap="xs">{staff && <>{t.pending && <><Button onClick={() => setAction("accept")}>Aceptar propuesta</Button><Button variant="default" color="red" onClick={() => setAction("reject")}>Rechazar propuesta</Button></>}{!closed ? <><Button variant="default" leftSection={<IconUsers size={16} />} onClick={() => setAction("reassign")}>Reasignar</Button><Button variant="default" leftSection={<IconCircleCheck size={16} />} onClick={() => setAction("close")}>Cerrar ticket</Button></> : <Button variant="default" leftSection={<IconRefresh size={16} />} onClick={() => setAction("reopen")}>Reabrir ticket</Button>}</>}{mayPropose && <>{KINDS.map(k => <Button key={k} variant={k === "update" ? "filled" : "default"} disabled={!!t.pending} onClick={() => setKind(k)}>{PROPOSAL_LABELS[k]}</Button>)}{t.pending && <Text size="xs" c="dimmed">Propuesta en revisión.</Text>}</>}</Stack></Paper>}
    <Paper withBorder radius="lg" p="md"><Title order={2} fz="md" mb="sm">{t.committed ? "Compromiso" : "SLA"}</Title>{!closed && <div style={{ marginBottom: 12 }}><DueLabel ticket={t} /></div>}<Field label={t.committed ? "Transcurrido" : "Horas hábiles"}><Text span c={deadline?.overdue ? "red.7" : undefined} fw={500}>{elapsed}</Text></Field><Field label="Plazo total">{total}</Field><Field label="Consumido"><Text span fw={600}>{percent} %</Text></Field><Progress value={Math.min(percent, 100)} color={stateColor} size="sm" radius="xl" mt="sm" aria-label="Porcentaje del plazo consumido" />{closed && <Text size="xs" c="dimmed" mt="sm">Al momento del cierre.</Text>}</Paper>
    <Paper withBorder radius="lg" p="md"><Title order={2} fz="md" mb="sm">Archivos adjuntos <Text span c="dimmed" fw={400}>({fileCount})</Text></Title><TicketFiles events={t.events} /></Paper>
    {closed && <SurveyCard ticketId={t.id} />}
  </Stack>;
  return <Stack gap="md"><Group justify="space-between"><Anchor component={Link} to={back} size="sm" c="navy.7"><Group gap={6}><IconArrowLeft size={16} />{staff ? "Volver a Bandeja" : "Volver a Mis actividades"}</Group></Anchor>{index >= 0 && <Group gap="xs">{index > 0 && <Tooltip label="Ticket anterior de esta página"><ActionIcon component={Link} to={`/tickets/${ids[index - 1]}`} state={location.state} variant="default" size="lg" aria-label="Ticket anterior"><IconChevronLeft size={18} /></ActionIcon></Tooltip>}{index < ids.length - 1 && <Tooltip label="Ticket siguiente de esta página"><ActionIcon component={Link} to={`/tickets/${ids[index + 1]}`} state={location.state} variant="default" size="lg" aria-label="Ticket siguiente"><IconChevronRight size={18} /></ActionIcon></Tooltip>}</Group>}</Group>
    <Paper withBorder radius="lg" className={classes.ticketHeader}><Group justify="space-between" align="flex-start"><Stack gap="sm" style={{ flex: 1, minWidth: 0 }}><Group gap="sm"><Text size="sm" c="dimmed">{t.folio}</Text><ManagerFlag ticket={t} /><PriorityBadge priority={t.priority} /></Group><Title order={1} fz={{ base: 22, md: 27 }} lh={1.25} style={{ overflowWrap: "anywhere" }}>{t.title}</Title><Group gap="xs">{createdBy && <><Avatar name={createdBy} color="initials" size={32} /><Text size="sm" fw={500}>{createdBy}</Text></>}<Badge color="navy" variant="light" radius="sm">{area}</Badge><Text size="xs" c="dimmed">Creado el {dateFmt.format(new Date(t.created_at))}</Text></Group></Stack>{mayEdit && <Button variant="default" size="sm" leftSection={<IconPencil size={16} />} onClick={() => setEditing(true)}>Editar</Button>}</Group><Tabs value={tab} onChange={setTab} className={classes.tabs}><Tabs.List><Tabs.Tab value="detail">Detalle</Tabs.Tab><Tabs.Tab value="files">Archivos ({fileCount})</Tabs.Tab></Tabs.List></Tabs></Paper>
    {tab === "detail" ? <div className={classes.detailGrid}>{information}{followup}{side}</div> : <Paper withBorder radius="lg" p="lg"><Title order={2} fz="md" mb="md">Archivos adjuntos</Title><TicketFiles events={t.events} /></Paper>}
    <ActionModal ticket={action ? t : null} action={action} onClose={() => setAction(null)} /><EditTicketDrawer ticket={t} opened={editing} onClose={() => setEditing(false)} /><ProposalDrawer ticket={kind ? t : null} kind={kind} onClose={() => setKind(null)} />
  </Stack>;
}
