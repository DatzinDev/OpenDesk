import { Anchor, Group, Image, Text } from "@mantine/core";
import logo from "@/shared/assets/datzin-marca.png";

type Props = { label?: string; inverted?: boolean };

/** Firma de marca: OpenDesk es software de la familia Datzin. */
export function DatzinSignature({ label = "Software de la familia Datzin", inverted = false }: Props) {
  return (
    <Anchor href="https://datzin.com.mx" target="_blank" rel="noreferrer" underline="never">
      <Group gap={8} wrap="nowrap">
        <Image src={logo} alt="Datzin" w={18} h={18} style={inverted ? { filter: "brightness(0) invert(1)" } : undefined} />
        <Text size="xs" c={inverted ? "rgba(255,255,255,0.72)" : "dimmed"}>
          {label}
        </Text>
      </Group>
    </Anchor>
  );
}
