import { Button, Stack, Text, Title } from "@mantine/core";
import { BrandPanel } from "../components/BrandPanel";
import classes from "./auth.module.css";

export function AccessDeniedPage() {
  return (
    <main className={classes.layout}>
      <BrandPanel>El acceso a OpenDesk lo otorga tu organización.</BrandPanel>
      <section className={classes.formPanel}>
        <Stack gap="lg" maw={380}>
          <Stack gap={6}>
            <Title order={1} fz={26}>
              Tu cuenta no tiene acceso
            </Title>
            <Text c="dimmed">
              El correo con el que entraste no está registrado o su acceso fue desactivado. Pide al responsable de
              la plataforma que te dé de alta y vuelve a intentarlo.
            </Text>
          </Stack>
          <Button component="a" href="/api/auth/login" variant="default" size="md">
            Entrar con otra cuenta
          </Button>
        </Stack>
      </section>
    </main>
  );
}
