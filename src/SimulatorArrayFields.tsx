import { useSimulatorKeyedValues } from "./useSimulatorKeyedValues.js";
import type { ReactNode } from "react";

export function SimulatorArrayFields({
  value,
  label,
  onChange,
  renderItem,
}: Readonly<{
  value: readonly unknown[];
  label: string;
  onChange: (value: unknown[]) => void;
  renderItem: (value: unknown, index: number, change: (value: unknown) => void) => ReactNode;
}>) {
  const { entries, remember } = useSimulatorKeyedValues(value);
  return (
    <fieldset className="border rounded p-3 mb-3">
      <legend className="float-none w-auto h6">{label}</legend>
      {entries.map(({ value: item, key }, index) => (
        <div key={key} className="border-bottom pb-2 mb-2">
          {renderItem(item, index, (next) => {
            const updated = value.map((entry, i) => (i === index ? next : entry));
            remember(
              updated,
              entries.map((entry, i) => (i === index ? { ...entry, value: next } : entry)),
            );
            onChange(updated);
          })}
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() => {
              const updated = value.filter((_, i) => i !== index);
              remember(
                updated,
                entries.filter((_, i) => i !== index),
              );
              onChange(updated);
            }}
          >
            Remove item {index + 1}
          </button>
        </div>
      ))}
    </fieldset>
  );
}
