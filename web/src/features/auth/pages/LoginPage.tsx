import { Alert, Button, Stack, Text, Title } from "@mantine/core";
import { IconBrandGoogleFilled } from "@tabler/icons-react";
import { Navigate, useSearchParams } from "react-router-dom";
import { BrandPanel } from "../components/BrandPanel";
import { useMe } from "../hooks";
import classes from "./auth.module.css";

export function LoginPage() {
  const [params] = useSearchParams();
  const { data: me } = useMe();
  if (me) return <Navigate to="/" replace />;

  return (
    <main className={classes.layout}>
      <BrandPanel>Cada solicitud de tus clientes, con responsable y fecha de respuesta.</BrandPanel>
      <section className={classes.formPanel}>
        <Stack gap="lg" maw={380}>
          <Stack gap={6}>
            <Title order={1} fz={26}>
              Entrar a OpenDesk
            </Title>
            <Text c="dimmed">Usa la cuenta de Google que tu organización registró en la plataforma.</Text>
          </Stack>
          {params.get("error") && (
            <Alert color="pink" variant="light">
              Google no pudo confirmar tu identidad. Vuelve a intentarlo.
            </Alert>
          )}
          <Button component="a" href="/api/auth/login" size="md" leftSection={<IconBrandGoogleFilled size={18} />}>
            Continuar con Google
          </Button>
          <Text size="xs" c="dimmed">
            OpenDesk no guarda contraseñas. Si aún no tienes acceso, solicítalo al responsable de la plataforma.
          </Text>
        </Stack>
      </section>
    </main>
  );
}
