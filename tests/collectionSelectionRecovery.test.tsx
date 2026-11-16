import type { ComponentProps } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { SimulatorCollectionTree } from "../src/SimulatorCollectionTree";
import { SimulatorConversationsEditor } from "../src/SimulatorConversationsEditor";
import { SimulatorEmailContentEditor } from "../src/SimulatorEmailContentEditor";
import { SimulatorVaultContentEditor } from "../src/SimulatorVaultContentEditor";

const captured = vi.hoisted(() => ({
  trees: new Map<string, ComponentProps<typeof SimulatorCollectionTree>>(),
}));
vi.mock("../src/SimulatorCollectionTree", () => ({
  SimulatorCollectionTree: (props: ComponentProps<typeof SimulatorCollectionTree>) => {
    captured.trees.set(props.title, props);
    return null;
  },
}));
afterEach(() => {
  cleanup();
  captured.trees.clear();
});
function tree(title: string) {
  const result = captured.trees.get(title);
  if (!result) throw new Error(`Missing ${title} collection`);
  return result;
}
it("removes an unselected conversation without changing the selected conversation", () => {
  const first = { id: "one", contact_name: "First", contact_number: "", last_at: "", messages: [] };
  const second = {
    id: "two",
    contact_name: "Second",
    contact_number: "",
    last_at: "",
    messages: [],
  };
  const changed = vi.fn();
  const selected = vi.fn();
  render(
    <SimulatorConversationsEditor
      value={[first, second]}
      selectedId="one"
      onChange={changed}
      onSelect={selected}
    />,
  );
  act(() => tree("Conversations").onRemove("two"));
  expect(changed).toHaveBeenCalledExactlyOnceWith([first]);
  expect(selected).not.toHaveBeenCalled();
  expect(tree("Conversations").selectedId).toBe("one");
  expect(screen.getByDisplayValue("First")).toBeVisible();
});
it("selects folders locally and permits email selection without an optional navigation callback", () => {
  const changed = vi.fn();
  render(
    <SimulatorEmailContentEditor
      value={{ messages: [{ id: "one", subject: "Example", folder_id: "inbox" }] }}
      onChange={changed}
    />,
  );
  act(() => tree("Emails").onSelect("folder:inbox"));
  expect(screen.getByText(/1 emails in Inbox/)).toBeVisible();
  act(() => tree("Emails").onSelect("email:one"));
  expect(screen.getByDisplayValue("Example")).toBeVisible();
  expect(changed).not.toHaveBeenCalled();
});
it("keeps stale Vault selections local and recovers to a known folder without a navigation callback", () => {
  const changed = vi.fn();
  render(
    <SimulatorVaultContentEditor value={{ folders: ["Unfiled"], items: [] }} onChange={changed} />,
  );
  act(() => tree("Vault").onSelect("entry:removed"));
  expect(screen.getByText("Select a folder or entry to edit it.")).toBeVisible();
  act(() => tree("Vault").onSelect("folder:Unfiled"));
  expect(screen.getByDisplayValue("Unfiled")).toBeVisible();
  expect(changed).not.toHaveBeenCalled();
});
