import { useId, useRef } from "react";

export interface KeyedSimulatorValue {
  readonly key: string;
  readonly value: unknown;
}
function authoredId(value: unknown): string | undefined {
  if (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "string" &&
    value.id
  )
    return value.id;
  return undefined;
}
/** UI identity only: legacy values are never assigned persisted ids. */
export function reconcileSimulatorKeys(
  values: readonly unknown[],
  previous: readonly KeyedSimulatorValue[],
  createKey: () => string,
): KeyedSimulatorValue[] {
  const available = [...previous];
  return values.map((value) => {
    const id = authoredId(value);
    const index = available.findIndex(
      (entry) =>
        Object.is(entry.value, value) || (id !== undefined && authoredId(entry.value) === id),
    );
    const match = available[index];
    if (match) available.splice(index, 1);
    return { key: match?.key ?? createKey(), value };
  });
}
export function useSimulatorKeyedValues(values: readonly unknown[]) {
  const prefix = useId();
  const sequence = useRef(0);
  const previous = useRef<readonly KeyedSimulatorValue[]>([]);
  const cache = useRef(new WeakMap<readonly unknown[], readonly KeyedSimulatorValue[]>());
  const createKey = () => `${prefix}:${sequence.current++}`;
  const entries =
    cache.current.get(values) ?? reconcileSimulatorKeys(values, previous.current, createKey);
  cache.current.set(values, entries);
  previous.current = entries;
  function remember(
    next: readonly unknown[],
    candidates: readonly KeyedSimulatorValue[] = entries,
  ) {
    const keyed = reconcileSimulatorKeys(next, candidates, createKey);
    cache.current.set(next, keyed);
    previous.current = keyed;
  }
  return { entries, remember };
}
