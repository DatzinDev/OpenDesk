import { Anchor, Button, Code, Group, Paper, Select, Table, Text, TextInput, UnstyledButton } from "@mantine/core";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { useUsers } from "@/features/users";
import { PageHeader } from "@/shared/ui";
import { auditApi, type AuditFilters } from "../api";

const fmt = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "medium" });

// Acciones registradas, en lenguaje claro.
const LABELS: Record<string, string> = {
  "login.succeeded": "Inició sesión",
  "login.denied": "Acceso denegado",
  "user.created": "Alta de usuario",
  "user.updated": "Cambio de usuario",
  "area.created": "Alta de área",
  "area.updated": "Cambio de área",
  "holiday.added": "Día festivo agregado",
  "holiday.removed": "Día festivo eliminado",
  "ticket.created": "Ticket creado",
  "ticket.assigned": "Ticket asignado",
  "ticket.proposed": "Propuesta enviada",
  "ticket.accepted": "Propuesta aceptada",
  "ticket.rejected": "Propuesta rechazada",
  "ticket.reassigned": "Ticket reasignado",
  "ticket.closed": "Ticket cerrado",
  "ticket.reopened": "Ticket reabierto",
  "ticket.status": "Estatus de seguimiento",
  "ticket.edited": "Ticket editado",
  "ticket.needs_manager": "Requiere intervención",
  "ticket.sla_warning": "Aviso de SLA",
  "ticket.reminder": "Recordatorio de compromiso",
  "ticket.commitment_overdue": "Compromiso vencido",
  "survey.answered": "Encuesta respondida",
  "settings.changed": "Configuración modificada",
  "mail.failed": "Correo no enviado",
};
const GROUPS = [
  { value: "login.", label: "Accesos" },
  { value: "user.", label: "Usuarios" },
  { value: "area.", label: "Áreas" },
  { value: "holiday.", label: "Días festivos" },
  { value: "ticket.", label: "Tickets" },
  { value: "survey.", label: "Encuestas" },
  { value: "settings.", label: "Configuración" },
  { value: "mail.", label: "Correos fallidos" },
];

export function AuditPage() {
  const { data: users = [] } = useUsers();
  const [f, setF] = useState<AuditFilters>({});
  const [open, setOpen] = useState<string | null>(null);
  const q = useInfiniteQuery({
    queryKey: ["audit", f],
    queryFn: ({ pageParam }) => auditApi.page(f, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.more ? last.items[last.items.length - 1].id : undefined),
  });
  const rows = q.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <PageHeader title="Auditoría" description="Registro de solo lectura de quién hizo qué y cuándo. Se conserva indefinidamente." />
      <Group mb="md" gap="sm" wrap="wrap" align="flex-end">
        <Select aria-label="Persona" placeholder="Cualquier persona" clearable searchable w={{ base: "100%", sm: 220 }}
          data={users.map((u) => ({ value: u.id, label: u.name }))} value={f.actor_id ?? null}
          onChange={(v) => setF({ ...f, actor_id: v ?? undefined })} />
        <Select aria-label="Tipo de evento" placeholder="Todos los eventos" clearable w={{ base: "100%", sm: 200 }}
          data={GROUPS} value={f.action ?? null} onChange={(v) => setF({ ...f, action: v ?? undefined })} />
        <TextInput type="date" aria-label="Desde" value={f.start ?? ""} onChange={(e) => setF({ ...f, start: e.currentTarget.value || undefined })} />
        <TextInput type="date" aria-label="Hasta" value={f.end ?? ""} onChange={(e) => setF({ ...f, end: e.currentTarget.value || undefined })} />
      </Group>
      <Paper withBorder radius="lg">
        <Table.ScrollContainer minWidth={760}>
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fecha</Table.Th>
                <Table.Th>Persona</Table.Th>
                <Table.Th>Acción</Table.Th>
                <Table.Th>Sobre</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((r) => (
                <Fragment key={r.id}>
                  <Table.Tr>
                    <Table.Td><Text size="sm" style={{ fontVariantNumeric: "tabular-nums" }}>{fmt.format(new Date(r.at))}</Text></Table.Td>
                    <Table.Td><Text size="sm" c={r.actor ? undefined : "dimmed"}>{r.actor ?? "Sistema"}</Text></Table.Td>
                    <Table.Td>
                      <UnstyledButton onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id}>
                        <Text size="sm" fw={500}>{LABELS[r.action] ?? r.action}</Text>
                        {Object.keys(r.data).length > 0 && <Text size="xs" c="navy.6">{open === r.id ? "Ocultar detalle" : "Ver detalle"}</Text>}
                      </UnstyledButton>
                    </Table.Td>
                    <Table.Td>
                      {r.ticket_id ? (
                        <Anchor component={Link} to={`/tickets/${r.ticket_id}`} size="sm">{r.ref}</Anchor>
                      ) : (
                        <Text size="sm">{r.ref ?? "—"}</Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                  {open === r.id && (
                    <Table.Tr>
                      <Table.Td colSpan={4}>
                        <Code block>{JSON.stringify(r.data, null, 2)}</Code>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Fragment>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        {!q.isLoading && rows.length === 0 && <Text ta="center" c="dimmed" size="sm" py="xl">No hay registros con estos filtros.</Text>}
      </Paper>
      {q.hasNextPage && (
        <Group justify="center" mt="md">
          <Button variant="default" loading={q.isFetchingNextPage} onClick={() => q.fetchNextPage()}>Cargar más</Button>
        </Group>
      )}
    </>
  );
}
