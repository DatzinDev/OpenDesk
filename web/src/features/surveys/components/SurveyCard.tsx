import { Group, Paper, Rating, Stack, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { surveysApi } from "../api";

const fmt = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" });

/** Resultado de la encuesta de satisfacción en el detalle del ticket. */
export function SurveyCard({ ticketId }: { ticketId: string }) {
  const { data } = useQuery({ queryKey: ["ticket-survey", ticketId], queryFn: () => surveysApi.forTicket(ticketId) });
  if (!data) return null;
  return (
    <Paper withBorder radius="lg" p="lg">
      <Stack gap="xs">
        <Text size="xs" c="dimmed">
          Encuesta de satisfacción
        </Text>
        {data.rating ? (
          <>
            {data.questions.length > 0 ? data.questions.map(q => <Stack key={q.id} gap={4}><Text size="sm">{q.label}</Text><Group gap="sm"><Rating value={data.ratings[q.id] ?? 0} readOnly color="orange" /><Text size="sm">{data.ratings[q.id] ? `${data.ratings[q.id]} de 5` : "Sin respuesta"}</Text></Group></Stack>) : <Group gap="sm">
              <Rating value={data.rating} readOnly color="orange" />
              <Text size="sm" fw={500}>
                {data.rating} de 5
              </Text>
            </Group>}
            {data.comment && (
              <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                {data.comment}
              </Text>
            )}
            <Text size="xs" c="dimmed">
              Respondida el {fmt.format(new Date(data.answered_at!))}
            </Text>
          </>
        ) : (
          <Text size="sm" c="dimmed">
            {Date.parse(data.expires_at) < Date.now() ? "Venció sin respuesta" : "Enviada al cliente, sin respuesta"} (enviada el{" "}
            {fmt.format(new Date(data.sent_at))}).
          </Text>
        )}
      </Stack>
    </Paper>
  );
}
