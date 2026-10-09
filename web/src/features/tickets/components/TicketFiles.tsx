import { Anchor, Group, Stack, Text } from "@mantine/core";
import { IconDownload, IconFileText, IconPhoto } from "@tabler/icons-react";
import type { TicketEvent } from "../types";
import { dateFmt } from "./Badges";
import classes from "../pages/TicketViews.module.css";

export function TicketFiles({ events }: { events: TicketEvent[] }) {
  const files = events.flatMap(event => event.attachments.map(file => ({ ...file, date: event.created_at })));
  return <Stack gap="xs">{files.length ? files.map(file => <Anchor key={file.id} href={`/api/attachments/${file.id}`} target="_blank" rel="noopener" className={classes.file}><div style={{ background: "var(--mantine-color-gray-1)", borderRadius: 6, padding: 8 }}>{file.content_type.startsWith("image/") ? <IconPhoto size={22} stroke={1.5} /> : <IconFileText size={22} stroke={1.5} />}</div><div style={{ flex: 1, minWidth: 0 }}><Text size="xs" fw={500} className={classes.fileName}>{file.filename}</Text><Text size="xs" c="dimmed">{file.size < 1024 * 1024 ? `${Math.ceil(file.size / 1024)} KB` : `${(file.size / 1024 / 1024).toFixed(1)} MB`} · {dateFmt.format(new Date(file.date))}</Text></div><Group gap={0}><IconDownload size={16} /></Group></Anchor>) : <Text size="sm" c="dimmed">Sin archivos adjuntos.</Text>}</Stack>;
}
