import { isValidElement } from "react";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SimulatorCollectionTree } from "../src/SimulatorCollectionTree";
import { SimulatorCollectionContext } from "../src/SimulatorCollectionOutlet";
import { SimulatorContactNumbers } from "../src/SimulatorContactNumbers";
import { SimulatorSingleSelect } from "../src/SimulatorSingleSelect";
import { SimulatorStartingPositionButton } from "../src/SimulatorStartingPositionButton";
import { useSimulatorEditorSection } from "../src/useSimulatorEditorSection";
import { useSimulatorRecordSelection } from "../src/useSimulatorRecordSelection";
import { SimulatorEditor } from "../src/SimulatorEditor";
import type {
  SimulatorEditorPreviewContext,
  SimulatorEditorSectionValue,
} from "../src/editorTypes";

afterEach(cleanup);

it("ignores disabled tree activation and right-arrow on a leaf without changing selection", () => {
  const select = vi.fn();
  const props = {
    title: "Records",
    nodes: [{ id: "one", label: "Leaf" }],
    onSelect: select,
    onAdd: vi.fn(),
    onAddChild: vi.fn(),
    onRemove: vi.fn(),
  };
  const view = render(<SimulatorCollectionTree {...props} />);
  const leaf = screen.getByRole("treeitem", { name: "Leaf" });
  leaf.focus();
  fireEvent.keyDown(leaf, { key: "ArrowRight" });
  expect(leaf).toHaveFocus();
  expect(select).not.toHaveBeenCalled();
  view.rerender(
    <SimulatorCollectionContext.Provider
      value={{ target: document.body, disabled: true, selectGroup: vi.fn() }}
    >
      <SimulatorCollectionTree {...props} />
    </SimulatorCollectionContext.Provider>,
  );
  fireEvent.click(screen.getByRole("treeitem", { name: "Leaf" }));
  expect(select).not.toHaveBeenCalled();
});

it("retains an unfinished number while focus stays in the picker and ignores empty tags", () => {
  const changed = vi.fn();
  render(<SimulatorContactNumbers value={["111"]} onChange={changed} />);
  const field = screen.getByRole("combobox", { name: "Contact numbers" });
  fireEvent.focus(field);
  fireEvent.change(field, { target: { value: "222" } });
  fireEvent.blur(field, { relatedTarget: screen.getByRole("button", { name: "Remove 111" }) });
  fireEvent.keyDown(field, { key: "Tab" });
  expect(changed).not.toHaveBeenCalled();
  expect(field).toHaveValue("222");
  fireEvent.keyDown(field, { key: ";" });
  expect(changed).toHaveBeenCalledExactlyOnceWith(["111", "222"]);
  fireEvent.change(field, { target: { value: " ; , " } });
  fireEvent.keyDown(field, { key: "Enter" });
  expect(changed).toHaveBeenCalledTimes(1);
  expect(field).toHaveValue("");
});

it("does not commit the current folder again or commit while moving to its options", () => {
  const changed = vi.fn();
  render(
    <SimulatorSingleSelect
      label="Folder"
      optionsLabel="Folders"
      value="one"
      options={[
        { value: "one", label: "First" },
        { value: "two", label: "Second" },
      ]}
      onChange={changed}
    />,
  );
  const field = screen.getByRole("combobox", { name: "Folder" });
  fireEvent.focus(field);
  const options = screen.getByRole("listbox", { name: "Folders" });
  fireEvent.blur(field, { relatedTarget: options });
  expect(screen.getByRole("listbox", { name: "Folders" })).toBeVisible();
  expect(changed).not.toHaveBeenCalled();
  fireEvent.change(options, { target: { value: "one" } });
  expect(changed).not.toHaveBeenCalled();
  expect(screen.queryByRole("listbox", { name: "Folders" })).toBeNull();
  expect(field).toHaveValue("First");
});

it("ignores an unknown preview section without replacing the current authoring tab", () => {
  const sections: SimulatorEditorSectionValue[] = [
    { key: "messages", label: "Messages", value: [] },
    { key: "email", label: "Email", value: {} },
  ];
  const hook = renderHook(() => useSimulatorEditorSection(sections));
  act(() => hook.result.current.followPreviewSection("email"));
  act(() => hook.result.current.followPreviewSection(undefined));
  expect(hook.result.current.section).toBe("email");
  expect(hook.result.current.activeShortcut).toBe("email");
});

it("clears a record selection without inventing a new preview navigation", () => {
  const navigate = vi.fn();
  const hook = renderHook(() => useSimulatorRecordSelection("email.detail", navigate));
  act(() => hook.result.current[2]("one"));
  expect(hook.result.current[0]).toBe("one");
  expect(navigate).toHaveBeenCalledOnce();
  act(() => hook.result.current[2](undefined));
  expect(hook.result.current[0]).toBeUndefined();
  expect(navigate).toHaveBeenCalledOnce();
});

it("keeps an unavailable starting position disabled and its guarded action inert", () => {
  const changed = vi.fn();
  const element: unknown = SimulatorStartingPositionButton({
    sections: [],
    disabled: false,
    onChange: changed,
  });
  if (!isValidElement<Record<string, unknown>>(element))
    throw new Error("Expected starting-position element");
  expect(element.type).toBe("button");
  expect(element.props.disabled).toBe(true);
  const activate = element.props.onClick;
  if (typeof activate !== "function") throw new Error("Expected guarded starting-position action");
  activate();
  expect(changed).not.toHaveBeenCalled();
});

const reports: Array<{
  name: string;
  select: (context: SimulatorEditorPreviewContext, id: string | undefined) => void;
  current: (context: SimulatorEditorPreviewContext) => string | undefined;
}> = [
  {
    name: "conversation",
    select: (context, id) => context.onConversationSelect?.(id),
    current: (context) => context.selectedId,
  },
  {
    name: "call",
    select: (context, id) => context.onCallSelect?.(id),
    current: (context) => context.selectedCallId,
  },
];
it.each(reports)(
  "does not switch authoring sections when preview clears its $name",
  ({ select, current }) => {
    const changed = vi.fn();
    const sections: SimulatorEditorSectionValue[] = [
      { key: "messages", label: "Messages", value: [] },
      { key: "phone", label: "Phone", value: {} },
      { key: "email", label: "Email", value: {} },
    ];
    render(
      <SimulatorEditor
        sections={sections}
        onChange={changed}
        renderPreview={(context) => (
          <>
            <button onClick={() => select(context, "one")}>Select preview record</button>
            <button onClick={() => select(context, undefined)}>Clear preview record</button>
            <output aria-label="Preview record">{current(context)}</output>
          </>
        )}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Select preview record" }));
    expect(screen.getByLabelText("Preview record")).toHaveTextContent("one");
    fireEvent.click(screen.getByRole("button", { name: "Email" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear preview record" }));
    expect(screen.getByRole("button", { name: "Email" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByLabelText("Preview record")).toBeEmptyDOMElement();
    expect(changed).not.toHaveBeenCalled();
  },
);
