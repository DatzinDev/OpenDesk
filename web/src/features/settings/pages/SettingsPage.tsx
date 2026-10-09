import { Alert, Button, Group, NumberInput, Paper, Select, Stack, Text, TextInput, Textarea, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconMailForward } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useMe } from "@/features/auth";
import { PageHeader } from "@/shared/ui";
import { settingsApi, type Functional, type Technical } from "../api";

const ZONES = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? ["America/Mexico_City"];

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Paper withBorder radius="lg" p="lg">
      <Stack gap="md">
        <div>
          <Title order={2} fz="md">{title}</Title>
          <Text size="sm" c="dimmed">{description}</Text>
        </div>
        {children}
      </Stack>
    </Paper>
  );
}

export function SettingsPage() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["settings"], queryFn: settingsApi.read });
  const [fn, setFn] = useState<Functional | null>(null);
  const [tech, setTech] = useState<Technical | null>(null);
  useEffect(() => {
    if (data) {
      setFn(data.functional);
      setTech(data.technical);
    }
  }, [data]);
  const save = useMutation({
    mutationFn: settingsApi.save,
    onSuccess: (s) => {
      qc.setQueryData(["settings"], s);
      notifications.show({ message: "Cambios guardados." });
    },
  });
  const test = useMutation({ mutationFn: settingsApi.testEmail });
  const admin = me?.role === "admin";
  const preview = useMemo(() => fn?.survey_question.replace("{titulo}", "No puedo iniciar sesión"), [fn?.survey_question]);
  if (!fn || !tech) return null;

  return (
    <>
      <PageHeader title="Configuración" description="Parámetros que aplican a toda la organización. Cada cambio queda en la auditoría." />
      <Stack gap="lg" maw={720}>
        <Section title="Operación" description="Ajustes del día a día, para Gestores y Administradores.">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate({ functional: { ...fn, org_name: fn.org_name.trim() } });
            }}
          >
            <Stack gap="md">
              <TextInput label="Nombre de la organización" description="Aparece en el encabezado de los correos." required maxLength={80}
                value={fn.org_name} onChange={(e) => setFn({ ...fn, org_name: e.currentTarget.value })} />
              <Group grow align="flex-start">
                <NumberInput label="Recordatorio de fecha compromiso" description="Horas antes del vencimiento." suffix=" h" min={1} max={168}
                  value={fn.reminder_hours} onChange={(v) => setFn({ ...fn, reminder_hours: Number(v) || 1 })} />
                <NumberInput label="Aviso de SLA por consumir" description="Porcentaje del plazo consumido." suffix=" %" min={50} max={95}
                  value={fn.sla_warning_pct} onChange={(v) => setFn({ ...fn, sla_warning_pct: Number(v) || 80 })} />
              </Group>
              <Textarea label="Pregunta de la encuesta" description="Usa {titulo} donde deba ir el título de la solicitud." autosize minRows={2}
                maxLength={300} value={fn.survey_question} onChange={(e) => setFn({ ...fn, survey_question: e.currentTarget.value })}
                error={fn.survey_question.includes("{titulo}") ? undefined : "Incluye {titulo}."} />
              <Text size="xs" c="dimmed">Vista previa: {preview}</Text>
              {save.error && <Alert color="red" variant="light">{save.error.message}</Alert>}
              <Group justify="flex-end">
                <Button type="submit" loading={save.isPending} disabled={!fn.survey_question.includes("{titulo}")}>Guardar cambios</Button>
              </Group>
            </Stack>
          </form>
        </Section>

        {admin && (
          <Section title="Técnicos" description="Solo el Administrador los puede cambiar.">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate({ technical: tech });
              }}
            >
              <Stack gap="md">
                <TextInput label="Dominio permitido" placeholder="empresa.com" description="Si lo defines, solo los correos de ese dominio pueden entrar (además del Administrador principal)."
                  value={tech.allowed_domain} onChange={(e) => setTech({ ...tech, allowed_domain: e.currentTarget.value })} />
                <Select label="Zona horaria" description="Para plazos, avisos y analítica." searchable data={ZONES}
                  value={tech.timezone} onChange={(v) => v && setTech({ ...tech, timezone: v })} />
                <Group justify="flex-end">
                  <Button type="submit" loading={save.isPending}>Guardar cambios</Button>
                </Group>
              </Stack>
            </form>
            <Group justify="space-between" pt="sm" style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}>
              <Text size="sm">Comprueba que los correos salen correctamente.</Text>
              <Button variant="default" leftSection={<IconMailForward size={16} />} loading={test.isPending} onClick={() => test.mutate()}>
                Enviar correo de prueba
              </Button>
            </Group>
            {test.data && (
              <Alert color={test.data.error ? "red" : "teal"} variant="light">
                {test.data.error
                  ? `No se pudo enviar: ${test.data.error}`
                  : `Correo enviado a ${test.data.sent_to}. Revisa tu bandeja de entrada (y la de no deseados).`}
              </Alert>
            )}
          </Section>
        )}
      </Stack>
    </>
  );
}
