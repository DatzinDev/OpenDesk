import { Fragment, type ReactNode } from "react";
import { FieldInputs, type CustomValues, type FormDefinition } from "@/features/settings";

export function TicketFormFields({ form, slots, values, onChange, original }: { form: FormDefinition | null; slots: Record<string, ReactNode>; values: CustomValues; onChange: (values: CustomValues) => void; original?: CustomValues }) {
  if (!form) return null;
  return <>{form.order.map(id => slots[id] ? <Fragment key={id}>{slots[id]}</Fragment> : <FieldInputs key={id} fields={form.fields.filter(f => f.id === id)} values={values} onChange={onChange} creating={!original} original={original} />)}</>;
}
