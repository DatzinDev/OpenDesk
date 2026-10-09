import { NumberInput, Select, Stack, TextInput } from "@mantine/core";
import type { CustomField, CustomValues } from "../api";

export function FieldInputs({ fields, values, onChange, creating = true, original = {} }: {
  fields: CustomField[]; values: CustomValues; onChange: (values: CustomValues) => void; creating?: boolean; original?: CustomValues;
}) {
  return <Stack gap="md">{fields.filter(f => f.active).map(f => {
    const value = values[f.id] ?? null;
    const required = f.required && (creating || original[f.id] != null);
    const common = { label: f.label, description: f.help || undefined, required };
    const set = (value: string | number | boolean | null) => onChange({ ...values, [f.id]: value });
    if (f.type === "number") return <NumberInput key={f.id} {...common} value={typeof value === "number" ? value : ""} onChange={v => set(v === "" ? null : Number(v))} />;
    if (f.type === "boolean") return <Select key={f.id} {...common} clearable={!required} data={[{ value: "yes", label: "Sí" }, { value: "no", label: "No" }]} value={value == null ? null : value ? "yes" : "no"} onChange={v => set(v == null ? null : v === "yes")} />;
    if (f.type === "select") return <Select key={f.id} {...common} clearable={!required} value={typeof value === "string" ? value : null} data={f.options.filter(o => o.active || o.id === value).map(o => ({ value: o.id, label: o.label, disabled: !o.active }))} onChange={set} />;
    return <TextInput key={f.id} {...common} type={f.type === "date" ? "date" : "text"} maxLength={f.type === "text" ? 500 : undefined} value={typeof value === "string" ? value : ""} onChange={e => set(e.currentTarget.value || null)} />;
  })}</Stack>;
}
