import { Alert, Button, Group, Paper, Stack, Switch, Text, TextInput, Title } from "@mantine/core";
import { useState } from "react";
import { useSaveStatus, useStatuses } from "../hooks";

/** Catálogo global de estatus de seguimiento que el Gestor asigna a los tickets. */
export function StatusCatalog() {
  const { data: statuses = [] } = useStatuses();
  const save = useSaveStatus();
  const [name, setName] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate({ name: name.trim(), is_active: true }, { onSuccess: () => setName("") });
  };

  return (
    <Paper radius="lg" withBorder p="lg">
      <Stack gap="md">
        <div>
          <Title order={2} fz="md">
            Estatus de seguimiento
          </Title>
          <Text size="sm" c="dimmed">
            Describen en qué punto está un ticket. El Gestor los elige desde el detalle del ticket y quedan en su historial.
          </Text>
        </div>
        <form onSubmit={submit}>
          <Group gap="sm" align="flex-end" wrap="wrap">
            <TextInput label="Nuevo estatus" required maxLength={60} placeholder="Esperando al cliente" value={name}
              onChange={(e) => setName(e.currentTarget.value)} style={{ flex: 1, minWidth: 220 }} />
            <Button type="submit" variant="light" loading={save.isPending}>
              Agregar estatus
            </Button>
          </Group>
        </form>
        {save.error && (
          <Alert color="red" variant="light">
            {save.error.message}
          </Alert>
        )}
        {statuses.length === 0 ? (
          <Text size="sm" c="dimmed">
            Aún no hay estatus registrados.
          </Text>
        ) : (
          <Stack gap={0}>
            {statuses.map((s) => (
              <Group key={s.id} justify="space-between" py={8} wrap="nowrap" style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}>
                <TextInput
                  variant="unstyled"
                  defaultValue={s.name}
                  maxLength={60}
                  aria-label="Nombre del estatus"
                  style={{ flex: 1 }}
                  onBlur={(e) => {
                    const v = e.currentTarget.value.trim();
                    if (v && v !== s.name) save.mutate({ ...s, name: v });
                  }}
                />
                <Switch
                  label={s.is_active ? "Activo" : "Inactivo"}
                  checked={s.is_active}
                  onChange={(e) => save.mutate({ ...s, is_active: e.currentTarget.checked })}
                />
              </Group>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
