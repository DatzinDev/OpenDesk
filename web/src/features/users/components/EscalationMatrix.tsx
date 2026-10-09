import { Alert, Avatar, Badge, Group, Menu, NumberInput, Paper, Stack, Text, Title, UnstyledButton } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconArrowNarrowUp, IconChevronDown } from "@tabler/icons-react";
import { useState } from "react";
import { useAreas, useSaveArea, type Area } from "@/features/areas";
import { useUpdateUser, useUsers } from "../hooks";
import type { User } from "../types";

/** Matriz por niveles: cada área define sus niveles y cada persona ocupa uno. Se escala hacia arriba. */
export function EscalationMatrix() {
  const { data: users = [] } = useUsers();
  const { data: areas = [] } = useAreas();
  const update = useUpdateUser();
  const saveArea = useSaveArea();
  // Arrastre nativo (HTML5). En pantallas táctiles se usa el menú de cada persona.
  const [dragged, setDragged] = useState<User | null>(null);
  const [over, setOver] = useState<string | null>(null); // "areaId:nivel" bajo el cursor

  const people = users.filter((u) => u.role === "usuario" && u.is_active);
  const withoutArea = people.filter((u) => !u.area_id);

  const moveTo = (u: User, level: number) => {
    if (u.level === level) return;
    update.mutate(
      { id: u.id, data: { level } },
      {
        onSuccess: () => notifications.show({ message: `${u.name} ahora está en el nivel ${level}.` }),
        onError: (e) => notifications.show({ color: "pink", message: e.message }),
      },
    );
  };

  const setLevels = (area: Area, levels: number) => {
    if (levels === area.levels || levels < 1 || levels > 10) return;
    const { id, ...data } = area;
    saveArea.mutate(
      { id, data: { ...data, levels } },
      {
        onSuccess: () => notifications.show({ message: `${area.name} ahora tiene ${levels} ${levels === 1 ? "nivel" : "niveles"}.` }),
        onError: (e) => notifications.show({ color: "pink", message: e.message }),
      },
    );
  };

  return (
    <Stack gap="lg">
      <Text size="sm" c="dimmed" maw={680}>
        Arrastra a cada persona al nivel que le corresponde. El nivel 1 es el primer contacto. Cuando una persona escala un ticket o no responde a tiempo, el ticket sube al
        siguiente nivel con personas y se asigna a quien tenga menos tickets abiertos. Si ya está en el nivel más alto,
        interviene el Gestor.
      </Text>
      {withoutArea.length > 0 && (
        <Alert color="orange" variant="light">
          {withoutArea.length === 1 ? "1 persona no tiene" : `${withoutArea.length} personas no tienen`} área asignada:{" "}
          {withoutArea.map((u) => u.name).join(", ")}. Asígnala en la pestaña Áreas y personas.
        </Alert>
      )}

      {areas
        .filter((a) => a.is_active)
        .map((area) => {
          const members = people.filter((u) => u.area_id === area.id);
          const levels = Array.from({ length: area.levels }, (_, i) => area.levels - i); // más alto arriba
          const occupied = Math.max(1, ...members.map((u) => u.level ?? 1));
          return (
            <Paper key={area.id} radius="lg" withBorder p="md">
              <Group justify="space-between" mb="md" wrap="wrap">
                <div>
                  <Title order={2} fz="md">
                    {area.name}
                  </Title>
                  <Text size="xs" c="dimmed">
                    {members.length} {members.length === 1 ? "persona" : "personas"}
                  </Text>
                </div>
                <NumberInput
                  aria-label={`Número de niveles de ${area.name}`}
                  leftSection={<Text size="xs" c="dimmed" pl={8}>Niveles</Text>}
                  leftSectionWidth={64}
                  min={occupied}
                  max={10}
                  w={140}
                  size="xs"
                  value={area.levels}
                  onChange={(v) => setLevels(area, Number(v))}
                  clampBehavior="strict"
                />
              </Group>

              <Stack gap={6}>
                {levels.map((level, idx) => {
                  const atLevel = members.filter((u) => u.level === level);
                  const key = `${area.id}:${level}`;
                  const canDrop = dragged?.area_id === area.id && dragged.level !== level;
                  return (
                    <div key={level}>
                      {idx > 0 && (
                        <Group justify="center" h={14} c="navy.3" aria-hidden>
                          <IconArrowNarrowUp size={14} />
                        </Group>
                      )}
                      <Group
                        gap="md"
                        wrap="nowrap"
                        align="flex-start"
                        p="sm"
                        onDragOver={(e) => {
                          if (!canDrop) return;
                          e.preventDefault();
                          setOver(key);
                        }}
                        onDragLeave={() => setOver((o) => (o === key ? null : o))}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (canDrop && dragged) moveTo(dragged, level);
                          setOver(null);
                          setDragged(null);
                        }}
                        style={{
                          borderRadius: 10,
                          outline: over === key ? "2px dashed var(--mantine-color-orange-4)" : canDrop ? "1px dashed var(--mantine-color-gray-4)" : "none",
                          outlineOffset: -2,
                          transition: "outline-color 120ms",
                          background: over === key ? "var(--mantine-color-orange-0)" : level === area.levels ? "var(--mantine-color-navy-0)" : "var(--mantine-color-gray-0)",
                          borderLeft: `3px solid ${level === 1 ? "var(--mantine-color-orange-4)" : "var(--mantine-color-navy-" + Math.min(2 + level, 7) + ")"}`,
                        }}
                      >
                        <Stack gap={0} w={120} style={{ flexShrink: 0 }}>
                          <Text size="sm" fw={600}>
                            Nivel {level}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {level === 1 ? "Primer contacto" : level === area.levels ? "Último nivel" : "Escalamiento"}
                          </Text>
                        </Stack>
                        <Group gap={6} style={{ flex: 1 }} wrap="wrap">
                          {atLevel.length === 0 && (
                            <Text size="xs" c="dimmed" py={6}>
                              {level === 1 ? "Sin personas: los tickets nuevos no tendrán a quién asignarse." : "Sin personas: este nivel se salta al escalar."}
                            </Text>
                          )}
                          {atLevel.map((u) => (
                            <Menu key={u.id} position="bottom-start" withinPortal shadow="md">
                              <Menu.Target>
                                <UnstyledButton
                                  aria-label={`Cambiar nivel de ${u.name}`}
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.effectAllowed = "move";
                                    e.dataTransfer.setData("text/plain", String(u.id));
                                    setDragged(u);
                                  }}
                                  onDragEnd={() => {
                                    setDragged(null);
                                    setOver(null);
                                  }}
                                  style={{
                                    cursor: "grab",
                                    opacity: dragged?.id === u.id ? 0.4 : 1,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "4px 8px 4px 4px",
                                    borderRadius: 999,
                                    background: "white",
                                    border: "1px solid var(--mantine-color-gray-3)",
                                  }}
                                >
                                  <Avatar src={u.picture} name={u.name} color="initials" size={24} />
                                  <Text size="sm">{u.name}</Text>
                                  <IconChevronDown size={14} color="var(--mantine-color-gray-6)" />
                                </UnstyledButton>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Label>Mover a</Menu.Label>
                                {levels
                                  .filter((l) => l !== level)
                                  .map((l) => (
                                    <Menu.Item key={l} onClick={() => moveTo(u, l)}>
                                      Nivel {l}
                                    </Menu.Item>
                                  ))}
                              </Menu.Dropdown>
                            </Menu>
                          ))}
                        </Group>
                        {atLevel.length > 0 && (
                          <Badge variant="light" color="gray" radius="sm" style={{ flexShrink: 0 }}>
                            {atLevel.length}
                          </Badge>
                        )}
                      </Group>
                    </div>
                  );
                })}
              </Stack>
            </Paper>
          );
        })}
      {areas.length === 0 && (
        <Text size="sm" c="dimmed">
          Crea un área y asígnale personas para construir la matriz.
        </Text>
      )}
    </Stack>
  );
}
