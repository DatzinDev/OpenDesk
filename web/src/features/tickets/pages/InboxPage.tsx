import { ActionIcon, Alert, Badge, Button, Group, Loader, Menu, Pagination, Paper, Select, Stack, Table, Text, TextInput, ThemeIcon, Title, Tooltip } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconAlertTriangle, IconArrowUpRight, IconCheck, IconClock, IconDotsVertical, IconEye, IconInbox, IconPlus, IconSearch, IconUsers } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAreas } from "@/features/areas";
import { useUsers } from "@/features/users";
import { useTicketForm } from "@/features/settings";
import { PageHeader } from "@/shared/ui";
import { ActionModal, type StaffAction } from "../components/ActionModal";
import { DueLabel, PriorityBadge, StatusBadge, dateFmt } from "../components/Badges";
import { TicketDrawer } from "../components/TicketDrawer";
import { useTrackingName } from "../components/TrackingSelect";
import { useTicketPage, useTickets } from "../hooks";
import { pageWithinTotal } from "../views";
import { ticketsApi } from "../api";
import { PROPOSAL_LABELS, STATUS_LABELS, type Priority, type Status, type Ticket } from "../types";
import classes from "./TicketViews.module.css";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = [{ value: "abiertos", label: "Abiertos" }, ...(Object.keys(STATUS_LABELS) as Status[]).map(value => ({ value, label: STATUS_LABELS[value] })), { value: "", label: "Todos los estados" }];

export function InboxPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("abiertos");
  const [areaId, setAreaId] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority | null>(null);
  const [q, setQ] = useState("");
  const [search] = useDebouncedValue(q, 250);
  const [creating, setCreating] = useState(false);
  const [allProposals, setAllProposals] = useState(false);
  const [modal, setModal] = useState<{ ticket: Ticket; action: StaffAction } | null>(null);
  const { data: areas = [] } = useAreas();
  const { data: users = [] } = useUsers();
  const pendingQuery = useTickets({ status: "pendiente" });
  const pending = pendingQuery.data ?? [];
  const overview = useQuery({ queryKey: ["tickets", "overview"], queryFn: ticketsApi.overview, refetchInterval: 60_000 });
  const { data: form } = useTicketForm();
  const filters = { status, area_id: areaId ?? undefined, assignee_id: assigneeId ?? undefined, priority: priority ?? undefined, q: search.trim() || undefined };
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [status, areaId, assigneeId, priority, search]);
  const query = useTicketPage(filters, page, PAGE_SIZE);
  const tickets = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  useEffect(() => { if (query.data) setPage(current => pageWithinTotal(current, PAGE_SIZE, total, query.isPlaceholderData)); }, [query.data, query.isPlaceholderData, total]);
  const trackingName = useTrackingName();
  const areaName = (id: string) => areas.find(a => a.id === id)?.name ?? "";
  const open = (t: Ticket) => navigate(`/tickets/${t.id}`, { state: { ticketIds: tickets.map(ticket => ticket.id) } });
  const metrics = [
    { label: "Pendientes por decidir", value: overview.data?.pending, icon: IconInbox, color: "orange" },
    { label: "En seguimiento", value: overview.data?.tracking, icon: IconCheck, color: "teal" },
    { label: "Plazos en riesgo", value: overview.data?.risk, icon: IconClock, color: "orange", hint: overview.data ? `${overview.data.overdue} vencidos` : undefined },
    { label: "Requieren intervención", value: overview.data?.intervention, icon: IconAlertTriangle, color: "contrast" },
  ];
  return <Stack gap="md">
    <PageHeader title="Bandeja" action={<Group><Button leftSection={<IconPlus size={16} />} onClick={() => setCreating(true)}>Nuevo ticket</Button></Group>} />
    <div className={classes.metrics}>{metrics.map(metric => <Paper key={metric.label} withBorder radius="lg" className={classes.metric}><Group align="flex-start" wrap="nowrap" gap="md"><ThemeIcon color={metric.color} variant="light" size={40} radius="md"><metric.icon size={21} stroke={1.6} /></ThemeIcon><div><Text size="sm" fw={500}>{metric.label}</Text><Text fz={30} fw={650} lh={1.3} style={{ fontVariantNumeric: "tabular-nums" }}>{metric.value ?? "—"}</Text>{metric.hint && <Text size="xs" c="dimmed">{metric.hint}</Text>}</div></Group></Paper>)}</div>
    {overview.isError && <Alert color="red">No se pudieron cargar los indicadores. <Button variant="subtle" size="xs" onClick={() => overview.refetch()}>Reintentar</Button></Alert>}
    {pendingQuery.isError && <Alert color="red">No se pudieron cargar las propuestas. <Button variant="subtle" size="xs" onClick={() => pendingQuery.refetch()}>Reintentar</Button></Alert>}
    {pending.length > 0 && <Paper withBorder radius="lg" p="md"><Group justify="space-between" mb="md"><Group gap="sm"><ThemeIcon size={28} radius="sm" color="orange" variant="light"><IconClock size={17} /></ThemeIcon><Title order={2} fz="md">Propuestas por decidir <Text span c="dimmed" fw={400}>({pending.length})</Text></Title></Group>{pending.length > 3 && <Button variant="subtle" size="xs" onClick={() => setAllProposals(!allProposals)}>{allProposals ? "Mostrar menos" : `Ver todas (${pending.length})`}</Button>}</Group><div className={classes.proposals}>{(allProposals ? pending : pending.slice(0, 3)).map(t => <Stack key={t.id} gap="sm" p="md" style={{ border: "1px solid var(--mantine-color-gray-2)", borderRadius: 10 }}><Group gap="xs"><Text size="xs" c="dimmed">{t.folio}</Text><Badge color="navy" variant="light" radius="sm">{areaName(t.area_id)}</Badge></Group><Button variant="transparent" justify="flex-start" p={0} h="auto" onClick={() => open(t)} style={{ whiteSpace: "normal", textAlign: "left" }}>{t.title}</Button><Text size="sm" fw={500}>{PROPOSAL_LABELS[t.pending?.kind as keyof typeof PROPOSAL_LABELS] ?? "Propuesta"}</Text><Text size="xs" c="dimmed" lineClamp={2}>{t.pending?.actor_name}{t.pending?.data.due_at ? ` · ${dateFmt.format(new Date(t.pending.data.due_at))}` : ""}{t.pending?.data.area_id ? ` · ${areaName(t.pending.data.area_id)}` : ""}{t.pending?.comment ? `: ${t.pending.comment}` : ""}</Text><Group grow mt="auto"><Button variant="default" size="sm" onClick={() => setModal({ ticket: t, action: "reject" })}>Rechazar</Button><Button size="sm" onClick={() => setModal({ ticket: t, action: "accept" })}>Aceptar</Button></Group></Stack>)}</div></Paper>}
    <div className={classes.filters}><TextInput placeholder="Buscar por folio, título o cliente…" aria-label="Buscar en la bandeja" leftSection={<IconSearch size={16} />} value={q} onChange={e => setQ(e.currentTarget.value)} /><Select aria-label="Estado" data={STATUS_OPTIONS} value={status} onChange={value => setStatus(value ?? "")} /><Select aria-label="Área" placeholder="Todas las áreas" clearable data={areas.map(a => ({ value: a.id, label: a.name }))} value={areaId} onChange={setAreaId} /><Select aria-label="Prioridad" placeholder="Todas las prioridades" clearable data={form?.system.find(f => f.id === "priority")?.options.map(o => ({ value: o.id, label: o.label })) ?? []} value={priority} onChange={value => setPriority(value as Priority | null)} /><Select aria-label="Asignado" placeholder="Cualquier persona" clearable searchable data={users.filter(u => u.role === "usuario").map(u => ({ value: u.id, label: u.name }))} value={assigneeId} onChange={setAssigneeId} /></div>
    <Paper withBorder radius="lg" style={{ overflow: "hidden" }}>{query.isError ? <Alert color="red" m="md">No se pudieron cargar los tickets. <Button variant="subtle" size="xs" onClick={() => query.refetch()}>Reintentar</Button></Alert> : <><Table.ScrollContainer minWidth={1120}><Table highlightOnHover verticalSpacing={10} horizontalSpacing="md"><Table.Thead><Table.Tr>{["Ticket", "Título", "Área", "Asignado", "Estado", "Plazo", "Prioridad", "Última actividad", "Acciones"].map(label => <Table.Th key={label}>{label}</Table.Th>)}</Table.Tr></Table.Thead><Table.Tbody>{tickets.map(t => <Table.Tr key={t.id} tabIndex={0} onClick={() => open(t)} onKeyDown={e => { if (e.target === e.currentTarget && e.key === "Enter") open(t); }} style={{ cursor: "pointer" }}><Table.Td><Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>{t.folio}</Text></Table.Td><Table.Td><Group gap={6} wrap="nowrap">{t.needs_manager && <Tooltip label="Requiere intervención del Gestor"><IconAlertTriangle size={16} color="var(--mantine-color-red-7)" style={{ flexShrink: 0 }} /></Tooltip>}<Text className={classes.tableTitle} size="sm" fw={500} lineClamp={2}>{t.title}</Text></Group></Table.Td><Table.Td><Text size="xs">{areaName(t.area_id)}</Text></Table.Td><Table.Td><Text size="xs">{t.assignee_name}</Text></Table.Td><Table.Td><StatusBadge ticket={t} />{t.status_id && <Text size="xs" c="dimmed" mt={4}>{trackingName(t.status_id)}</Text>}</Table.Td><Table.Td><DueLabel ticket={t} /></Table.Td><Table.Td><PriorityBadge priority={t.priority} /></Table.Td><Table.Td><Text size="xs" c="dimmed">{dateFmt.format(new Date(t.last_activity_at ?? t.created_at))}</Text></Table.Td><Table.Td onClick={e => e.stopPropagation()}><Group gap={4} wrap="nowrap"><Button variant="default" size="compact-xs" onClick={() => open(t)}>Ver</Button><Menu position="bottom-end" withinPortal><Menu.Target><ActionIcon variant="default" aria-label={`Acciones de ${t.folio}`}><IconDotsVertical size={16} /></ActionIcon></Menu.Target><Menu.Dropdown><Menu.Item leftSection={<IconEye size={15} />} onClick={() => open(t)}>Abrir ticket</Menu.Item>{t.pending && <><Menu.Item leftSection={<IconCheck size={15} />} onClick={() => setModal({ ticket: t, action: "accept" })}>Aceptar propuesta</Menu.Item><Menu.Item onClick={() => setModal({ ticket: t, action: "reject" })}>Rechazar propuesta</Menu.Item></>}{t.status !== "cerrado" ? <><Menu.Item leftSection={<IconUsers size={15} />} onClick={() => setModal({ ticket: t, action: "reassign" })}>Reasignar</Menu.Item><Menu.Item onClick={() => setModal({ ticket: t, action: "close" })}>Cerrar ticket</Menu.Item></> : <Menu.Item leftSection={<IconArrowUpRight size={15} />} onClick={() => setModal({ ticket: t, action: "reopen" })}>Reabrir</Menu.Item>}</Menu.Dropdown></Menu></Group></Table.Td></Table.Tr>)}</Table.Tbody></Table></Table.ScrollContainer>{query.isLoading ? <Group justify="center" py="xl"><Loader size="sm" /><Text size="sm" c="dimmed">Cargando tickets…</Text></Group> : tickets.length === 0 && <Text ta="center" c="dimmed" size="sm" py="xl">No hay tickets con estos filtros.</Text>}<Group justify="space-between" p="md" style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}><Text size="xs" c="dimmed">{total ? `${Math.min((page - 1) * PAGE_SIZE + 1, total)}–${Math.min(page * PAGE_SIZE, total)} de ${total} tickets` : "0 tickets"}</Text>{pages > 1 && <Pagination total={pages} value={page} onChange={setPage} size="sm" />}</Group></>}</Paper>
    <TicketDrawer opened={creating} onClose={() => setCreating(false)} /><ActionModal ticket={modal?.ticket ?? null} action={modal?.action ?? null} onClose={() => setModal(null)} />
  </Stack>;
}
