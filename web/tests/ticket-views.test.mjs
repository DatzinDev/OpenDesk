import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

test("cerrar el último ticket de una página regresa al rango válido sin saltos provisionales", async () => {
  const source = readFileSync(new URL("../src/features/tickets/views.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  const { pageWithinTotal } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
  assert.equal(pageWithinTotal(2, 20, 21, false), 2);
  assert.equal(pageWithinTotal(2, 20, 20, false), 1);
  assert.equal(pageWithinTotal(2, 20, 20, true), 2);
  assert.equal(pageWithinTotal(2, 20, 0, false), 1);
});
