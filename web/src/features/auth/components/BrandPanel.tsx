import { Group, Text } from "@mantine/core";
import type { ReactNode } from "react";
import { DatzinSignature } from "@/shared/ui";
import classes from "../pages/auth.module.css";

/** Panel de marca con el patrón hexagonal del logotipo de Datzin. */
export function BrandPanel({ children }: { children: ReactNode }) {
  return (
    <section className={classes.brandPanel}>
      <Group gap={6}>
        <Text fw={600} fz={20}>
          OpenDesk
        </Text>
        <Text fw={600} fz={20} c="orange.4" aria-hidden>
          .
        </Text>
      </Group>
      <svg className={classes.pattern} viewBox="0 0 200 200" fill="none" stroke="#ffffff" strokeWidth="6" aria-hidden>
        <path d="M100 8 180 54v92l-80 46-80-46V54z" />
        <path d="M58 64v72l34 20V84z" />
        <path d="M108 44 150 68 120 104l30 38-42 24 30-36-30-38z" />
      </svg>
      <div className={classes.statement}>{children}</div>
      <DatzinSignature label="Hecho por Datzin" inverted />
    </section>
  );
}
