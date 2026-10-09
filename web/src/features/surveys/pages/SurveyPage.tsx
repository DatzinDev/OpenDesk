import { Alert, Button, Center, Group, Loader, Paper, Rating, Stack, Text, Textarea, Title } from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { DatzinSignature } from "@/shared/ui";
import { OrganizationLogo } from "@/features/settings";
import { CSAT_ID } from "@/features/settings";
import { surveysApi } from "../api";

const SCALE = [1, 2, 3, 4, 5];

/** Página pública de la encuesta: el cliente no inicia sesión; el token del correo es la credencial. */
export function SurveyPage() {
  const token = useParams().token ?? "";
  const [params] = useSearchParams();
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["survey", token], queryFn: () => surveysApi.status(token), retry: false });
  const rate = useMutation({
    mutationFn: (ratings: Record<string, number>) => surveysApi.rate(token, ratings),
    onSuccess: (s) => qc.setQueryData(["survey", token], s),
  });
  const comment = useMutation({
    mutationFn: (text: string) => surveysApi.comment(token, text),
    onSuccess: (s) => qc.setQueryData(["survey", token], s),
  });
  const [text, setText] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});

  // El correo solo preselecciona; guardar requiere una acción explícita del cliente.
  const fromMail = Number(params.get("r"));
  useEffect(() => {
    setAnswers(SCALE.includes(fromMail) ? { [CSAT_ID]: fromMail } : {});
  }, [token, fromMail]);

  let content;
  if (isLoading || rate.isPending) content = <Center py="xl"><Loader color="navy" /></Center>;
  else if (isError || !data)
    content = <Text c="dimmed">El enlace de la encuesta no es válido. Revisa que lo hayas copiado completo.</Text>;
  else if (data.state === "expired")
    content = <Text c="dimmed">Esta encuesta venció. Gracias de todos modos por tu tiempo.</Text>;
  else if (data.state === "pending")
    content = (
      <Stack gap="md">
        <form onSubmit={e => { e.preventDefault(); rate.mutate(answers); }}>
          <Stack gap="xl">{data.questions.map(q => <Stack key={q.id} gap="sm"><Text fw={500} id={`question-${q.id}`}>{q.label}{q.required ? " *" : ""}</Text>{q.help && <Text size="sm" c="dimmed">{q.help}</Text>}<Rating count={5} size="xl" color="orange" value={answers[q.id] ?? 0} onChange={value => setAnswers(current => { const next = { ...current }; if (value) next[q.id] = value; else delete next[q.id]; return next; })} aria-label={q.label} /><Group justify="space-between"><Text size="xs" c="dimmed">1 estrella</Text><Text size="xs" c="dimmed">5 estrellas</Text></Group></Stack>)}<Button type="submit" disabled={data.questions.some(q => q.required && !answers[q.id])}>Enviar respuestas</Button></Stack>
        </form>
        {rate.error && <Alert color="red" variant="light">{rate.error.message}</Alert>}
      </Stack>
    );
  else
    content = (
      <Stack gap="md">
        <div>
          <Title order={2} fz="lg">
            {rate.isSuccess ? "¡Gracias por tu respuesta!" : "Esta encuesta ya fue respondida"}
          </Title>
          <Text c="dimmed" size="sm">
            Respuestas registradas.
          </Text>
        </div>
        {data.questions.map(q => <Stack key={q.id} gap={4}><Text size="sm">{q.label}</Text><Group><Rating value={data.ratings[q.id] ?? 0} readOnly color="orange" /><Text size="xs" c="dimmed">{data.ratings[q.id] ? `${data.ratings[q.id]} de 5` : "Sin respuesta"}</Text></Group></Stack>)}
        {data.has_comment ? (
          <Text size="sm">Recibimos tu comentario. Nos ayuda a mejorar.</Text>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              comment.mutate(text.trim());
            }}
          >
            <Stack gap="sm">
              <Textarea
                label="¿Algo que quieras contarnos? (opcional)"
                autosize
                minRows={3}
                maxRows={8}
                maxLength={2000}
                value={text}
                onChange={(e) => setText(e.currentTarget.value)}
              />
              {comment.error && <Alert color="red" variant="light">{comment.error.message}</Alert>}
              <Group justify="flex-end">
                <Button type="submit" disabled={!text.trim()} loading={comment.isPending}>
                  Enviar comentario
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Stack>
    );

  return (
    <main style={{ minHeight: "100vh", background: "var(--mantine-color-gray-1)", display: "grid", placeItems: "center", padding: 16 }}>
      <Stack gap="lg" w="100%" maw={480}>
        <OrganizationLogo tone="dark" size={22} />
        <Paper radius="lg" withBorder p="xl">
          <Stack gap="lg">
            {data && (
              <Text size="xs" c="dimmed">
                Solicitud {data.folio}
              </Text>
            )}
            {content}
          </Stack>
        </Paper>
        <DatzinSignature />
      </Stack>
    </main>
  );
}
