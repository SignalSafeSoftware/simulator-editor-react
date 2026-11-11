import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { secretSchema } from "@signalsafe/simulator-core/apps/contracts";
import { SimulatorVaultContentEditor } from "../src/SimulatorVaultContentEditor";
afterEach(cleanup);
const stamp = "2026-11-11T00:00:00Z";
const draft = secretSchema.parse({
  id: "draft",
  title: "Draft",
  folder: "Unfiled",
  value: "fictional",
  username: "",
  site: "",
  notes: "",
  createdAt: stamp,
  updatedAt: stamp,
});
it("discards unsaved preview-only entries without deleting authored records", () => {
  const changed = vi.fn(),
    draftChanged = vi.fn();
  render(
    <SimulatorVaultContentEditor
      value={{ folders: ["Unfiled"], items: [] }}
      previewDraft={draft}
      selectedId="draft"
      onPreviewDraftChange={draftChanged}
      onChange={changed}
    />,
  );
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Updated draft" } });
  expect(draftChanged).toHaveBeenCalledWith(expect.objectContaining({ title: "Updated draft" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove Draft" }));
  expect(draftChanged).toHaveBeenLastCalledWith(null);
  expect(changed).not.toHaveBeenCalled();
});
it("removes a preview draft that already has an authored record and preserves other folders", () => {
  const changed = vi.fn(),
    draftChanged = vi.fn();
  render(
    <SimulatorVaultContentEditor
      value={{ folders: ["Unfiled", "Other"], items: [draft] }}
      previewDraft={draft}
      selectedId="draft"
      onPreviewDraftChange={draftChanged}
      onChange={changed}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Remove Draft" }));
  expect(draftChanged).toHaveBeenCalledWith(null);
  expect(changed).toHaveBeenCalledWith({ folders: ["Unfiled", "Other"], items: [] });
});
it("removes an unselected entry without closing the selected folder and handles empty folder lists", () => {
  const changed = vi.fn();
  render(
    <SimulatorVaultContentEditor
      value={{ folders: ["Unfiled"], items: [draft] }}
      selectedFolder="Unfiled"
      onChange={changed}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Remove Draft" }));
  expect(screen.getByLabelText("Folder name")).toHaveValue("Unfiled");
  cleanup();
  render(<SimulatorVaultContentEditor value={{ folders: [], items: [] }} onChange={changed} />);
  expect(screen.getByText(/Select a folder/)).toBeTruthy();
});
it("preserves sibling entries across entry edits and folder renames and reports new folders", () => {
  const changed = vi.fn(),
    navigate = vi.fn(),
    other = { ...draft, id: "other", title: "Other", folder: "Archive" };
  const view = render(
    <SimulatorVaultContentEditor
      value={{ folders: ["Unfiled", "Archive"], items: [draft, other] }}
      selectedId="draft"
      onNavigate={navigate}
      onChange={changed}
    />,
  );
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Updated" } });
  expect(changed).toHaveBeenCalledWith(
    expect.objectContaining({ items: [expect.objectContaining({ title: "Updated" }), other] }),
  );
  fireEvent.click(screen.getByRole("treeitem", { name: "Unfiled" }));
  fireEvent.change(screen.getByLabelText("Folder name"), { target: { value: "Renamed" } });
  fireEvent.blur(screen.getByLabelText("Folder name"));
  expect(changed).toHaveBeenLastCalledWith(
    expect.objectContaining({ items: [expect.objectContaining({ folder: "Renamed" }), other] }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Add vault folder" }));
  expect(navigate).toHaveBeenLastCalledWith({ folder: "New folder" });
  view.unmount();
});
