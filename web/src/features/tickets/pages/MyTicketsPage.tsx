import { ActionIcon, Group, Menu, Paper, SegmentedControl, Stack, Text } from "@mantine/core";
import { IconDots } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/shared/ui";
import { DueLabel, ManagerFlag, PriorityBadge, StatusBadge } from "../components/Badges";
import { ProposalDrawer } from "../components/ProposalDrawer";
import { useTrackingName } from "../components/TrackingSelect";
import { useTickets } from "../hooks";
import { PROPOSAL_LABELS, type ProposalKind, type Ticket } from "../types";

const KINDS: ProposalKind[] = ["update", "escalate", "reassign", "close"];

export function MyTicketsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("abiertos");
  const [proposal, setProposal] = useState<{ ticket: Ticket; kind: ProposalKind } | null>(null);
  const trackingName = useTrackingName();
  const { data: tickets = [], isLoading } = useTickets({ status });

  return (
    <>
      <PageHeader
        title="Mis actividades"
        description="Tus tickets, del plazo más próximo al más lejano."
        action={
          <SegmentedControl
            value={status}
            onChange={setStatus}
            data={[
              { value: "abiertos", label: "Abiertos" },
              { value: "cerrado", label: "Cerrados" },
            ]}
          />
        }
      />
      <Stack gap="sm">
        {tickets.map((t) => (
          <Paper key={t.id} withBorder radius="lg" p="md">
            <Group justify="space-between" wrap="nowrap" align="flex-start">
              <Stack gap={6} style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => navigate(`/tickets/${t.id}`)}>
                <Group gap="xs">
                  <Text size="xs" c="dimmed">
                    {t.folio}
                  </Text>
                  <PriorityBadge priority={t.priority} />
                </Group>
                <Text fw={500}>{t.title}</Text>
                <Group gap="md" wrap="wrap">
                  <StatusBadge ticket={t} />
                  {t.status_id && (
                    <Text size="sm" c="dimmed">
                      {trackingName(t.status_id)}
                    </Text>
                  )}
                  <DueLabel ticket={t} />
                  <ManagerFlag ticket={t} />
                </Group>
              </Stack>
              {t.status !== "cerrado" && (
                <Menu position="bottom-end" withinPortal>
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray" aria-label="Acciones del ticket">
                      <IconDots size={18} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {t.status === "pendiente" && <Menu.Label>Hay una propuesta en revisión</Menu.Label>}
                    {KINDS.map((k) => (
                      <Menu.Item key={k} disabled={t.status === "pendiente"} onClick={() => setProposal({ ticket: t, kind: k })}>
                        {PROPOSAL_LABELS[k]}
                      </Menu.Item>
                    ))}
                  </Menu.Dropdown>
                </Menu>
              )}
            </Group>
          </Paper>
        ))}
        {!isLoading && tickets.length === 0 && (
          <Paper withBorder radius="lg" p="xl">
            <Text ta="center" c="dimmed" size="sm">
              {status === "abiertos" ? "No tienes tickets abiertos. Cuando te asignen uno aparecerá aquí." : "Aún no tienes tickets cerrados."}
            </Text>
          </Paper>
        )}
      </Stack>
      <ProposalDrawer ticket={proposal?.ticket ?? null} kind={proposal?.kind ?? null} onClose={() => setProposal(null)} />
    </>
  );
}
