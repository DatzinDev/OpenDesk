import { SimpleGrid, Text } from "@mantine/core";
import type { Report, Tab } from "../api";
import { readReport } from "../readings";
import classes from "./ReportReading.module.css";

export function ReportReading({ tab, report }: { tab: Tab; report: Report }) {
  const readings = readReport(tab, report);
  if (!readings.length) return null;
  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" className={classes.reading}>
      {readings.map(reading => (
        <div key={reading.title}>
          <Text fw={600} size="sm" c="navy.7">{reading.title}</Text>
          <Text size="xs" c="gray.7" mt={4}>{reading.detail}</Text>
        </div>
      ))}
    </SimpleGrid>
  );
}
