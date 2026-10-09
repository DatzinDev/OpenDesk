import type { MantineColorsTuple } from "@mantine/core";

const rgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const luminance = (hex: string) => rgb(hex).map(v => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);

export function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

export function foreground(background: string) {
  return contrast(background, "#ffffff") >= contrast(background, "#000000") ? "#ffffff" : "#000000";
}

/** Los enlaces sobre blanco necesitan una variante oscura incluso con una marca clara. */
export function textColor(color: string) {
  let result = color;
  while (contrast(result, "#ffffff") < 4.5) {
    result = `#${rgb(result).map(v => Math.floor(v * .9).toString(16).padStart(2, "0")).join("")}`;
  }
  return result;
}

export function colorScale(color: string): MantineColorsTuple {
  const mix = (target: number, fraction: number) => `#${rgb(color).map(v => Math.round(v + (target - v) * fraction).toString(16).padStart(2, "0")).join("")}`;
  return [mix(255, .95), mix(255, .88), mix(255, .72), mix(255, .55), mix(255, .35), mix(255, .2), mix(0, .1), color, mix(0, .2), mix(0, .35)];
}
