import { Button, Group, Paper, Select, Stack, Table, Text, TextInput, Title } from "@mantine/core";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAreas } from "@/features/areas";
import { useUsers } from "@/features/users";
import { PageHeader } from "@/shared/ui";
import { ActionModal, type StaffAction } from "../components/ActionModal";
import { DueLabel, ManagerFlag, PriorityBadge, StatusBadge, dateFmt } from "../components/Badges";
import { TicketDrawer } from "../components/TicketDrawer";
import { useTrackingName } from "../components/TrackingSelect";
import { useTickets } from "../hooks";
import { PROPOSAL_LABELS, STATUS_LABELS, type Status, type Ticket } from "../types";

const STATUS_OPTIONS = [
  { value: "abiertos", label: "Abiertos" },
  ...(Object.keys(STATUS_LABELS) as Status[]).map((s) => ({ value: s, label: STATUS_LABELS[s] })),
  { value: "", label: "Todos" },
];

export function InboxPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("abiertos");
  const [areaId, setAreaId] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [modal, setModal] = useState<{ ticket: Ticket; action: StaffAction } | null>(null);
  const { data: areas = [] } = useAreas();
  const { data: users = [] } = useUsers();
  const { data: pending = [] } = useTickets({ status: "pendiente" });
  const { data: tickets = [], isLoading } = useTickets({
    status,
    area_id: areaId ?? undefined,
    assignee_id: assigneeId ?? undefined,
    q: q.trim() || undefined,
  });
  const trackingName = useTrackingName();
  const areaName = (id: string) => areas.find((a) => a.id === id)?.name ?? "";
  const open = (t: Ticket) => navigate(`/tickets/${t.id}`);

  return (
    <>
      <PageHeader
        title="Bandeja"
        description="Propuestas por decidir y todos los tickets de la organización."
        action={
          <Button leftSection={<IconPlus size={16} />} onClick={() => setCreating(true)}>
            Nuevo ticket
          </Button>
        }
      />

      {pending.length > 0 && (
        <Stack gap="sm" mb="xl">
          <Title order={2} fz="md">
            Por decidir ({pending.length})
          </Title>
          {pending.map((t) => (
            <Paper key={t.id} withBorder radius="lg" p="md">
              <Group justify="space-between" wrap="wrap" gap="md">
                <Stack gap={4} style={{ flex: 1, minWidth: 240, cursor: "pointer" }} onClick={() => open(t)}>
                  <Text size="xs" c="dimmed">
                    {t.folio} en {areaName(t.area_id)}
                  </Text>
                  <Text fw={500}>{t.title}</Text>
                  {t.pending && (
                    <Text size="sm">
                      <Text span fw={500}>
                        {t.pending.actor_name} propone {PROPOSAL_LABELS[t.pending.kind as keyof typeof PROPOSAL_LABELS].toLowerCase()}
                      </Text>
                      {t.pending.data.due_at && ` para el ${dateFmt.format(new Date(t.pending.data.due_at))}`}
                      {t.pending.data.area_id && ` hacia ${areaName(t.pending.data.area_id)}`}: {t.pending.comment}
                    </Text>
                  )}
                </Stack>
                <Group gap="xs">
                  <Button variant="default" color="red" onClick={() => setModal({ ticket: t, action: "reject" })}>
                    Rechazar
                  </Button>
                  <Button onClick={() => setModal({ ticket: t, action: "accept" })}>Aceptar</Button>
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}

      <Group mb="md" gap="sm" wrap="wrap">
        <TextInput
          placeholder="Buscar por folio o título"
          leftSection={<IconSearch size={16} />}
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          w={{ base: "100%", sm: 260 }}
          aria-label="Buscar tickets"
        />
        <Select aria-label="Estado" data={STATUS_OPTIONS} value={status} onChange={(v) => setStatus(v ?? "")} w={{ base: "100%", sm: 200 }} />
        <Select
          aria-label="Área"
          placeholder="Todas las áreas"
          clearable
          data={areas.map((a) => ({ value: String(a.id), label: a.name }))}
          value={areaId}
          onChange={setAreaId}
          w={{ base: "100%", sm: 190 }}
        />
        <Select
          aria-label="Asignado"
          placeholder="Cualquier persona"
          clearable
          searchable
          data={users.filter((u) => u.role === "usuario").map((u) => ({ value: String(u.id), label: u.name }))}
          value={assigneeId}
          onChange={setAssigneeId}
          w={{ base: "100%", sm: 200 }}
        />
      </Group>

      <Paper radius="lg" withBorder>
        <Table.ScrollContainer minWidth={820}>
          <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Ticket</Table.Th>
                <Table.Th>Área</Table.Th>
                <Table.Th>Asignado</Table.Th>
                <Table.Th>Estado</Table.Th>
                <Table.Th>Plazo</Table.Th>
                <Table.Th>Prioridad</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tickets.map((t) => (
                <Table.Tr key={t.id} onClick={() => open(t)} style={{ cursor: "pointer" }} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && open(t)}>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {t.folio}
                    </Text>
                    <Text size="sm" fw={500}>
                      {t.title}
                    </Text>
                    <ManagerFlag ticket={t} />
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{areaName(t.area_id)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{t.assignee_name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <StatusBadge ticket={t} />
                    {t.status_id && (
                      <Text size="xs" c="dimmed" mt={4}>
                        {trackingName(t.status_id)}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <DueLabel ticket={t} />
                  </Table.Td>
                  <Table.Td>
                    <PriorityBadge priority={t.priority} />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        {!isLoading && tickets.length === 0 && (
          <Text ta="center" c="dimmed" size="sm" py="xl">
            No hay tickets con estos filtros.
          </Text>
        )}
      </Paper>

      <TicketDrawer opened={creating} onClose={() => setCreating(false)} />
      <ActionModal ticket={modal?.ticket ?? null} action={modal?.action ?? null} onClose={() => setModal(null)} />
    </>
  );
}
