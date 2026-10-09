import { Alert, Button, Drawer, Group, SegmentedControl, Stack, Switch, Text, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!opened) return;
    setEmail(user?.email ?? "");
    setName(user?.name ?? "");
    setRole(user?.role ?? "usuario");
    setActive(user?.is_active ?? true);
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
        { email: email.trim(), name: name.trim(), role },
        {
          onSuccess: (u) => {
            notifications.show({ message: `Usuario creado. Enviamos las instrucciones de acceso a ${u.email}.` });
            onClose();
          },
        },
      );
    } else {
      update.mutate(
        { id: user.id, data: { name: name.trim(), role, is_active: active } },
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
            description={user ? undefined : "La persona entrará con la cuenta de Google de este correo."}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            disabled={!!user}
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
