import { Select } from "@mantine/core";
import { ticketsApi } from "../api";
import { useStatuses, useTicketAction } from "../hooks";
import type { Ticket } from "../types";

/** El Gestor fija el estatus de seguimiento del ticket; el cambio queda en el historial. */
export function TrackingSelect({ ticket }: { ticket: Ticket }) {
  const { data: statuses = [] } = useStatuses();
  const set = useTicketAction((id: string | null) => ticketsApi.setStatus(ticket.id, id));
  return (
    <Select
      label="Estatus de seguimiento"
      placeholder="Sin estatus"
      clearable
      disabled={ticket.status === "cerrado" || set.isPending}
      data={statuses.filter((s) => s.is_active || s.id === ticket.status_id).map((s) => ({ value: String(s.id), label: s.name }))}
      value={ticket.status_id ? String(ticket.status_id) : null}
      onChange={(v) => set.mutate(v)}
      error={set.error?.message}
    />
  );
}

export function useTrackingName() {
  const { data: statuses = [] } = useStatuses();
  return (id: string | null) => statuses.find((s) => s.id === id)?.name;
}
