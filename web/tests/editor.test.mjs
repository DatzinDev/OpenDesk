import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

test("borrador detecta edición, orden y cambios revertidos; cargar no bloquea", async () => {
  const source = readFileSync(new URL("../src/features/settings/editor.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  const { hasDraftChanges } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
  const saved = { revision: 1, fields: [{ label: "Título", required: true }], order: ["title", "description"] };
  const draft = structuredClone(saved);
  assert.equal(hasDraftChanges(null, saved), false);
  assert.equal(hasDraftChanges(draft, saved), false);
  draft.fields[0].required = false;
  assert.equal(hasDraftChanges(draft, saved), true);
  draft.fields[0].required = true;
  assert.equal(hasDraftChanges(draft, saved), false);
  draft.order.reverse();
  assert.equal(hasDraftChanges(draft, saved), true);
});
