import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useSimulatorCollectionSelection } from "../src/useSimulatorCollectionSelection";
import { useSimulatorStartingPosition } from "../src/useSimulatorStartingPosition";
it("deduplicates identical group and starting-position reports", () => {
  const groups = renderHook(() => useSimulatorCollectionSelection("messages"));
  act(() => groups.result.current.selectCollectionGroup("one"));
  const previous = groups.result.current.collectionSelection;
  act(() => groups.result.current.selectCollectionGroup("one"));
  expect(groups.result.current.collectionSelection).toBe(previous);
  const position = renderHook(() => useSimulatorStartingPosition([], vi.fn()));
  act(() => position.result.current.followStartingPosition({ app: "home", screen: "home" }));
  const before = position.result.current.buttonProps.position;
  act(() => position.result.current.followStartingPosition({ app: "home", screen: "home" }));
  expect(position.result.current.buttonProps.position).toBe(before);
});
