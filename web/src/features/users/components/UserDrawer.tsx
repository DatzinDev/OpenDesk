import { Alert, Button, Drawer, Group, SegmentedControl, Select, Stack, Switch, Text, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { useAreas } from "@/features/areas";
import { useCreateUser, useUpdateUser } from "../hooks";
import { ROLE_LABELS, type Role, type User } from "../types";

type Props = {
  opened: boolean;
  onClose: () => void;
  user: User | null; // null = alta
  actor: User;
};

export function UserDrawer({ opened, onClose, user, actor }: Props) {
  const create = useCreateUser();
  const update = useUpdateUser();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("usuario");
  const [active, setActive] = useState(true);
  const [areaId, setAreaId] = useState<string | null>(null);
  const { data: areas = [] } = useAreas();

  useEffect(() => {
    if (!opened) return;
    setEmail(user?.email ?? "");
    setName(user?.name ?? "");
    setRole(user?.role ?? "usuario");
    setActive(user?.is_active ?? true);
    setAreaId(user?.area_id ? String(user.area_id) : null);
    create.reset();
    update.reset();
  }, [opened, user]);

  const roles: Role[] = actor.role === "admin" ? ["usuario", "gestor", "admin"] : ["usuario", "gestor"];
  const locked = !!user?.is_root;
  const isSelf = user?.id === actor.id;
  const error = (create.error ?? update.error)?.message;
  const pending = create.isPending || update.isPending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      create.mutate(
        { email: email.trim(), name: name.trim(), role, area_id: role === "usuario" && areaId ? Number(areaId) : null },
        {
          onSuccess: (u) => {
            notifications.show({ message: `Usuario creado. Enviamos las instrucciones de acceso a ${u.email}.` });
            onClose();
          },
        },
      );
    } else {
      update.mutate(
        { id: user.id, data: { email: email.trim().toLowerCase(), name: name.trim(), role, is_active: active, ...(role === "usuario" && areaId ? { area_id: Number(areaId) } : {}) } },
        {
          onSuccess: () => {
            notifications.show({ message: "Cambios guardados." });
            onClose();
          },
        },
      );
    }
  };

  return (
    <Drawer opened={opened} onClose={onClose} title={<Text fw={600} fz="lg">{user ? "Editar usuario" : "Agregar usuario"}</Text>}>
      <form onSubmit={submit}>
        <Stack gap="lg">
          {locked && (
            <Alert color="navy" variant="light">
              Esta es la cuenta del Admin principal. Solo puede cambiarse desde la configuración del servidor.
            </Alert>
          )}
          <TextInput
            label="Correo de Google"
            description={
              user && email.trim().toLowerCase() !== user.email
                ? "Al guardar se cierran sus sesiones abiertas y recibirá el aviso de acceso en el nuevo correo."
                : "La persona entrará con la cuenta de Google de este correo."
            }
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            disabled={locked}
            data-autofocus
          />
          <TextInput label="Nombre" required value={name} onChange={(e) => setName(e.currentTarget.value)} disabled={locked} />
          <Stack gap={6}>
            <Text size="sm" fw={500}>
              Rol
            </Text>
            <SegmentedControl
              fullWidth
              value={role}
              onChange={(v) => setRole(v as Role)}
              data={roles.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
              disabled={locked || isSelf}
            />
            <Text size="xs" c="dimmed">
              {role === "usuario" && "Atiende los tickets que se le asignan."}
              {role === "gestor" && "Crea y asigna tickets, aprueba acciones y administra usuarios y áreas."}
              {role === "admin" && "Acceso total, incluida la configuración técnica y la auditoría."}
            </Text>
          </Stack>
          {role === "usuario" && (
            <Select
              label="Área"
              description={user?.area_id && areaId !== String(user.area_id) ? "Al cambiar de área se quita su responsable directo y el de quienes dependían de esta persona." : undefined}
              placeholder="Selecciona un área"
              required
              searchable
              value={areaId}
              onChange={setAreaId}
              data={areas.filter((a) => a.is_active || String(a.id) === areaId).map((a) => ({ value: String(a.id), label: a.name }))}
              nothingFoundMessage="Primero crea un área en la sección Áreas."
              disabled={locked}
            />
          )}
          {user && (
            <Switch
              label="Acceso activo"
              description="Una cuenta desactivada no puede entrar; su historial se conserva."
              checked={active}
              onChange={(e) => setActive(e.currentTarget.checked)}
              disabled={locked || isSelf}
              color="navy"
            />
          )}
          {error && (
            <Alert color="pink" variant="light">
              {error}
            </Alert>
          )}
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={pending} disabled={locked}>
              {user ? "Guardar cambios" : "Crear usuario"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
}
