import { Group, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

type Props = { title: string; description?: string; action?: ReactNode };

export function PageHeader({ title, description, action }: Props) {
  return (
    <Group justify="space-between" align="flex-end" mb="lg" wrap="wrap">
      <Stack gap={4}>
        <Title order={1} fz="xl">
          {title}
        </Title>
        {description && (
          <Text c="dimmed" size="sm" maw={560}>
            {description}
          </Text>
        )}
      </Stack>
      {action}
    </Group>
  );
}
