import type { ReactNode } from "react";
import { DatzinSignature, isotipo } from "@/shared/ui";
import { OrganizationLogo } from "@/features/settings";
import classes from "../pages/auth.module.css";

/** Panel de marca con el isotipo de OpenDesk como marca de agua. */
export function BrandPanel({ children }: { children: ReactNode }) {
  return (
    <section className={classes.brandPanel}>
      <OrganizationLogo size={26} />
      <img src={isotipo} alt="" aria-hidden className={classes.pattern} />
      <div className={classes.statement}>{children}</div>
      <DatzinSignature label="Hecho por Datzin" inverted />
    </section>
  );
}
