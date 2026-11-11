import type { VaultNavigation } from "@signalsafe/simulator-react/apps/vault/Vault";
import type { Secret } from "@signalsafe/simulator-core/apps/contracts";
import { useState } from "react";
import { createSimulatorId } from "@signalsafe/simulator-core/apps/id";
import { DEFAULT_VAULT_FOLDER } from "@signalsafe/simulator-core/apps/contracts";
import { SimulatorCollectionTree } from "./SimulatorCollectionTree.js";
import { SimulatorEditorPanel } from "./SimulatorEditorPanel.js";
import { SimulatorVaultEntryFields } from "./SimulatorVaultEntryFields.js";
import { changeVaultFolder, type HomeContent } from "./simulatorHomeContent.js";
// Matches the device Vault recovery destination when Unfiled is removed.
const RECOVERED_VAULT_FOLDER = "Recovered secrets";
const folderKey = (folder: string) => `folder:${encodeURIComponent(folder)}`;
export function SimulatorVaultContentEditor({
  onNavigate,
  previewDraft,
  onPreviewDraftChange,
  selectedFolder,
  selectedId,
  value,
  onChange,
}: Readonly<{
  onNavigate?: (target: Omit<VaultNavigation, "revision">) => void;
  previewDraft?: Secret | null;
  onPreviewDraftChange?: (draft: Secret | null) => void;
  selectedFolder?: string | null;
  selectedId?: string;
  value: HomeContent["vault"];
  onChange: (value: HomeContent["vault"]) => void;
}>) {
  const items = previewDraft
    ? [...value.items.filter((item) => item.id !== previewDraft.id), previewDraft]
    : value.items;
  const folders = [...new Set([...value.folders, ...items.map((item) => item.folder)])];
  const [selected, setSelected] = useState(
    selectedId && items.some((item) => item.id === selectedId)
      ? `entry:${selectedId}`
      : selectedFolder === null
        ? "root"
        : folderKey(selectedFolder ?? folders[0] ?? DEFAULT_VAULT_FOLDER),
  );
  const [error, setError] = useState("");
  const active = items.find((item) => `entry:${item.id}` === selected);
  const folder = folders.find((folder) => folderKey(folder) === selected);
  function addEntry(parent: string) {
    const target = folders.find((folder) => folderKey(folder) === parent) ?? DEFAULT_VAULT_FOLDER;
    const now = new Date().toISOString();
    const item = {
      id: createSimulatorId(),
      title: "New note",
      type: "note" as const,
      folder: target,
      username: "",
      value: "",
      site: "",
      notes: "",
      createdAt: now,
      updatedAt: now,
    };
    onChange({ ...value, folders, items: [...value.items, item] });
    setSelected(`entry:${item.id}`);
    onNavigate?.({ folder: target, secret: item, existing: true });
  }
  function addFolder() {
    let name = "New folder";
    let index = 2;
    while (folders.includes(name)) name = `New folder ${index++}`;
    onChange({ ...value, folders: [...folders, name] });
    setSelected(folderKey(name));
    onNavigate?.({ folder: name });
    setError("");
  }
  function renameFolder(previous: string, next: string) {
    const name = next.trim();
    if (!name || name.length > 200) {
      setError("Enter a folder name between 1 and 200 characters.");
      return;
    }
    if (
      folders.some((folder) => folder !== previous && folder.toLowerCase() === name.toLowerCase())
    ) {
      setError("A folder with this name already exists.");
      return;
    }
    onChange({
      ...value,
      folders: folders.map((folder) => (folder === previous ? name : folder)),
      items: value.items.map((item) =>
        item.folder === previous ? { ...item, folder: name } : item,
      ),
    });
    setSelected(folderKey(name));
    setError("");
  }
  return (
    <div className="graph-editor-root">
      <SimulatorCollectionTree
        title="Vault"
        addLabel="Add vault folder"
        nodes={folders.map((folder) => ({
          id: folderKey(folder),
          label: folder,
          children: items
            .filter((item) => item.folder === folder)
            .map((item) => ({ id: `entry:${item.id}`, label: item.title || "Untitled entry" })),
        }))}
        selectedId={selected}
        onSelect={(id) => {
          const secret = items.find((item) => `entry:${item.id}` === id);
          const folder = folders.find((name) => folderKey(name) === id);
          if (secret)
            onNavigate?.({
              folder: secret.folder,
              secret,
              existing: value.items.some((item) => item.id === secret.id),
            });
          else if (folder) onNavigate?.({ folder });
          setSelected(id);
          setError("");
        }}
        onAdd={addFolder}
        onAddChild={addEntry}
        onRemove={(id) => {
          if (id.startsWith("entry:")) {
            if (previewDraft && id === `entry:${previewDraft.id}`) {
              onPreviewDraftChange?.(null);
              if (!value.items.some((item) => item.id === previewDraft.id)) {
                setSelected(folderKey(previewDraft.folder));
                return;
              }
            }
            const item = value.items.find((item) => `entry:${item.id}` === id);
            onChange({ ...value, items: value.items.filter((item) => `entry:${item.id}` !== id) });
            if (selected === id) setSelected(folderKey(item?.folder ?? DEFAULT_VAULT_FOLDER));
          } else {
            const removed = folders.find((folder) => folderKey(folder) === id);
            if (!removed) return;
            const destination =
              removed === DEFAULT_VAULT_FOLDER ? RECOVERED_VAULT_FOLDER : DEFAULT_VAULT_FOLDER;
            onChange(changeVaultFolder(value, removed, null, destination));
            setSelected("root");
            setError("");
          }
        }}
      />
      {active ? (
        <SimulatorEditorPanel title="Vault entry">
          <div className="graph-editor-card__body">
            <SimulatorVaultEntryFields
              item={active}
              folders={folders}
              onChange={(next) =>
                active.id === previewDraft?.id
                  ? onPreviewDraftChange?.(next)
                  : onChange({
                      ...value,
                      folders: [...new Set([...folders, next.folder])],
                      items: value.items.map((item) => (item.id === active.id ? next : item)),
                    })
              }
            />
          </div>
        </SimulatorEditorPanel>
      ) : folder ? (
        <SimulatorEditorPanel title="Vault folder">
          <div className="graph-editor-card__body">
            <label className="form-label d-block mb-3">
              Folder name
              <input
                key={folder}
                className="form-control"
                defaultValue={folder}
                maxLength={200}
                onBlur={(event) => renameFolder(folder, event.target.value)}
              />
            </label>
            <p>
              {items.filter((item) => item.folder === folder).length} entries. Select an entry to
              edit it, or use + beside the folder to add one.
            </p>
            {error && (
              <p role="alert" className="text-danger">
                {error}
              </p>
            )}
          </div>
        </SimulatorEditorPanel>
      ) : (
        <SimulatorEditorPanel title="Vault">
          <div className="graph-editor-card__body">Select a folder or entry to edit it.</div>
        </SimulatorEditorPanel>
      )}
    </div>
  );
}
