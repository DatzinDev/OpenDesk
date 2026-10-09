import { Avatar, Badge, Button, Group, Paper, SegmentedControl, Table, Text, TextInput } from "@mantine/core";
import { IconLock, IconPlus, IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useMe } from "@/features/auth";
import { PageHeader } from "@/shared/ui";
import { UserDrawer } from "../components/UserDrawer";
import { useUsers } from "../hooks";
import { ROLE_LABELS, type User } from "../types";

const dateFmt = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" });
type StatusFilter = "activos" | "inactivos" | "todos";

export function UsersPage() {
  const { data: me } = useMe();
  const { data: users = [], isLoading } = useUsers();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("activos");
  const [drawer, setDrawer] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) =>
        (status === "todos" || u.is_active === (status === "activos")) &&
        (!q || u.name.toLowerCase().includes(q) || u.email.includes(q)),
    );
  }, [users, query, status]);

  if (!me) return null;

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Quién puede entrar a OpenDesk y con qué rol."
        action={
          <Button leftSection={<IconPlus size={16} />} onClick={() => setDrawer({ open: true, user: null })}>
            Agregar usuario
          </Button>
        }
      />

      <Group mb="md" gap="sm" wrap="wrap">
        <TextInput
          placeholder="Buscar por nombre o correo"
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          w={{ base: "100%", sm: 300 }}
          aria-label="Buscar usuarios"
        />
        <SegmentedControl
          value={status}
          onChange={(v) => setStatus(v as StatusFilter)}
          data={[
            { value: "activos", label: "Activos" },
            { value: "inactivos", label: "Inactivos" },
            { value: "todos", label: "Todos" },
          ]}
        />
      </Group>

      <Paper radius="lg" withBorder>
        <Table.ScrollContainer minWidth={640}>
          <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Persona</Table.Th>
                <Table.Th>Rol</Table.Th>
                <Table.Th>Estado</Table.Th>
                <Table.Th>Último acceso</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {visible.map((u) => (
                <Table.Tr
                  key={u.id}
                  onClick={() => setDrawer({ open: true, user: u })}
                  style={{ cursor: "pointer" }}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setDrawer({ open: true, user: u })}
                >
                  <Table.Td>
                    <Group gap="sm" wrap="nowrap">
                      <Avatar src={u.picture} name={u.name} color="initials" size={32} />
                      <div>
                        <Group gap={6}>
                          <Text size="sm" fw={500}>
                            {u.name}
                          </Text>
                          {u.is_root && <IconLock size={14} aria-label="Admin principal" color="var(--mantine-color-navy-4)" />}
                        </Group>
                        <Text size="xs" c="dimmed">
                          {u.email}
                        </Text>
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{ROLE_LABELS[u.role]}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={u.is_active ? "teal" : "gray"} radius="sm">
                      {u.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c={u.last_login_at ? undefined : "dimmed"}>
                      {u.last_login_at ? dateFmt.format(new Date(u.last_login_at)) : "Aún no entra"}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        {!isLoading && visible.length === 0 && (
          <Text ta="center" c="dimmed" size="sm" py="xl">
            {query ? "Ningún usuario coincide con la búsqueda." : "No hay usuarios en esta vista."}
          </Text>
        )}
      </Paper>

      <UserDrawer
        opened={drawer.open}
        user={drawer.user}
        actor={me}
        onClose={() => setDrawer((d) => ({ ...d, open: false }))}
      />
    </>
  );
}
