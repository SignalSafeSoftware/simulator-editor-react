import { useState } from "react";
import type { SimulatorEditorSectionValue } from "../src/editorTypes";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { SimulatorEditor } from "../src/SimulatorEditor";
it("follows preview secret selection, expands its folder and reselects after manual navigation", () => {
  const stamp = "2026-11-10T12:00:00Z";
  const entry = {
    id: "secret-1",
    title: "Bank login",
    type: "credentials",
    folder: "Finance",
    username: "student",
    value: "fictional",
    site: "https://bank.example",
    notes: "Training",
    createdAt: stamp,
    updatedAt: stamp,
  };
  render(
    <SimulatorEditor
      sections={[
        {
          key: "vault",
          label: "Vault",
          value: { folders: ["Unfiled", "Finance"], items: [entry] },
        },
      ]}
      onChange={() => {}}
      renderPreview={(context) => (
        <button onClick={() => context.onVaultSecretSelect?.("secret-1")}>
          Open preview secret
        </button>
      )}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Open preview secret" }));
  expect(screen.getByLabelText("Title")).toHaveValue("Bank login");
  expect(screen.getByRole("treeitem", { name: "Bank login" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  fireEvent.click(screen.getByRole("treeitem", { name: "Finance" }));
  expect(screen.getByLabelText("Folder name")).toHaveValue("Finance");
  fireEvent.click(screen.getByRole("button", { name: "Open preview secret" }));
  expect(screen.getByLabelText("Title")).toHaveValue("Bank login");
});

it("follows folder/root navigation and forwards folder deletion without losing unfinished entries", () => {
  const changed = vi.fn();
  render(
    <SimulatorEditor
      sections={[{ key: "vault", label: "Vault", value: { folders: ["Unfiled"], items: [] } }]}
      onChange={changed}
      renderPreview={(context) => (
        <>
          <button onClick={() => context.onVaultFolderSelect?.("Unfiled")}>Open folder</button>
          <button onClick={() => context.onVaultFolderSelect?.(null)}>Back to folders</button>
          <button
            onClick={() => context.onVaultFolderChange?.("Unfiled", null, "Recovered secrets")}
          >
            Delete preview folder
          </button>
        </>
      )}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Open folder" }));
  expect(screen.getByLabelText("Folder name")).toHaveValue("Unfiled");
  fireEvent.click(screen.getByRole("button", { name: "Back to folders" }));
  expect(screen.queryByLabelText("Folder name")).toBeNull();
  expect(screen.getByRole("treeitem", { name: "Unfiled" })).toHaveAttribute(
    "aria-selected",
    "false",
  );
  fireEvent.click(screen.getByRole("button", { name: "Delete preview folder" }));
  expect(changed).toHaveBeenCalledWith("vault", { folders: [], items: [] });
});

it("shows a new preview draft immediately, shares edits, saves once and discards without changing authored data", () => {
  const validity = vi.fn();
  const stamp = "2026-11-10T12:00:00Z";
  function Workspace() {
    const [sections, setSections] = useState<SimulatorEditorSectionValue[]>([
      { key: "vault", label: "Vault", value: { folders: ["Work"], items: [] } },
    ]);
    return (
      <SimulatorEditor
        onValidityChange={validity}
        sections={sections}
        onChange={(key, value) =>
          setSections((current) =>
            current.map((item) => (item.key === key ? { ...item, value } : item)),
          )
        }
        renderPreview={(context) => (
          <>
            <output aria-label="Authored data">{JSON.stringify(sections[0]?.value)}</output>
            <output aria-label="Preview draft title">{context.vaultSecretDraft?.title}</output>
            <button
              onClick={() =>
                context.onVaultSecretDraftChange?.({
                  id: "new-preview",
                  title: "",
                  type: "secret",
                  folder: "Work",
                  username: "",
                  value: "",
                  site: "",
                  notes: "",
                  createdAt: stamp,
                  updatedAt: stamp,
                })
              }
            >
              New preview secret
            </button>
            <button
              onClick={() => {
                if (context.vaultSecretDraft) context.onVaultSecretSave?.(context.vaultSecretDraft);
                context.onVaultSecretDraftChange?.(null);
                context.onVaultFolderSelect?.("Work");
              }}
            >
              Save preview secret
            </button>
            <button
              onClick={() => {
                context.onVaultSecretDraftChange?.(null);
                context.onVaultFolderSelect?.("Work");
              }}
            >
              Discard preview secret
            </button>
          </>
        )}
      />
    );
  }
  render(<Workspace />);
  fireEvent.click(screen.getByRole("button", { name: "New preview secret" }));
  expect(screen.getByLabelText("Title")).toHaveValue("");
  expect(validity).toHaveBeenLastCalledWith(false);
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Draft secret" } });
  expect(screen.getByLabelText("Preview draft title")).toHaveTextContent("Draft secret");
  expect(screen.getByLabelText("Authored data")).not.toHaveTextContent("Draft secret");
  fireEvent.click(screen.getByRole("button", { name: "Discard preview secret" }));
  expect(screen.queryByRole("treeitem", { name: "Draft secret" })).toBeNull();
  expect(validity).toHaveBeenLastCalledWith(true);
  fireEvent.click(screen.getByRole("button", { name: "New preview secret" }));
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Saved secret" } });
  fireEvent.change(screen.getByLabelText("Value"), { target: { value: "fictional" } });
  fireEvent.click(screen.getByRole("button", { name: "Save preview secret" }));
  expect(screen.getByLabelText("Authored data")).toHaveTextContent("Saved secret");
  expect(screen.getAllByRole("treeitem", { name: "Saved secret" })).toHaveLength(1);
});

it("requests matching preview navigation when a tree folder or secret is selected", () => {
  const stamp = "2026-11-10T12:00:00Z";
  const secret = {
    id: "tree-secret",
    title: "Tree secret",
    type: "secret",
    folder: "Work",
    username: "",
    value: "fictional",
    site: "",
    notes: "",
    createdAt: stamp,
    updatedAt: stamp,
  };
  render(
    <SimulatorEditor
      sections={[{ key: "vault", label: "Vault", value: { folders: ["Work"], items: [secret] } }]}
      onChange={() => {}}
      renderPreview={(context) => (
        <output aria-label="Vault preview navigation">
          {JSON.stringify(context.vaultNavigation)}
        </output>
      )}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Vault" }));
  fireEvent.click(screen.getByRole("treeitem", { name: "Tree secret" }));
  expect(screen.getByLabelText("Vault preview navigation")).toHaveTextContent(
    '"secret":{"id":"tree-secret"',
  );
  expect(screen.getByLabelText("Vault preview navigation")).toHaveTextContent('"existing":true');
  fireEvent.click(screen.getByRole("treeitem", { name: "Work" }));
  expect(screen.getByLabelText("Vault preview navigation")).toHaveTextContent('"folder":"Work"');
  expect(screen.getByLabelText("Vault preview navigation")).not.toHaveTextContent("tree-secret");
});

it("opens each newly authored Vault entry in the preview without a second row click", () => {
  function Workspace() {
    const [sections, setSections] = useState<SimulatorEditorSectionValue[]>([
      { key: "vault", label: "Vault", value: { folders: ["Work"], items: [] } },
    ]);
    return (
      <SimulatorEditor
        sections={sections}
        onChange={(key, value) =>
          setSections((current) =>
            current.map((section) => (section.key === key ? { ...section, value } : section)),
          )
        }
        renderPreview={(context) => (
          <>
            <output aria-label="Preview navigation">
              {JSON.stringify(context.vaultNavigation)}
            </output>
            <output aria-label="Authored Vault">{JSON.stringify(sections[0]?.value)}</output>
          </>
        )}
      />
    );
  }
  render(<Workspace />);
  fireEvent.click(screen.getByRole("button", { name: "Vault" }));
  for (const revision of [1, 2]) {
    fireEvent.click(screen.getByRole("button", { name: "Add item to Work" }));
    const authored = screen.getByLabelText("Authored Vault").textContent;
    expect(screen.getByLabelText("Preview navigation").textContent).toContain(
      `"revision":${revision}`,
    );
    expect(screen.getByLabelText("Preview navigation").textContent).toContain('"existing":true');
    expect(screen.getByLabelText("Preview navigation").textContent).toContain('"folder":"Work"');
    expect(screen.getByLabelText("Title")).toHaveValue("New note");
    expect(authored).toContain('"title":"New note"');
  }
});
