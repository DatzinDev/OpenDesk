import { ActionIcon, Button, Group, Indicator, Popover, ScrollArea, Stack, Text, UnstyledButton } from "@mantine/core";
import { IconBell } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMarkRead, useInbox } from "../hooks";

const fmt = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" });

/** Campana de avisos: los mismos que llegan por correo, más los que solo son en sistema. */
export function NotificationBell({ color = "gray.3" }: { color?: string }) {
  const { data } = useInbox();
  const read = useMarkRead();
  const navigate = useNavigate();
  const [opened, setOpened] = useState(false);
  const unread = data?.unread ?? 0;

  return (
    <Popover opened={opened} onChange={setOpened} width={340} position="bottom-start" shadow="md" withinPortal>
      <Popover.Target>
        <Indicator label={unread > 99 ? "99+" : unread} size={16} color="orange" disabled={!unread} offset={4}>
          <ActionIcon variant="subtle" color={color} onClick={() => setOpened((o) => !o)}
            aria-label={unread ? `Avisos, ${unread} sin leer` : "Avisos"}>
            <IconBell size={20} />
          </ActionIcon>
        </Indicator>
      </Popover.Target>
      <Popover.Dropdown p={0}>
        <Group justify="space-between" px="md" py="sm" style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}>
          <Text fw={600} size="sm">
            Avisos
          </Text>
          {unread > 0 && (
            <Button variant="subtle" size="compact-xs" onClick={() => read.mutate(undefined)}>
              Marcar todo como leído
            </Button>
          )}
        </Group>
        <ScrollArea.Autosize mah={420}>
          {!data?.items.length ? (
            <Text size="sm" c="dimmed" ta="center" py="xl">
              No tienes avisos.
            </Text>
          ) : (
            <Stack gap={0}>
              {data.items.map((n) => (
                <UnstyledButton
                  key={n.id}
                  px="md"
                  py="sm"
                  style={{
                    borderBottom: "1px solid var(--mantine-color-gray-1)",
                    background: n.read_at ? undefined : "var(--mantine-color-orange-0)",
                  }}
                  onClick={() => {
                    if (!n.read_at) read.mutate([n.id]);
                    setOpened(false);
                    if (n.ticket_id) navigate(`/tickets/${n.ticket_id}`);
                  }}
                >
                  <Text size="sm" fw={n.read_at ? 400 : 600}>
                    {n.title}
                  </Text>
                  {n.body && (
                    <Text size="xs" c="dimmed" lineClamp={2}>
                      {n.body}
                    </Text>
                  )}
                  <Text size="xs" c="dimmed" mt={2}>
                    {fmt.format(new Date(n.created_at))}
                  </Text>
                </UnstyledButton>
              ))}
            </Stack>
          )}
        </ScrollArea.Autosize>
      </Popover.Dropdown>
    </Popover>
  );
}
