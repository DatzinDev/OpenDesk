import { Alert, Button, ColorInput, FileButton, Grid, Group, Paper, Select, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { foreground } from "@/shared/palette";
import { Logo } from "@/shared/ui";
import { settingsApi, type BrandingInput, type Palette } from "../api";
import { useBranding } from "../hooks";

const PRESETS: Record<string, [string, string, string]> = {
  opendesk: ["#0b1d3a", "#ff8e3c", "#087f8c"], blue: ["#174ea6", "#087e8b", "#bc5b17"], green: ["#155e4b", "#bd6414", "#5943a8"], violet: ["#553388", "#c55275", "#147d74"],
};
const assetId = (url: string | null) => url?.split("/").pop() ?? null;

export function BrandingEditor() {
  const { data, isError, refetch } = useBranding();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<BrandingInput | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (!data) return;
    setDraft({ ...data.palette, logo_id: assetId(data.logo_url), icon_id: assetId(data.icon_url) });
    setLogoUrl(data.logo_url);
    setIconUrl(data.icon_url);
  }, [data]);
  const save = useMutation({ mutationFn: settingsApi.saveBranding, onSuccess: result => {
    qc.setQueryData(["branding"], result);
    notifications.show({ message: "Identidad actualizada." });
  } });
  const upload = async (kind: "logo" | "icon", file: File | null) => {
    if (!file || !draft) return;
    setUploadError("");
    if (file.size > 1024 * 1024) { setUploadError("La imagen debe pesar como máximo 1 MB."); return; }
    setUploading(true);
    try {
      const result = await settingsApi.uploadAsset(file);
      setDraft(current => current && { ...current, [`${kind}_id`]: result.id });
      if (kind === "logo") setLogoUrl(result.url); else setIconUrl(result.url);
    } catch (error) { setUploadError(error instanceof Error ? error.message : "No se pudo subir la imagen."); }
    finally { setUploading(false); }
  };
  if (isError) return <Alert color="red">No se pudo cargar la identidad. <Button variant="subtle" onClick={() => refetch()}>Reintentar</Button></Alert>;
  if (!draft) return null;
  const valid = /^#[0-9a-f]{6}$/i.test(draft.primary) && /^#[0-9a-f]{6}$/i.test(draft.accent) && /^#[0-9a-f]{6}$/i.test(draft.secondary);
  const primary = valid ? draft.primary : "#0b1d3a";
  const onPrimary = foreground(primary);
  return (
    <Paper withBorder radius="lg" p="lg">
      <Title order={2} fz="md" mb="md">Identidad</Title>
      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Stack gap="md">
            {(["logo", "icon"] as const).map(kind => (
              <Group key={kind} justify="space-between" align="center">
                <div><Text size="sm" fw={500}>{kind === "logo" ? "Logotipo de la empresa" : "Icono de pestaña"}</Text><Text size="xs" c="dimmed">PNG o WebP · hasta 1 MB · 32–2048 px</Text></div>
                <Group gap="xs">
                  <FileButton accept="image/png,image/webp" onChange={file => upload(kind, file)}>{props => <Button {...props} variant="default" size="xs" loading={uploading}>Subir imagen</Button>}</FileButton>
                  {(kind === "logo" ? draft.logo_id : draft.icon_id) && <Button variant="subtle" size="xs" onClick={() => {
                    setDraft({ ...draft, [`${kind}_id`]: null });
                    if (kind === "logo") setLogoUrl(null); else setIconUrl(null);
                  }}>Quitar</Button>}
                </Group>
              </Group>
            ))}
            <Select label="Paleta" value={draft.preset} data={[
              { value: "opendesk", label: "OpenDesk" }, { value: "blue", label: "Azul" }, { value: "green", label: "Verde" }, { value: "violet", label: "Violeta" }, { value: "custom", label: "Personalizada" },
            ]} onChange={preset => {
              if (!preset) return;
              const [primary, accent, secondary] = PRESETS[preset] ?? [draft.primary, draft.accent, draft.secondary];
              setDraft({ ...draft, preset: preset as Palette["preset"], primary, accent, secondary });
            }} />
            <Group grow align="flex-start">
              <ColorInput label="Principal" format="hex" disabled={draft.preset !== "custom"} value={draft.primary} onChange={primary => setDraft({ ...draft, primary })} />
              <ColorInput label="Acento" format="hex" disabled={draft.preset !== "custom"} value={draft.accent} onChange={accent => setDraft({ ...draft, accent })} />
              <ColorInput label="Contraste" format="hex" disabled={draft.preset !== "custom"} value={draft.secondary} onChange={secondary => setDraft({ ...draft, secondary })} />
            </Group>
            {!valid && <Text size="xs" c="red">Usa colores hexadecimales de seis dígitos.</Text>}
            {uploadError && <Alert color="red">{uploadError}</Alert>}
            {save.error && <Alert color="red">{save.error.message}</Alert>}
            <Group justify="space-between">
              <Button variant="subtle" onClick={() => { setDraft({ preset: "opendesk", primary: "#0b1d3a", accent: "#ff8e3c", secondary: "#087f8c", logo_id: null, icon_id: null }); setLogoUrl(null); setIconUrl(null); }}>Restaurar OpenDesk</Button>
              <Button disabled={!valid || uploading} loading={save.isPending} onClick={() => save.mutate(draft)}>Guardar identidad</Button>
            </Group>
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Text size="xs" c="dimmed" mb="xs">Vista previa · cambios sin publicar</Text>
          <Paper withBorder radius="lg" style={{ overflow: "hidden" }}>
            <Group justify="space-between" p="md" style={{ background: primary, color: onPrimary }}>
              {logoUrl ? <Stack gap={8}><img src={logoUrl} alt="Vista previa del logotipo" style={{ maxHeight: 44, maxWidth: 160, objectFit: "contain", background: "white", borderRadius: 4, padding: 4 }} /><Logo tone={onPrimary === "#ffffff" ? "light" : "dark"} size={13} /></Stack> : <Logo tone={onPrimary === "#ffffff" ? "light" : "dark"} size={18} />}
              {iconUrl && <img src={iconUrl} alt="Icono de pestaña" width={28} height={28} style={{ objectFit: "contain" }} />}
            </Group>
            <Stack p="md" gap="sm">
              <Group justify="space-between"><Text fw={600}>Bandeja</Text><Text size="xs" c="dimmed">{data?.org_name}</Text></Group>
              <Group gap="xs"><span style={{ width: 10, height: 10, background: draft.accent, borderRadius: "50%" }} /><Text size="sm">Propuesta seleccionada</Text></Group>
              <Group justify="space-between" py="xs" style={{ borderTop: "1px solid #eff0f3" }}><Text size="sm">Solicitud de atención</Text><Text size="xs" style={{ background: valid ? draft.secondary : "#087f8c", color: foreground(valid ? draft.secondary : "#087f8c"), padding: "3px 8px", borderRadius: 4 }}>En seguimiento</Text></Group>
              <Group justify="space-between"><Text size="xs" c="red.8">Plazo vencido</Text><Button style={{ background: primary, color: onPrimary }}>Aceptar</Button></Group>
              <Text size="xs" c="dimmed">OpenDesk · Datzin</Text>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Paper>
  );
}
