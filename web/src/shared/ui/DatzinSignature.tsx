import { Anchor, Group, Image, Text } from "@mantine/core";
import logo from "@/shared/assets/datzin-marca.png";

type Props = { label?: string; inverted?: boolean };

/** Firma de marca: OpenDesk es software de la familia Datzin. */
export function DatzinSignature({ label = "Datzin", inverted = false }: Props) {
  return (
    <Group gap={6} wrap="wrap">
    <Anchor href="https://github.com/DatzinDev/OpenDesk" target="_blank" rel="noreferrer" size="xs" c={inverted ? "var(--opendesk-on-primary, white)" : "dimmed"}>OpenDesk</Anchor>
    <Anchor href="https://datzin.com.mx" target="_blank" rel="noreferrer" underline="never">
      <Group gap={8} wrap="nowrap">
        <Image src={logo} alt="Datzin" w={18} h={18} />
        <Text size="xs" c={inverted ? "var(--opendesk-on-primary, white)" : "dimmed"}>
          {label}
        </Text>
      </Group>
    </Anchor>
    </Group>
  );
}
