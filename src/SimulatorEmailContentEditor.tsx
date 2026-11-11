import { useEffect, useState } from "react";
import { createSimulatorId } from "@signalsafe/simulator-core/apps/id";
import { migrateEmailLinks } from "./emailBody.js";
import { contentObject } from "./SimulatorContentFields.js";
import { emailMessages, emailSnippet, updateEmailMessages } from "./simulatorEmailContent.js";
import { simulatorEmailFolder, emailFolderOptions } from "./simulatorEmailFolders.js";
import { SimulatorCollectionTree } from "./SimulatorCollectionTree.js";
import { SimulatorEditorPanel } from "./SimulatorEditorPanel.js";
import { SimulatorEmailFields } from "./SimulatorEmailFields.js";
export function SimulatorEmailContentEditor({
  value,
  selectedId,
  onSelect,
  onChange,
}: Readonly<{
  value: unknown;
  selectedId?: string;
  onSelect?: (id: string | undefined) => void;
  onChange: (next: unknown) => void;
}>) {
  const migrated = migrateEmailLinks(value);
  const email = contentObject(migrated) ? migrated : {};
  const rows = emailMessages(email);
  const folders = emailFolderOptions(rows);
  const [selected, setSelected] = useState(selectedId ? `email:${selectedId}` : "folder:inbox");
  useEffect(() => {
    setSelected(selectedId === undefined ? "folder:inbox" : `email:${selectedId}`);
  }, [selectedId]);
  const active = rows.find((row) => `email:${row.id}` === selected);
  const folder = folders.find((folder) => `folder:${folder.value}` === selected);
  const nodes = folders.map((folder) => ({
    id: `folder:${folder.value}`,
    label: folder.label,
    removable: false,
    children: rows
      .filter(
        (row) => simulatorEmailFolder(row.folder_id).toLowerCase() === folder.value.toLowerCase(),
      )
      .map((row) => ({ id: `email:${row.id}`, label: emailSnippet(row) || "Email" })),
  }));
  function update(next: Record<string, unknown>[]) {
    onChange(updateEmailMessages(email, next));
  }
  function add(parent?: string) {
    const target = parent ?? (active ? `folder:${active.folder_id}` : selected);
    const folder = simulatorEmailFolder(target.startsWith("folder:") ? target.slice(7) : "inbox");
    const item = {
      id: createSimulatorId(),
      subject: "",
      from: "",
      body: "",
      date_at: new Date().toISOString(),
      folder_id: folder,
    };
    update([...rows, item]);
    setSelected(`email:${item.id}`);
  }
  return (
    <div className="graph-editor-root">
      <SimulatorCollectionTree
        title="Emails"
        nodes={nodes}
        selectedId={selected}
        onSelect={(id) => {
          setSelected(id);
          if (id.startsWith("email:")) onSelect?.(id.slice(6));
        }}
        onAdd={() => add()}
        onAddChild={add}
        onRemove={(id) => {
          if (!id.startsWith("email:")) return;
          const item = rows.find((row) => `email:${row.id}` === id);
          update(rows.filter((row) => `email:${row.id}` !== id));
          if (selected === id) setSelected(`folder:${item?.folder_id ?? "inbox"}`);
        }}
      />
      {active ? (
        <SimulatorEditorPanel title="Email">
          <div className="graph-editor-card__body">
            <SimulatorEmailFields
              item={active}
              folders={folders}
              update={(next) => update(rows.map((row) => (row.id === active.id ? next : row)))}
            />
          </div>
        </SimulatorEditorPanel>
      ) : folder ? (
        <SimulatorEditorPanel title={folder.label}>
          <div className="graph-editor-card__body">
            <p>
              {
                rows.filter(
                  (row) =>
                    simulatorEmailFolder(row.folder_id).toLowerCase() ===
                    folder.value.toLowerCase(),
                ).length
              }{" "}
              emails in {folder.label}. Select an email to edit it, or use + to add one.
            </p>
          </div>
        </SimulatorEditorPanel>
      ) : null}
    </div>
  );
}
