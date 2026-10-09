import { Alert, Button, Chip, Drawer, Group, NumberInput, SegmentedControl, Stack, Switch, Text, TextInput, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { useSaveArea } from "../hooks";
import { DAY_LABELS, type Area, type AreaInput } from "../types";

const EMPTY: AreaInput = {
  name: "",
  description: "",
  sla_hours: 24,
  always_open: true,
  days: [0, 1, 2, 3, 4],
  start_time: "09:00",
  end_time: "18:00",
  pause_on_holidays: false,
  is_active: true,
};

type Props = { opened: boolean; onClose: () => void; area: Area | null };

export function AreaDrawer({ opened, onClose, area }: Props) {
  const save = useSaveArea();
  const [form, setForm] = useState<AreaInput>(EMPTY);
  const set = <K extends keyof AreaInput>(k: K, v: AreaInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!opened) return;
    setForm(area ? { ...area, start_time: area.start_time.slice(0, 5), end_time: area.end_time.slice(0, 5) } : EMPTY);
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
              <Stack gap="sm" mt={4}>
                <Chip.Group multiple value={form.days.map(String)} onChange={(v) => set("days", v.map(Number).sort())}>
                  <Group gap={6}>
                    {DAY_LABELS.map((d, i) => (
                      <Chip key={d} value={String(i)} size="sm" variant="outline">
                        {d}
                      </Chip>
                    ))}
                  </Group>
                </Chip.Group>
                <Group grow>
                  <TextInput type="time" label="Desde" required value={form.start_time} onChange={(e) => set("start_time", e.currentTarget.value)} />
                  <TextInput type="time" label="Hasta" required value={form.end_time} onChange={(e) => set("end_time", e.currentTarget.value)} />
                </Group>
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
