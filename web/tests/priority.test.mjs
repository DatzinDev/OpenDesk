import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

test("prioridad renombrada conserva etiqueta incluso cuando la opción se oculta", async () => {
  const source = readFileSync(new URL("../src/features/tickets/types.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  const { priorityLabel } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
  assert.equal(priorityLabel("alta", [{ id: "alta", label: "Urgente", active: false }]), "Urgente");
  assert.equal(priorityLabel("media"), "Media");
});
