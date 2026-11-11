import { SimulatorVaultContentEditor } from "../src/SimulatorVaultContentEditor";
import type { ComponentProps } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { SimulatorCollectionTree } from "../src/SimulatorCollectionTree";
import type { SimulatorRecordList } from "../src/SimulatorRecordList";
import { SimulatorPhoneCallsEditor } from "../src/SimulatorPhoneCallsEditor";
import { SimulatorConversationsEditor } from "../src/SimulatorConversationsEditor";
import { SimulatorEmailContentEditor } from "../src/SimulatorEmailContentEditor";
import { SimulatorContactEndpointsEditor } from "../src/SimulatorContactEndpointsEditor";
const captured = vi.hoisted(() => ({
  trees: [] as ComponentProps<typeof SimulatorCollectionTree>[],
  records: [] as ComponentProps<typeof SimulatorRecordList>[],
}));
vi.mock("../src/SimulatorCollectionTree", () => ({
  SimulatorCollectionTree: (props: ComponentProps<typeof SimulatorCollectionTree>) => {
    captured.trees.push(props);
    return null;
  },
}));
vi.mock("../src/SimulatorRecordList", () => ({
  SimulatorRecordList: (props: ComponentProps<typeof SimulatorRecordList>) => {
    captured.records.push(props);
    return null;
  },
}));
afterEach(() => {
  cleanup();
  captured.trees = [];
  captured.records = [];
});
function tree() {
  const result = captured.trees.at(-1);
  if (!result) throw new Error("Tree missing");
  return result;
}
it("ignores stale conversation child actions without rewriting another conversation", () => {
  const changed = vi.fn();
  render(
    <SimulatorConversationsEditor
      value={[
        { id: "one", contact_name: "Example", contact_number: "", last_at: "", messages: [] },
      ]}
      onChange={changed}
    />,
  );
  act(() => tree().onAddChild?.("missing"));
  expect(changed).not.toHaveBeenCalled();
  act(() => tree().onRemove("missing"));
  expect(changed).not.toHaveBeenCalled();
  act(() => tree().onSelect(JSON.stringify([false, 4])));
  expect(changed).not.toHaveBeenCalled();
  act(() => tree().onRemove("one"));
  expect(changed).toHaveBeenCalledWith([]);
});
it("normalizes missing phone input and stale selections through the collection contract", () => {
  const changed = vi.fn(),
    selected = vi.fn();
  render(<SimulatorPhoneCallsEditor value={null} onChange={changed} onSelect={selected} />);
  act(() => tree().onSelect("missing"));
  expect(selected).toHaveBeenCalledWith(undefined);
  act(() => tree().onRemove("call:missing"));
  expect(changed).toHaveBeenCalledWith({ calls: [] });
});
it("ignores folder removal requests and handles a stale email selection safely", () => {
  const changed = vi.fn();
  render(<SimulatorEmailContentEditor value={{ messages: [] }} onChange={changed} />);
  act(() => tree().onRemove("folder:inbox"));
  expect(changed).not.toHaveBeenCalled();
  act(() => tree().onSelect("email:missing"));
  act(() => tree().onAdd?.());
  expect(changed).toHaveBeenCalled();
  act(() => tree().onRemove("email:missing"));
  expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ messages: [] }));
});
it("rejects stale endpoint render requests and keeps a retained preferred endpoint", () => {
  const changed = vi.fn();
  render(
    <SimulatorContactEndpointsEditor value={{ id: "one", number: "111" }} onChange={changed} />,
  );
  const phones = captured.records.find((item) => item.title === "Phone numbers");
  if (!phones?.renderEditor) throw new Error("Phone collection missing");
  expect(
    phones.renderEditor(
      { id: "missing" },
      () => {},
      () => {},
    ),
  ).toBeNull();
  const rows = phones.value;
  if (!Array.isArray(rows)) throw new Error("Phone rows missing");
  act(() => phones.onChange(rows));
  expect(changed).toHaveBeenCalledWith(
    expect.objectContaining({
      details: expect.objectContaining({ preferredPhone: "one-phone-0" }),
    }),
  );
});
it("adds email to the active item folder and clears an actively deleted email", () => {
  const changed = vi.fn();
  render(
    <SimulatorEmailContentEditor
      value={{ messages: [{ id: "one", subject: "Example", folder_id: "projects" }] }}
      selectedId="one"
      onChange={changed}
    />,
  );
  act(() => tree().onAdd());
  expect(changed).toHaveBeenCalledWith(
    expect.objectContaining({
      messages: expect.arrayContaining([expect.objectContaining({ folder_id: "projects" })]),
    }),
  );
});
it("labels malformed endpoint rows without coercing their values", () => {
  render(<SimulatorContactEndpointsEditor value={{}} onChange={vi.fn()} />);
  for (const record of captured.records) expect(record.label({ value: false })).toBe("");
});
it("maps stale Vault callbacks to safe defaults without creating extra records", () => {
  const changed = vi.fn();
  render(<SimulatorVaultContentEditor value={{ folders: [], items: [] }} onChange={changed} />);
  act(() => tree().onRemove("folder:missing"));
  expect(changed).not.toHaveBeenCalled();
  act(() => tree().onAddChild("folder:missing"));
  expect(changed).toHaveBeenCalledWith(
    expect.objectContaining({ items: [expect.objectContaining({ folder: "Unfiled" })] }),
  );
});
it("clears a deleted stale email selection to Inbox", () => {
  const changed = vi.fn();
  render(
    <SimulatorEmailContentEditor
      value={{ messages: [] }}
      selectedId="missing"
      onChange={changed}
    />,
  );
  act(() => tree().onRemove("email:missing"));
  expect(changed).toHaveBeenCalledWith(expect.objectContaining({ messages: [] }));
});
it("handles a pending entry deletion after its authored record has disappeared", () => {
  const changed = vi.fn();
  const value = {
    folders: ["Unfiled"],
    items: [
      {
        id: "one",
        title: "Example",
        type: "note" as const,
        folder: "Unfiled",
        value: "fictional",
        username: "",
        site: "",
        notes: "",
        createdAt: "2026-11-11T00:00:00Z",
        updatedAt: "2026-11-11T00:00:00Z",
      },
    ],
  };
  const view = render(
    <SimulatorVaultContentEditor value={value} selectedId="one" onChange={changed} />,
  );
  view.rerender(
    <SimulatorVaultContentEditor
      value={{ folders: ["Unfiled"], items: [] }}
      selectedId="one"
      onChange={changed}
    />,
  );
  act(() => tree().onRemove("entry:one"));
  expect(changed).toHaveBeenCalledWith({ folders: ["Unfiled"], items: [] });
});
