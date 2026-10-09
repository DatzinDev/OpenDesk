import { Badge, Button, Paper, Stack, Table, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useUsers } from "@/features/users";
import { PageHeader } from "@/shared/ui";
import { AreaDrawer } from "../components/AreaDrawer";
import { HolidaysCard } from "../components/HolidaysCard";
import { useAreas } from "../hooks";
import { describeSchedule, type Area } from "../types";

export function AreasPage() {
  const { data: areas = [], isLoading } = useAreas();
  const { data: users = [] } = useUsers();
  const [drawer, setDrawer] = useState<{ open: boolean; area: Area | null }>({ open: false, area: null });
  const people = (id: number) => users.filter((u) => u.area_id === id && u.is_active).length;

  return (
    <Stack gap="xl">
      <div>
        <PageHeader
          title="Áreas"
          description="Equipos de atención con su propio tiempo de primera respuesta y horario."
          action={
            <Button leftSection={<IconPlus size={16} />} onClick={() => setDrawer({ open: true, area: null })}>
              Agregar área
            </Button>
          }
        />
        <Paper radius="lg" withBorder>
          <Table.ScrollContainer minWidth={680}>
            <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Área</Table.Th>
                  <Table.Th>Primera respuesta</Table.Th>
                  <Table.Th>Horario</Table.Th>
                  <Table.Th>Personas</Table.Th>
                  <Table.Th>Estado</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {areas.map((a) => (
                  <Table.Tr
                    key={a.id}
                    onClick={() => setDrawer({ open: true, area: a })}
                    onKeyDown={(e) => e.key === "Enter" && setDrawer({ open: true, area: a })}
                    tabIndex={0}
                    style={{ cursor: "pointer" }}
                  >
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {a.name}
                      </Text>
                      {a.description && (
                        <Text size="xs" c="dimmed" lineClamp={1} maw={320}>
                          {a.description}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{a.sla_hours} h</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{describeSchedule(a)}</Text>
                      {a.pause_on_holidays && (
                        <Text size="xs" c="dimmed">
                          Pausa en festivos
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{people(a.id)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={a.is_active ? "teal" : "gray"} radius="sm">
                        {a.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          {!isLoading && areas.length === 0 && (
            <Text ta="center" c="dimmed" size="sm" py="xl">
              Crea la primera área para poder asignarle personas y tickets.
            </Text>
          )}
        </Paper>
      </div>

      <HolidaysCard />
      <AreaDrawer opened={drawer.open} area={drawer.area} onClose={() => setDrawer((d) => ({ ...d, open: false }))} />
    </Stack>
  );
}
