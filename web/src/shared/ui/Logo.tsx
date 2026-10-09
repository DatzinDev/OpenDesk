import { Group } from "@mantine/core";
import isoBlanco from "@/shared/assets/opendesk-isotipo-blanco.png";
import isoNavy from "@/shared/assets/opendesk-isotipo-navy.png";
import letrasBlanco from "@/shared/assets/opendesk-letras-blanco.png";
import letrasNavy from "@/shared/assets/opendesk-letras-navy.png";

type Props = {
  /** "light" sobre fondos oscuros (letras blancas); "dark" sobre fondos claros. */
  tone?: "light" | "dark";
  /** Alto de las letras en px; el isotipo escala en proporción. */
  size?: number;
  withMark?: boolean;
};

/** Logotipo de OpenDesk: isotipo y nombre. */
export function Logo({ tone = "light", size = 22, withMark = true }: Props) {
  const light = tone === "light";
  return (
    <Group gap={Math.round(size * 0.45)} wrap="nowrap" align="center">
      {withMark && <img src={light ? isoBlanco : isoNavy} alt="" aria-hidden height={Math.round(size * 1.45)} />}
      <img src={light ? letrasBlanco : letrasNavy} alt="OpenDesk" height={size} style={{ marginTop: Math.round(size * 0.12) }} />
    </Group>
  );
}

export { isoBlanco as isotipo };
