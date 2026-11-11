import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SimulatorEditor } from "../src/SimulatorEditor";
import { SimulatorPhoneCallsEditor } from "../src/SimulatorPhoneCallsEditor";
import { SimulatorCollectionTree } from "../src/SimulatorCollectionTree";
afterEach(cleanup);
it("supports every workspace tab navigation key without changing authored data", () => {
  const changed = vi.fn();
  render(
    <SimulatorEditor
      sections={[{ key: "messages", label: "Messages", value: [] }]}
      onChange={changed}
      renderPreview={() => <p>Preview</p>}
    />,
  );
  for (const key of ["ArrowRight", "ArrowLeft", "End", "Home", "x"])
    fireEvent.keyDown(screen.getByRole("tab", { selected: true }), { key });
  expect(screen.getByRole("tab", { name: "Preview" })).toHaveAttribute("aria-selected", "true");
  expect(changed).not.toHaveBeenCalled();
});
it("navigates tree groups and children with keyboard and ignores bubbled child keys", () => {
  const selected = vi.fn();
  render(
    <SimulatorCollectionTree
      title="Examples"
      nodes={[
        { id: "group", label: "Group", children: [{ id: "child", label: "Child" }] },
        { id: "other", label: "Other" },
      ]}
      onSelect={selected}
      onAdd={() => {}}
      onAddChild={() => {}}
      onRemove={() => {}}
    />,
  );
  const group = screen.getByRole("treeitem", { name: "Group" });
  fireEvent.keyDown(group, { key: "ArrowRight" });
  fireEvent.keyDown(group, { key: "ArrowRight" });
  const child = screen.getByRole("treeitem", { name: "Child" });
  fireEvent.keyDown(child, { key: "ArrowLeft" });
  for (const key of ["ArrowDown", "ArrowUp", "Home", "End", "Enter", " ", "x"])
    fireEvent.keyDown(group, { key });
  fireEvent.keyDown(screen.getByRole("button", { name: "Collapse Group" }), { key: "Home" });
  fireEvent.keyDown(group, { key: "ArrowLeft" });
  fireEvent.keyDown(group, { key: "ArrowLeft" });
  expect(selected).toHaveBeenCalledWith("child");
});
it("selects and edits call groups, follows external selection, and removes individual calls", () => {
  const changed = vi.fn(),
    selected = vi.fn();
  const calls = [
    {
      id: "one",
      type: "received",
      name: "Example",
      number: "+12025550110",
      timestamp: "2026-11-11T00:00:00Z",
    },
    { id: "two", type: "missed", name: "Example", number: "+12025550110", timestamp: "" },
  ];
  const view = render(
    <SimulatorPhoneCallsEditor value={{ calls }} onChange={changed} onSelect={selected} />,
  );
  fireEvent.click(screen.getByRole("treeitem", { name: "Example" }));
  expect(screen.getByText("2 calls. Select a call to edit its details.")).toBeTruthy();
  fireEvent.click(screen.getByRole("treeitem", { name: "Received — 2026-11-11T00:00:00Z" }));
  fireEvent.change(screen.getByLabelText("Caller name"), { target: { value: "Updated" } });
  expect(changed).toHaveBeenCalledWith(
    expect.objectContaining({
      calls: expect.arrayContaining([expect.objectContaining({ name: "Updated" })]),
    }),
  );
  view.rerender(
    <SimulatorPhoneCallsEditor
      value={{ calls }}
      selectedId="two"
      onChange={changed}
      onSelect={selected}
    />,
  );
  view.rerender(
    <SimulatorPhoneCallsEditor
      value={{ calls }}
      selectedId={undefined}
      onChange={changed}
      onSelect={selected}
    />,
  );
  expect(screen.queryByLabelText("Caller name")).toBeNull();
});
it("uses the number for unnamed call groups and clears selected-call ownership on deletion", () => {
  const changed = vi.fn(),
    selected = vi.fn();
  render(
    <SimulatorPhoneCallsEditor
      value={{ calls: [{ id: "one", type: "missed", number: "111", timestamp: "" }] }}
      selectedId="one"
      onChange={changed}
      onSelect={selected}
    />,
  );
  fireEvent.click(screen.getByRole("treeitem", { name: "111" }));
  expect(screen.getByText("1 calls. Select a call to edit its details.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Remove 111" }));
  expect(selected).toHaveBeenLastCalledWith(undefined);
});
it("ignores descendant key events and safely handles a missing DOM node identity", () => {
  const selected = vi.fn();
  render(
    <SimulatorCollectionTree
      title="Examples"
      nodes={[
        { id: "one", label: "First" },
        { id: "two", label: "Second" },
      ]}
      onSelect={selected}
      onAdd={() => {}}
      onAddChild={() => {}}
      onRemove={() => {}}
    />,
  );
  fireEvent.keyDown(screen.getByText("First"), { key: "Enter" });
  expect(selected).not.toHaveBeenCalled();
  screen.getByRole("treeitem", { name: "Second" }).removeAttribute("data-node-id");
  fireEvent.keyDown(screen.getByRole("treeitem", { name: "First" }), { key: "ArrowDown" });
  expect(selected).toHaveBeenCalledWith("one");
});
