import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { SimulatorCollectionTree } from "../src/SimulatorCollectionTree";
const captured = vi.hoisted(() => ({ refs: [] as { current: unknown }[] }));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useRef: (value: unknown) => {
      const ref = actual.useRef(value);
      captured.refs.push(ref);
      return ref;
    },
  };
});
it("does not navigate when a queued tree event has no attached root", () => {
  const selected = vi.fn();
  render(
    <SimulatorCollectionTree
      title="Examples"
      nodes={[{ id: "one", label: "Example" }]}
      onSelect={selected}
      onAdd={() => {}}
      onAddChild={() => {}}
      onRemove={() => {}}
    />,
  );
  const root = captured.refs.find((ref) => ref.current instanceof HTMLUListElement);
  if (!root) throw new Error("Tree root missing");
  root.current = null;
  fireEvent.keyDown(screen.getByRole("treeitem", { name: "Example" }), { key: "ArrowDown" });
  expect(selected).not.toHaveBeenCalled();
});
