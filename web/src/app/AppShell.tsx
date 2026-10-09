import { ActionIcon, AppShell as Shell, Avatar, Burger, Group, Stack, Text, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBuilding, IconChecklist, IconInbox, IconLogout, IconUsers, type Icon } from "@tabler/icons-react";
import { NavLink, Outlet } from "react-router-dom";
import { useLogout, useMe } from "@/features/auth";
import { ROLE_LABELS, type Role } from "@/features/users";
import { DatzinSignature } from "@/shared/ui";
import classes from "./AppShell.module.css";

type NavItem = { to: string; label: string; icon: Icon; roles?: Role[] };

const NAV: NavItem[] = [
  { to: "/mis-actividades", label: "Mis actividades", icon: IconChecklist, roles: ["usuario"] },
  { to: "/bandeja", label: "Bandeja", icon: IconInbox, roles: ["admin", "gestor"] },
  { to: "/usuarios", label: "Usuarios", icon: IconUsers, roles: ["admin", "gestor"] },
  { to: "/areas", label: "Áreas", icon: IconBuilding, roles: ["admin", "gestor"] },
];

export function AppShell() {
  const { data: me } = useMe();
  const logout = useLogout();
  const [opened, { toggle, close }] = useDisclosure();
  if (!me) return null;

  return (
    <Shell navbar={{ width: 248, breakpoint: "sm", collapsed: { mobile: !opened } }} header={{ height: { base: 56, sm: 0 } }}>
      <Shell.Header hiddenFrom="sm" px="md" bg="navy.7" withBorder={false}>
        <Group h="100%" justify="space-between">
          <Text fw={600} c="white">
            OpenDesk
          </Text>
          <Burger opened={opened} onClick={toggle} color="white" size="sm" aria-label="Abrir menú" />
        </Group>
      </Shell.Header>

      <Shell.Navbar className={classes.navbar} p="md">
        <Group gap={4} px={12} py={8} mb="lg" visibleFrom="sm">
          <Text fw={600} fz={20}>
            OpenDesk
          </Text>
          <Text fw={600} fz={20} c="orange.4" aria-hidden>
            .
          </Text>
        </Group>

        <Stack gap={4} style={{ flex: 1 }} component="nav" aria-label="Navegación principal">
          {NAV.filter((i) => !i.roles || i.roles.includes(me.role)).map((i) => (
            <NavLink key={i.to} to={i.to} end className={classes.link} onClick={close}>
              <i.icon size={18} stroke={1.6} />
              {i.label}
            </NavLink>
          ))}
        </Stack>

        <Stack gap="md" className={classes.account}>
          <Group gap="sm" wrap="nowrap" justify="space-between">
            <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
              <Avatar src={me.picture} name={me.name} color="initials" size={34} />
              <div style={{ minWidth: 0 }}>
                <Text size="sm" fw={500} truncate>
                  {me.name}
                </Text>
                <Text size="xs" c="rgba(255,255,255,0.6)">
                  {ROLE_LABELS[me.role]}
                </Text>
              </div>
            </Group>
            <Tooltip label="Cerrar sesión">
              <ActionIcon variant="subtle" color="gray.3" onClick={() => logout.mutate()} aria-label="Cerrar sesión">
                <IconLogout size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
          <DatzinSignature inverted />
        </Stack>
      </Shell.Navbar>

      <Shell.Main className={classes.main}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "32px clamp(16px, 4vw, 40px)" }}>
          <Outlet />
        </div>
      </Shell.Main>
    </Shell>
  );
}
