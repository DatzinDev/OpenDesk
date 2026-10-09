import { ActionIcon, Badge, Button, Group, Stack } from "@mantine/core";
import { IconArrowDown, IconArrowUp } from "@tabler/icons-react";
import type { ReactNode } from "react";
import classes from "./Builder.module.css";

export function BuilderCard({ label, selected, onSelect, index, total, onMove, badge, children }: { label: string; selected: boolean; onSelect: () => void; index: number; total: number; onMove: (offset: number) => void; badge?: string; children: ReactNode }) {
  return <section className={`${classes.question} ${selected ? classes.selected : ""}`} aria-label={label || "Pregunta nueva"}>
    <Group justify="space-between" mb="md" wrap="nowrap"><Button variant="subtle" color="contrast" size="xs" onClick={onSelect}>{selected ? "Editando pregunta" : "Editar pregunta"}</Button><Group gap={4}>{badge && <Badge color="gray" variant="light">{badge}</Badge>}<ActionIcon variant="default" aria-label={`Subir ${label}`} disabled={index === 0} onClick={() => onMove(-1)}><IconArrowUp size={16} /></ActionIcon><ActionIcon variant="default" aria-label={`Bajar ${label}`} disabled={index === total - 1} onClick={() => onMove(1)}><IconArrowDown size={16} /></ActionIcon></Group></Group>
    <Stack gap="sm">{children}</Stack>
  </section>;
}
