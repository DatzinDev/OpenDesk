import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

test("paletas claras y oscuras conservan contraste y escala", async () => {
  const source = readFileSync(new URL("../src/shared/palette.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  const { foreground, contrast, colorScale, textColor } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
  for (const color of ["#ffffff", "#000000", "#ffcc00", "#0b1d3a", "#777777", "#757575", "#ff8e3c"]) {
    assert.ok(contrast(color, foreground(color)) >= 4.5);
    assert.ok(contrast(textColor(color), "#ffffff") >= 4.5);
    const on = foreground(color);
    const blend = factor => `#${[1, 3, 5].map(i => Math.round(parseInt(color.slice(i, i + 2), 16) * (1 - factor) + (on === "#ffffff" ? 0 : 255) * factor).toString(16).padStart(2, "0")).join("")}`;
    assert.ok(contrast(blend(.1), on) >= 4.5);
    assert.ok(contrast(blend(.14), on) >= 4.5);
    const scale = colorScale(color);
    assert.equal(scale.length, 10);
    assert.equal(scale[7], color);
  }
});
