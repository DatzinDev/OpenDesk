import { Button, Group, Modal, Text } from "@mantine/core";
import { useBeforeUnload, useBlocker } from "react-router-dom";

export function UnsavedChanges({ dirty }: { dirty: boolean }) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);
  useBeforeUnload(event => { if (dirty) { event.preventDefault(); event.returnValue = ""; } });
  return <Modal opened={blocker.state === "blocked"} onClose={() => blocker.state === "blocked" && blocker.reset()} title="Cambios sin guardar" centered>
    <Text size="sm" mb="lg">Hay cambios pendientes en el formulario.</Text><Group justify="flex-end"><Button variant="default" onClick={() => blocker.state === "blocked" && blocker.reset()}>Seguir editando</Button><Button color="red" onClick={() => blocker.state === "blocked" && blocker.proceed()}>Salir sin guardar</Button></Group>
  </Modal>;
}
