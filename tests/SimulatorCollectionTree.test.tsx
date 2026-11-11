import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { SimulatorCollectionTree } from "../src/SimulatorCollectionTree";
const nodes = [
  {
    id: "a",
    label: "Alpha",
    children: [
      { id: "a1", label: "First" },
      { id: "a2", label: "Second" },
    ],
  },
  { id: "b", label: "Beta", children: [{ id: "b1", label: "Third" }] },
];
function Tree() {
  const [selected, setSelected] = useState<string>();
  return (
    <SimulatorCollectionTree
      title="Calls"
      nodes={nodes}
      selectedId={selected}
      onSelect={setSelected}
      onAdd={() => {}}
      onAddChild={() => {}}
      onRemove={() => {}}
    />
  );
}
it("supports arrow, Home/End, Enter and Space tree navigation", () => {
  render(<Tree />);
  const alpha = screen.getByRole("treeitem", { name: "Alpha" });
  alpha.focus();
  fireEvent.keyDown(alpha, { key: "ArrowDown" });
  const first = screen.getByRole("treeitem", { name: "First" });
  expect(first).toHaveFocus();
  expect(first).toHaveAttribute("aria-selected", "true");
  fireEvent.keyDown(first, { key: "ArrowDown" });
  const second = screen.getByRole("treeitem", { name: "Second" });
  expect(second).toHaveFocus();
  fireEvent.keyDown(second, { key: "ArrowLeft" });
  expect(alpha).toHaveFocus();
  fireEvent.keyDown(alpha, { key: "ArrowLeft" });
  expect(alpha).toHaveAttribute("aria-expanded", "false");
  fireEvent.keyDown(alpha, { key: "ArrowRight" });
  expect(alpha).toHaveAttribute("aria-expanded", "true");
  fireEvent.keyDown(alpha, { key: "ArrowRight" });
  expect(screen.getByRole("treeitem", { name: "First" })).toHaveFocus();
  fireEvent.keyDown(screen.getByRole("treeitem", { name: "First" }), { key: "End" });
  const beta = screen.getByRole("treeitem", { name: "Beta" });
  expect(beta).toHaveFocus();
  fireEvent.keyDown(beta, { key: " " });
  expect(beta).toHaveAttribute("aria-selected", "true");
  fireEvent.keyDown(beta, { key: "ArrowUp" });
  expect(screen.getByRole("treeitem", { name: "Second" })).toHaveFocus();
  fireEvent.keyDown(screen.getByRole("treeitem", { name: "Second" }), { key: "Home" });
  expect(alpha).toHaveFocus();
  fireEvent.keyDown(alpha, { key: "Enter" });
  expect(alpha).toHaveAttribute("aria-selected", "true");
});
it("expands the selected preview leaf and keeps Add/Delete separate from row selection", () => {
  const select = vi.fn(),
    add = vi.fn(),
    remove = vi.fn();
  const props = {
    title: "Calls",
    nodes,
    onSelect: select,
    onAdd: vi.fn(),
    onAddChild: add,
    onRemove: remove,
  };
  const { rerender } = render(<SimulatorCollectionTree {...props} />);
  rerender(<SimulatorCollectionTree {...props} selectedId="b1" />);
  expect(screen.getByRole("treeitem", { name: "Third" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Add item to Beta" }));
  expect(add).toHaveBeenCalledWith("b");
  expect(select).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Remove Third" }));
  expect(remove).toHaveBeenCalledWith("b1");
  fireEvent.click(screen.getByRole("button", { name: "Collapse Beta" }));
  expect(select).toHaveBeenCalledWith("b");
});

it("starts with a selected folder expanded so its saved children are visible", () => {
  render(
    <SimulatorCollectionTree
      title="Vault"
      nodes={nodes}
      selectedId="b"
      onSelect={() => {}}
      onAdd={() => {}}
      onAddChild={() => {}}
      onRemove={() => {}}
    />,
  );
  expect(screen.getByRole("treeitem", { name: "Third" })).toBeVisible();
});
