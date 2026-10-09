import { Paper, Stack, Text, Title } from "@mantine/core";
import { IconInbox } from "@tabler/icons-react";
import { useMe } from "@/features/auth";

export function HomePage() {
  const { data: me } = useMe();
  return (
    <Stack gap="lg">
      <Title order={1} fz="xl">
        Hola, {me?.name.split(" ")[0]}
      </Title>
      <Paper radius="lg" withBorder p="xl">
        <Stack align="center" gap={8} py="xl">
          <IconInbox size={32} stroke={1.5} color="var(--mantine-color-navy-3)" />
          <Text fw={600}>No tienes pendientes</Text>
          <Text size="sm" c="dimmed" ta="center" maw={360}>
            {me?.role === "usuario"
              ? "Cuando te asignen un ticket aparecerá aquí con su tiempo de respuesta."
              : "Aquí verás las acciones que esperan tu aprobación y los tickets próximos a vencer."}
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
