import { Avatar, Group, Paper, Select, Stack, Table, Text, TextInput, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { useAreas } from "@/features/areas";
import { useUpdateUser, useUsers } from "../hooks";
import type { User } from "../types";

/** Asignación de personas (rol Usuario) a áreas, editable en línea. */
export function AreaAssignment() {
  const { data: users = [] } = useUsers();
  const { data: areas = [] } = useAreas();
  const update = useUpdateUser();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string | null>(null);

  const activeAreas = areas.filter((a) => a.is_active).map((a) => ({ value: String(a.id), label: a.name }));
  const q = query.trim().toLowerCase();
  const people = users
    .filter((u) => u.role === "usuario" && u.is_active)
    .filter((u) => !filter || (filter === "none" ? !u.area_id : String(u.area_id) === filter))
    .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.includes(q));

  const move = (u: User, value: string | null) => {
    if (!value || value === String(u.area_id)) return;
    const area = areas.find((a) => String(a.id) === value)?.name;
    update.mutate(
      { id: u.id, data: { area_id: Number(value) } },
      {
        onSuccess: () =>
          notifications.show({
            message: u.area_id
              ? `${u.name} ahora pertenece a ${area}. Entra al nivel 1; ajústalo en la matriz de escalamiento.`
              : `${u.name} ahora pertenece a ${area}.`,
          }),
        onError: (e) => notifications.show({ color: "pink", message: e.message }),
      },
    );
  };

  return (
    <Paper radius="lg" withBorder>
      <Stack gap={4} px="md" pt="md">
        <Title order={2} fz="md">
          Personas por área
        </Title>
        <Text size="sm" c="dimmed">
          Cada persona con rol Usuario pertenece a una sola área y solo recibe tickets de ella.
        </Text>
      </Stack>
      <Group gap="sm" p="md" wrap="wrap">
        <TextInput
          placeholder="Buscar persona"
          aria-label="Buscar persona"
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          w={{ base: "100%", sm: 260 }}
        />
        <Select
          aria-label="Filtrar por área"
          placeholder="Todas las áreas"
          clearable
          value={filter}
          onChange={setFilter}
          data={[...activeAreas, { value: "none", label: "Sin área" }]}
          w={{ base: "100%", sm: 220 }}
        />
      </Group>
      <Table.ScrollContainer minWidth={520}>
        <Table verticalSpacing="xs" horizontalSpacing="md">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Persona</Table.Th>
              <Table.Th w={280}>Área</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {people.map((u) => (
              <Table.Tr key={u.id}>
                <Table.Td>
                  <Group gap="sm" wrap="nowrap">
                    <Avatar src={u.picture} name={u.name} color="initials" size={28} />
                    <div>
                      <Text size="sm" fw={500}>
                        {u.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {u.email}
                      </Text>
                    </div>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Select
                    aria-label={`Área de ${u.name}`}
                    placeholder="Asignar área"
                    searchable
                    allowDeselect={false}
                    value={u.area_id ? String(u.area_id) : null}
                    onChange={(v) => move(u, v)}
                    data={activeAreas}
                    error={!u.area_id}
                  />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      {people.length === 0 && (
        <Text ta="center" c="dimmed" size="sm" py="lg">
          {q || filter ? "Nadie coincide con el filtro." : "Aún no hay personas con rol Usuario. Dalas de alta en Usuarios."}
        </Text>
      )}
    </Paper>
  );
}
