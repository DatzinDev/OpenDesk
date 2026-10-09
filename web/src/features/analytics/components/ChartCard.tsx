import { Paper, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

type Props = { title: string; question?: string; empty?: boolean; children: ReactNode };

/** Tarjeta de gráfica: el título dice qué es y la pregunta, para qué sirve. */
export function ChartCard({ title, question, empty, children }: Props) {
  return (
    <Paper withBorder radius="lg" p="md" h="100%" style={{ minWidth: 0 }}>
      <Stack gap="sm" h="100%">
        <div>
          <Title order={3} fz="md" fw={600}>
            {title}
          </Title>
          {question && (
            <Text size="xs" c="dimmed">
              {question}
            </Text>
          )}
        </div>
        {empty ? (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            No hay datos en este periodo.
          </Text>
        ) : (
          children
        )}
      </Stack>
    </Paper>
  );
}
