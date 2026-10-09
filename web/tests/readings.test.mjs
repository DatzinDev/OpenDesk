import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/features/analytics/readings.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { readReport } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const report = (kpis = {}, series = {}) => ({ kpis: Object.fromEntries(Object.entries(kpis).map(([key, value]) => [key, { value, prev: null }])), series });

test("el balance distingue entradas, cierres y falta de datos", () => {
  assert.match(readReport("summary", report({ created: 8, closed: 3, pending: 2 }))[0].title, /^5 entradas/);
  assert.match(readReport("summary", report({ created: 3, closed: 8 }))[0].title, /^5 cierres/);
  assert.match(readReport("summary", report({ created: 0, closed: 0 }))[0].title, /mismo ritmo/);
  assert.match(readReport("summary", report())[0].title, /Sin balance/);
});

test("SLA ignora áreas sin respuestas y admite un cumplimiento de cero", () => {
  const result = readReport("times", report({}, { sla_by_area: [{ area: "A", sla: null }, { area: "B", sla: 0 }, { area: "C", sla: 80 }] }));
  assert.match(result[0].title, /^B: 0.0/);
  assert.match(readReport("times", report({}, { sla_by_area: [] }))[0].title, /Sin respuestas/);
});

test("sobrecarga respeta el mínimo de tres y la proporción del promedio", () => {
  const result = readReport("team", report({ avg_load: 4 }, { people: [{ carga: 0 }, { carga: 5 }, { carga: 6 }] }));
  assert.match(result[0].title, /^1 personas/);
  assert.match(result[1].title, /^1 personas/);
  assert.match(readReport("team", report({ avg_load: 1 }, { people: [{ carga: 2 }] }))[0].title, /^0 personas/);
});

test("CSAT muestra la muestra y cuenta únicamente calificaciones bajas", () => {
  const result = readReport("clients", report({}, { ratings: [{ calificacion: 1, respuestas: 2 }, { calificacion: 2, respuestas: 1 }, { calificacion: 5, respuestas: 7 }] }));
  assert.match(result[0].title, /^10 respuestas/);
  assert.match(result[1].title, /^3 calificaciones/);
});

test("flujo usa las propuestas del periodo y demanda conserva la hora cero", () => {
  assert.match(readReport("flow", report({}, { proposals: [{ pendientes: 2 }, { pendientes: 3 }] }))[0].title, /^5 propuestas/);
  const demand = readReport("demand", report({ peak_hour: 0 }, { by_area: [{ area: "A", tickets: 2 }, { area: "B", tickets: 8 }] }));
  assert.match(demand[0].title, /^B: 8/);
  assert.match(demand[1].title, /0:00/);
  assert.deepEqual(readReport("me", report()), []);
});
