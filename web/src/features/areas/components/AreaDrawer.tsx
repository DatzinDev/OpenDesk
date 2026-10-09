import { Alert, Button, Checkbox, Drawer, Group, NumberInput, SegmentedControl, Stack, Switch, Text, TextInput, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { useSaveArea } from "../hooks";
import { type Area, type AreaInput } from "../types";

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const NINE_SIX: [string, string] = ["09:00", "18:00"];

const EMPTY: AreaInput = {
  name: "",
  description: "",
  sla_hours: 24,
  always_open: true,
  week: [NINE_SIX, NINE_SIX, NINE_SIX, NINE_SIX, NINE_SIX, null, null],
  pause_on_holidays: false,
  is_active: true,
};

type Props = { opened: boolean; onClose: () => void; area: Area | null };

export function AreaDrawer({ opened, onClose, area }: Props) {
  const save = useSaveArea();
  const [form, setForm] = useState<AreaInput>(EMPTY);
  const set = <K extends keyof AreaInput>(k: K, v: AreaInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setDay = (i: number, v: [string, string] | null) =>
    setForm((f) => ({ ...f, week: f.week.map((w, k) => (k === i ? v : w)) }));

  useEffect(() => {
    if (!opened) return;
    setForm(area ?? EMPTY);
    save.reset();
  }, [opened, area]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate(
      { id: area?.id, data: { ...form, name: form.name.trim() } },
      {
        onSuccess: () => {
          notifications.show({ message: area ? "Cambios guardados." : "Área creada." });
          onClose();
        },
      },
    );
  };

  return (
    <Drawer opened={opened} onClose={onClose} title={<Text fw={600} fz="lg">{area ? "Editar área" : "Agregar área"}</Text>}>
      <form onSubmit={submit}>
        <Stack gap="lg">
          <TextInput label="Nombre" required value={form.name} onChange={(e) => set("name", e.currentTarget.value)} data-autofocus />
          <Textarea
            label="Descripción"
            autosize
            minRows={2}
            maxLength={240}
            value={form.description}
            onChange={(e) => set("description", e.currentTarget.value)}
          />
          <NumberInput
            label="Tiempo de primera respuesta"
            description="Horas dentro del horario de atención para que el asignado responda."
            suffix=" h"
            min={1}
            max={2000}
            required
            value={form.sla_hours}
            onChange={(v) => set("sla_hours", Number(v) || 1)}
          />

          <Stack gap={8}>
            <Text size="sm" fw={500}>
              Horario de atención
            </Text>
            <SegmentedControl
              fullWidth
              value={form.always_open ? "always" : "custom"}
              onChange={(v) => set("always_open", v === "always")}
              data={[
                { value: "always", label: "24/7" },
                { value: "custom", label: "Días y horas" },
              ]}
            />
            {!form.always_open && (
              <Stack gap={6} mt={4}>
                {DAY_NAMES.map((name, i) => {
                  const w = form.week[i];
                  return (
                    <Group key={name} gap="sm" wrap="nowrap" h={36}>
                      <Checkbox
                        label={name}
                        w={120}
                        checked={!!w}
                        onChange={(e) => setDay(i, e.currentTarget.checked ? (form.week.find(Boolean) ?? NINE_SIX) : null)}
                      />
                      {w ? (
                        <Group gap={6} wrap="nowrap" style={{ flex: 1 }}>
                          <TextInput type="time" size="xs" required aria-label={`${name}, desde`} value={w[0].slice(0, 5)} onChange={(e) => setDay(i, [e.currentTarget.value, w[1]])} style={{ flex: 1 }} />
                          <Text size="xs" c="dimmed">
                            a
                          </Text>
                          <TextInput type="time" size="xs" required aria-label={`${name}, hasta`} value={w[1].slice(0, 5)} onChange={(e) => setDay(i, [w[0], e.currentTarget.value])} style={{ flex: 1 }} />
                        </Group>
                      ) : (
                        <Text size="sm" c="dimmed">
                          No se atiende
                        </Text>
                      )}
                    </Group>
                  );
                })}
              </Stack>
            )}
            <Text size="xs" c="dimmed">
              Fuera de este horario el tiempo de respuesta se detiene.
            </Text>
          </Stack>

          <Switch
            label="Pausar en días festivos"
            description="Los días del calendario de festivos no cuentan para el tiempo de respuesta."
            checked={form.pause_on_holidays}
            onChange={(e) => set("pause_on_holidays", e.currentTarget.checked)}
          />
          {area && (
            <Switch
              label="Área activa"
              description="Un área inactiva no recibe personas ni tickets nuevos."
              checked={form.is_active}
              onChange={(e) => set("is_active", e.currentTarget.checked)}
            />
          )}

          {save.error && (
            <Alert color="pink" variant="light">
              {save.error.message}
            </Alert>
          )}
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={save.isPending}>
              {area ? "Guardar cambios" : "Crear área"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
}
