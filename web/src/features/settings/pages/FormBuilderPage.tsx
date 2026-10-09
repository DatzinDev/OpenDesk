import { Button, Group, SegmentedControl, Stack } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/shared/ui";
import { FormEditor } from "../components/FormEditor";
import { SurveyFormEditor } from "../components/SurveyFormEditor";

export function FormBuilderPage() {
  const { kind } = useParams();
  const navigate = useNavigate();
  if (kind !== "tickets" && kind !== "encuesta") return <Navigate to="/formularios/tickets" replace />;
  return <Stack gap="md">
    <Group justify="space-between"><Button component={Link} to="/configuracion" variant="subtle" leftSection={<IconArrowLeft size={16} />}>Configuración</Button><SegmentedControl aria-label="Formulario" value={kind} onChange={value => navigate(`/formularios/${value}`)} data={[{ value: "tickets", label: "Tickets" }, { value: "encuesta", label: "Encuesta de clientes" }]} /></Group>
    <PageHeader title={kind === "tickets" ? "Formulario de tickets" : "Encuesta de clientes"} />
    {kind === "tickets" ? <FormEditor /> : <SurveyFormEditor />}
  </Stack>;
}
