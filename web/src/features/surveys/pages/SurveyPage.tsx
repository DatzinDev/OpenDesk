import { Alert, Button, Center, Group, Loader, Paper, Stack, Text, Textarea, Title } from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { DatzinSignature, Logo } from "@/shared/ui";
import { surveysApi } from "../api";

const SCALE = [1, 2, 3, 4, 5];

/** Página pública de la encuesta: el cliente no inicia sesión; el token del correo es la credencial. */
export function SurveyPage() {
  const token = useParams().token ?? "";
  const [params] = useSearchParams();
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["survey", token], queryFn: () => surveysApi.status(token), retry: false });
  const rate = useMutation({
    mutationFn: (rating: number) => surveysApi.rate(token, rating),
    onSuccess: (s) => qc.setQueryData(["survey", token], s),
  });
  const comment = useMutation({
    mutationFn: (text: string) => surveysApi.comment(token, text),
    onSuccess: (s) => qc.setQueryData(["survey", token], s),
  });
  const [text, setText] = useState("");
  const sent = useRef(false);

  // La calificación elegida en el correo se registra con un POST al abrir la página (nunca con el GET del enlace).
  const fromMail = Number(params.get("r"));
  useEffect(() => {
    if (data?.state === "pending" && SCALE.includes(fromMail) && !sent.current) {
      sent.current = true;
      rate.mutate(fromMail);
    }
  }, [data?.state]);

  let content;
  if (isLoading || rate.isPending) content = <Center py="xl"><Loader color="navy" /></Center>;
  else if (isError || !data)
    content = <Text c="dimmed">El enlace de la encuesta no es válido. Revisa que lo hayas copiado completo.</Text>;
  else if (data.state === "expired")
    content = <Text c="dimmed">Esta encuesta venció. Gracias de todos modos por tu tiempo.</Text>;
  else if (data.state === "pending")
    content = (
      <Stack gap="md">
        <Text fw={500}>{data.question}</Text>
        <Group gap="sm" justify="center">
          {SCALE.map((n) => (
            <Button key={n} size="lg" w={56} px={0} variant="default" onClick={() => rate.mutate(n)} aria-label={`Calificar con ${n}`}>
              {n}
            </Button>
          ))}
        </Group>
        <Group justify="space-between">
          <Text size="xs" c="dimmed">Nada satisfecho</Text>
          <Text size="xs" c="dimmed">Muy satisfecho</Text>
        </Group>
        {rate.error && <Alert color="red" variant="light">{rate.error.message}</Alert>}
      </Stack>
    );
  else
    content = (
      <Stack gap="md">
        <div>
          <Title order={2} fz="lg">
            {sent.current || rate.isSuccess ? "¡Gracias por tu respuesta!" : "Esta encuesta ya fue respondida"}
          </Title>
          <Text c="dimmed" size="sm">
            Calificación registrada: {data.rating} de 5.
          </Text>
        </div>
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
        <Logo tone="dark" size={22} />
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
