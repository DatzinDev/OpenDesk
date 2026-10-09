import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/charts/styles.css";
import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useMemo, type ReactNode } from "react";
import { theme } from "@/shared/theme";
import { colorScale, foreground, textColor } from "@/shared/palette";
import { useBranding } from "@/features/settings";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

export function Providers({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}><BrandedProvider>{children}</BrandedProvider></QueryClientProvider>;
}

function BrandedProvider({ children }: { children: ReactNode }) {
  const { data } = useBranding();
  const palette = data?.palette;
  const brandedTheme = useMemo(() => palette ? createTheme({ ...theme, colors: { ...theme.colors, navy: colorScale(textColor(palette.primary)), orange: colorScale(textColor(palette.accent)), contrast: colorScale(textColor(palette.secondary)) }, autoContrast: true }) : theme, [palette]);
  const primary = palette?.primary ?? "#0b1d3a";
  const onPrimary = foreground(primary);
  useEffect(() => {
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (icon) { icon.href = data?.icon_url ?? "/favicon.png"; icon.type = data?.icon_url ? "image/webp" : "image/png"; }
    const touchIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (touchIcon) touchIcon.href = data?.icon_url ?? "/apple-touch-icon.png";
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColor) themeColor.content = primary;
    document.title = data?.org_name && data.org_name !== "OpenDesk" ? `${data.org_name} · OpenDesk` : "OpenDesk";
    const root = document.documentElement;
    root.style.setProperty("--opendesk-primary", primary);
    root.style.setProperty("--opendesk-on-primary", onPrimary);
    root.style.setProperty("--opendesk-surface-shift", onPrimary === "#ffffff" ? "#000000" : "#ffffff");
    root.style.setProperty("--opendesk-accent", palette?.accent ?? "#ff8e3c");
    root.style.setProperty("--opendesk-secondary", palette?.secondary ?? "#087f8c");
  }, [data?.icon_url, data?.org_name, primary, onPrimary, palette?.accent, palette?.secondary]);
  return (
    <MantineProvider theme={brandedTheme} defaultColorScheme="light">
      <Notifications position="top-right" />
      {children}
    </MantineProvider>
  );
}
