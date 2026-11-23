import { useId, useState } from "react";

export interface KeyedSimulatorValue {
  readonly key: string;
  readonly value: unknown;
}
interface IdentitySnapshot {
  readonly values: readonly unknown[];
  readonly entries: readonly KeyedSimulatorValue[];
}
interface IdentityState {
  readonly snapshot: IdentitySnapshot;
  readonly sequence: number;
  readonly retained: readonly IdentitySnapshot[];
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
function allocateSnapshot(
  values: readonly unknown[],
  previous: readonly KeyedSimulatorValue[],
  prefix: string,
  sequence: number,
) {
  let nextSequence = sequence;
  const entries = reconcileSimulatorKeys(values, previous, () => `${prefix}:${nextSequence++}`);
  return { snapshot: { values, entries }, sequence: nextSequence };
}
function retainSnapshot(snapshot: IdentitySnapshot, previous: readonly IdentitySnapshot[]) {
  // The current and latest proposed arrays cover controlled acceptance/rejection without
  // retaining every keystroke's values for the lifetime of an editor.
  return [snapshot, ...previous.filter((item) => item.values !== snapshot.values)].slice(0, 2);
}
export function useSimulatorKeyedValues(values: readonly unknown[]) {
  const prefix = useId();
  const [state, setState] = useState<IdentityState>(() => {
    const allocated = allocateSnapshot(values, [], prefix, 0);
    return { ...allocated, retained: [allocated.snapshot] };
  });
  let current = state;
  if (state.snapshot.values !== values) {
    const known = state.retained.find((item) => item.values === values);
    const allocated = known
      ? { snapshot: known, sequence: state.sequence }
      : allocateSnapshot(values, state.snapshot.entries, prefix, state.sequence);
    current = { ...allocated, retained: retainSnapshot(allocated.snapshot, state.retained) };
    setState(current);
  }
  const entries = current.snapshot.entries;
  function remember(
    next: readonly unknown[],
    candidates: readonly KeyedSimulatorValue[] = entries,
  ) {
    setState((previous) => {
      const allocated = allocateSnapshot(next, candidates, prefix, previous.sequence);
      return {
        ...previous,
        sequence: allocated.sequence,
        retained: retainSnapshot(allocated.snapshot, previous.retained),
      };
    });
  }
  return { entries, remember };
}
