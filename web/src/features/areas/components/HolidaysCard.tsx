import { ActionIcon, Alert, Button, Group, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { useHolidayMutations, useHolidays } from "../hooks";

const fmt = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function HolidaysCard() {
  const { data: holidays = [] } = useHolidays();
  const { add, remove } = useHolidayMutations();
  const [day, setDay] = useState("");
  const [name, setName] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    add.mutate({ day, name: name.trim() }, { onSuccess: () => (setDay(""), setName("")) });
  };

  return (
    <Paper radius="lg" withBorder p="lg">
      <Stack gap="md">
        <div>
          <Title order={2} fz="md">
            Días festivos
          </Title>
          <Text size="sm" c="dimmed">
            Aplican solo a las áreas que pausan su tiempo de respuesta en festivos.
          </Text>
        </div>
        <form onSubmit={submit}>
          <Group gap="sm" align="flex-end" wrap="wrap">
            <TextInput type="date" label="Fecha" required value={day} onChange={(e) => setDay(e.currentTarget.value)} />
            <TextInput label="Motivo" required placeholder="Día de la Independencia" value={name} onChange={(e) => setName(e.currentTarget.value)} style={{ flex: 1, minWidth: 200 }} />
            <Button type="submit" variant="light" loading={add.isPending}>
              Agregar festivo
            </Button>
          </Group>
        </form>
        {add.error && (
          <Alert color="pink" variant="light">
            {add.error.message}
          </Alert>
        )}
        {holidays.length === 0 ? (
          <Text size="sm" c="dimmed">
            Aún no hay días festivos registrados.
          </Text>
        ) : (
          <Stack gap={0}>
            {holidays.map((h) => (
              <Group key={h.day} justify="space-between" py={8} style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}>
                <div>
                  <Text size="sm" fw={500}>
                    {h.name}
                  </Text>
                  <Text size="xs" c="dimmed" tt="capitalize">
                    {fmt.format(new Date(h.day))}
                  </Text>
                </div>
                <ActionIcon variant="subtle" color="gray" aria-label={`Quitar ${h.name}`} onClick={() => remove.mutate(h.day)}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
