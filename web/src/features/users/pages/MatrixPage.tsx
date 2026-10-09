import { Alert, Avatar, Group, Paper, Select, Stack, Table, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAreas } from "@/features/areas";
import { PageHeader } from "@/shared/ui";
import { useSetManager, useUsers } from "../hooks";
import type { User } from "../types";

export function MatrixPage() {
  const { data: users = [] } = useUsers();
  const { data: areas = [] } = useAreas();
  const setManager = useSetManager();

  const people = users.filter((u) => u.role === "usuario" && u.is_active);
  const withoutArea = people.filter((u) => !u.area_id);
  const reports = (id: number) => people.filter((u) => u.manager_id === id).length;

  const change = (u: User, value: string | null) =>
    setManager.mutate(
      { id: u.id, managerId: value ? Number(value) : null },
      {
        onSuccess: () => notifications.show({ message: `Responsable de ${u.name} actualizado.` }),
        onError: (e) => notifications.show({ color: "pink", message: e.message }),
      },
    );

  return (
    <>
      <PageHeader
        title="Matriz de responsables"
        description="A quién se escala un ticket cuando la persona asignada lo escala o no responde a tiempo."
      />
      <Stack gap="lg">
        {withoutArea.length > 0 && (
          <Alert color="orange" variant="light">
            {withoutArea.length === 1 ? "1 persona no tiene" : `${withoutArea.length} personas no tienen`} área asignada:{" "}
            {withoutArea.map((u) => u.name).join(", ")}. Asígnala desde Usuarios para incluirla en la matriz.
          </Alert>
        )}
        {areas
          .filter((a) => a.is_active)
          .map((area) => {
            const members = people.filter((u) => u.area_id === area.id);
            return (
              <Paper key={area.id} radius="lg" withBorder>
                <Group justify="space-between" px="md" pt="md" pb="xs">
                  <Title order={2} fz="md">
                    {area.name}
                  </Title>
                  <Text size="xs" c="dimmed">
                    {members.length} {members.length === 1 ? "persona" : "personas"}
                  </Text>
                </Group>
                {members.length === 0 ? (
                  <Text size="sm" c="dimmed" px="md" pb="md">
                    Esta área aún no tiene personas con rol Usuario.
                  </Text>
                ) : (
                  <Table.ScrollContainer minWidth={560}>
                    <Table verticalSpacing="xs" horizontalSpacing="md">
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Persona</Table.Th>
                          <Table.Th w={300}>Responsable directo</Table.Th>
                          <Table.Th w={110}>A su cargo</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {members.map((u) => (
                          <Table.Tr key={u.id}>
                            <Table.Td>
                              <Group gap="sm" wrap="nowrap">
                                <Avatar src={u.picture} name={u.name} color="initials" size={28} />
                                <Text size="sm" fw={500}>
                                  {u.name}
                                </Text>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Select
                                aria-label={`Responsable directo de ${u.name}`}
                                placeholder="Sin responsable"
                                clearable
                                searchable
                                value={u.manager_id ? String(u.manager_id) : null}
                                onChange={(v) => change(u, v)}
                                data={members.filter((m) => m.id !== u.id).map((m) => ({ value: String(m.id), label: m.name }))}
                              />
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" c={reports(u.id) ? undefined : "dimmed"}>
                                {reports(u.id)}
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                )}
              </Paper>
            );
          })}
        {areas.length === 0 && (
          <Text size="sm" c="dimmed">
            Crea un área y asígnale personas para construir la matriz.
          </Text>
        )}
      </Stack>
    </>
  );
}
