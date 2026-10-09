import { createTheme, type MantineColorsTuple } from "@mantine/core";

// Tokens de marca Datzin (docs/diseno.md).
export const brand = {
  navy: "#0b1d3a",
  ink: "#0d0d0d",
  paper: "#ffffff",
  soft: "#eff0f3",
  orange: "#ff8e3c",
  pink: "#d9376e",
};

const navy: MantineColorsTuple = [
  "#eef1f7", "#d5dbe8", "#aab6cf", "#7c8fb4", "#56709d", "#3d5a8e", "#1c3360", "#0b1d3a", "#081630", "#050f22",
];
const orange: MantineColorsTuple = [
  "#fff3e9", "#ffe4cf", "#ffc79d", "#ffa868", "#ff8e3c", "#ff7e21", "#f56f10", "#d95e05", "#c15200", "#a84500",
];
const pink: MantineColorsTuple = [
  "#fdedf3", "#f8d4e1", "#f0a8c1", "#e7799f", "#e05484", "#dc4277", "#d9376e", "#c0285d", "#ab2052", "#961746",
];

export const theme = createTheme({
  fontFamily: "'DM Sans', system-ui, sans-serif",
  headings: { fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: "600" },
  colors: { navy, orange, pink },
  primaryColor: "navy",
  primaryShade: 7,
  black: brand.ink,
  defaultRadius: "md",
  radius: { md: "8px", lg: "12px" },
  fontSizes: { xs: "13px", sm: "14px", md: "16px", lg: "20px", xl: "26px" },
  focusRing: "auto",
  components: {
    Button: { defaultProps: { fw: 600 } },
    Drawer: { defaultProps: { position: "right", size: "md", padding: "xl" } },
  },
});
