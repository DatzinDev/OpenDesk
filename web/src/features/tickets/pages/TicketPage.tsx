import { Anchor, Button, Grid, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAreas } from "@/features/areas";
import { useMe } from "@/features/auth";
import { SurveyCard } from "@/features/surveys";
import { ActionModal, type StaffAction } from "../components/ActionModal";
import { DueLabel, ManagerFlag, PriorityBadge, StatusBadge, dateFmt } from "../components/Badges";
import { ProposalDrawer } from "../components/ProposalDrawer";
import { TicketTimeline } from "../components/TicketTimeline";
import { TrackingSelect, useTrackingName } from "../components/TrackingSelect";
import { useTicket } from "../hooks";
import { PROPOSAL_LABELS, type ProposalKind } from "../types";

const KINDS: ProposalKind[] = ["update", "escalate", "reassign", "close"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="sm" component="div">
        {children}
      </Text>
    </div>
  );
}

export function TicketPage() {
  const id = useParams().id ?? "";
  const { data: me } = useMe();
  const { data: t, isError } = useTicket(id);
  const { data: areas = [] } = useAreas();
  const trackingName = useTrackingName();
  const [action, setAction] = useState<StaffAction | null>(null);
  const [kind, setKind] = useState<ProposalKind | null>(null);
  const staff = me?.role === "admin" || me?.role === "gestor";
  const back = staff ? "/bandeja" : "/mis-actividades";

  if (isError) return <Text c="dimmed">No encontramos este ticket o no tienes acceso a él.</Text>;
  if (!t || !me) return null;
  const closed = t.status === "cerrado";

  return (
    <Stack gap="lg">
      <Anchor component={Link} to={back} size="sm" c="dimmed">
        <Group gap={4}>
          <IconArrowLeft size={14} />
          {staff ? "Bandeja" : "Mis actividades"}
        </Group>
      </Anchor>

      <Stack gap={6}>
        <Text size="sm" c="dimmed">
          {t.folio}
        </Text>
        <Title order={1} fz="xl">
          {t.title}
        </Title>
        <Group gap="sm">
          <StatusBadge ticket={t} />
          <PriorityBadge priority={t.priority} />
          <ManagerFlag ticket={t} />
        </Group>
      </Stack>

      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 8 }} order={{ base: 2, md: 1 }}>
          <Stack gap="lg">
            <Paper withBorder radius="lg" p="lg">
              <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                {t.description}
              </Text>
            </Paper>
            <Paper withBorder radius="lg" p="lg">
              <Title order={2} fz="md" mb="md">
                Seguimiento
              </Title>
              <TicketTimeline ticket={t} />
            </Paper>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }} order={{ base: 1, md: 2 }}>
          <Stack gap="lg">
            <Paper withBorder radius="lg" p="lg">
              <Stack gap="sm">
                {staff ? (
                  <TrackingSelect ticket={t} />
                ) : (
                  <Field label="Estatus de seguimiento">{trackingName(t.status_id) ?? "Sin estatus"}</Field>
                )}
                <Field label="Plazo vigente">
                  <DueLabel ticket={t} />
                </Field>
                <Field label="Área">{areas.find((a) => a.id === t.area_id)?.name}</Field>
                <Field label="Asignado a">{t.assignee_name}</Field>
                {(t.client_name || t.client_email) && (
                  <Field label="Cliente">
                    {t.client_name}
                    {t.client_email && (
                      <Text size="xs" c="dimmed">
                        {t.client_email}
                      </Text>
                    )}
                  </Field>
                )}
                <Field label="Creado">{dateFmt.format(new Date(t.created_at))}</Field>
                {t.closed_at && <Field label="Cerrado">{dateFmt.format(new Date(t.closed_at))}</Field>}
              </Stack>
            </Paper>

            {closed && <SurveyCard ticketId={t.id} />}

            {staff && (
              <Stack gap="xs">
                {t.pending && (
                  <Group grow gap="xs">
                    <Button variant="default" onClick={() => setAction("reject")}>
                      Rechazar
                    </Button>
                    <Button onClick={() => setAction("accept")}>Aceptar</Button>
                  </Group>
                )}
                {!closed && (
                  <Group grow gap="xs">
                    <Button variant="light" onClick={() => setAction("reassign")}>
                      Reasignar
                    </Button>
                    <Button variant="light" onClick={() => setAction("close")}>
                      Cerrar
                    </Button>
                  </Group>
                )}
                {closed && (
                  <Button variant="light" onClick={() => setAction("reopen")}>
                    Reabrir
                  </Button>
                )}
              </Stack>
            )}

            {!staff && t.assignee_id === me.id && !closed && (
              <Stack gap="xs">
                {t.pending && (
                  <Text size="sm" c="dimmed">
                    Tu propuesta está en revisión. Podrás enviar otra cuando el Gestor decida.
                  </Text>
                )}
                {KINDS.map((k) => (
                  <Button key={k} variant={k === "update" ? "filled" : "light"} disabled={!!t.pending} onClick={() => setKind(k)}>
                    {PROPOSAL_LABELS[k]}
                  </Button>
                ))}
              </Stack>
            )}
          </Stack>
        </Grid.Col>
      </Grid>

      <ActionModal ticket={action ? t : null} action={action} onClose={() => setAction(null)} />
      <ProposalDrawer ticket={kind ? t : null} kind={kind} onClose={() => setKind(null)} />
    </Stack>
  );
}
