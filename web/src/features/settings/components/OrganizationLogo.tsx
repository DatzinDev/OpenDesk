import { Stack } from "@mantine/core";
import { Logo } from "@/shared/ui";
import { foreground } from "@/shared/palette";
import { useBranding } from "../hooks";

export function OrganizationLogo({ tone = "light", size = 22 }: { tone?: "light" | "dark"; size?: number }) {
  const { data } = useBranding();
  if (!data?.logo_url) return <div style={tone === "light" && data?.palette && foreground(data.palette.primary) !== "#ffffff" ? { background: "white", padding: 6, borderRadius: 4 } : undefined}><Logo tone={tone === "light" && data?.palette && foreground(data.palette.primary) !== "#ffffff" ? "dark" : tone} size={size} /></div>;
  return (
    <Stack gap={8} align="flex-start" style={{ minWidth: 0, maxWidth: "100%", flex: 1 }}>
      <img src={data.logo_url} alt={data.org_name} onError={e => { e.currentTarget.style.display = "none"; }}
        style={{ maxWidth: "100%", width: "auto", maxHeight: size * 2, objectFit: "contain", background: "white", borderRadius: 4, padding: 4 }} />
      <div style={tone === "light" && foreground(data.palette.primary) !== "#ffffff" ? { background: "white", padding: 4, borderRadius: 4 } : undefined}><Logo tone={tone === "light" && foreground(data.palette.primary) !== "#ffffff" ? "dark" : tone} size={Math.min(size, 13)} /></div>
    </Stack>
  );
}
