import {
  SimulatorCollectionContext,
  SimulatorCollectionOutlet,
} from "./SimulatorCollectionOutlet.js";
import { useContext, useEffect, useId, useState, type ReactNode } from "react";
import { SimulatorEditorPanel } from "./SimulatorEditorPanel.js";
import { createSimulatorId } from "@signalsafe/simulator-core/apps/id";
import { contentObject, SimulatorContentFields } from "./SimulatorContentFields.js";
import { simulatorRowLabel } from "./simulatorRowLabel.js";

export function SimulatorRecordList({
  title,
  value,
  onChange,
  create,
  label,
  fields,
  renderEditor,
  identified = true,
  onSelect,
  selectedId,
}: Readonly<{
  title: string;
  selectedId?: string;
  value: unknown;
  onChange: (next: Record<string, unknown>[]) => void;
  create: () => Record<string, unknown>;
  label: (item: Record<string, unknown>) => string;
  fields: Record<string, unknown>;
  identified?: boolean;
  onSelect?: (id: string | undefined) => void;
  renderEditor?: (
    item: Record<string, unknown>,
    update: (next: Record<string, unknown>) => void,
    close: () => void,
  ) => ReactNode;
}>) {
  const rows = Array.isArray(value) ? value.filter(contentObject) : [];
  const [expanded, setExpanded] = useState<string | undefined>(selectedId);
  useEffect(() => setExpanded(selectedId), [selectedId]);
  const id = useId();
  const layout = useContext(SimulatorCollectionContext);
  const activeKey =
    layout && layout.activeGroup !== undefined && layout.activeGroup !== id ? undefined : expanded;
  const selectGroup = layout?.selectGroup;
  useEffect(() => {
    if (selectedId !== undefined) selectGroup?.(id);
  }, [selectedId, id, selectGroup]);
  function edit(item: Record<string, unknown>, index: number) {
    const update = (next: Record<string, unknown>) =>
      onChange(rows.map((row, i) => (i === index ? next : row)));
    return renderEditor ? (
      renderEditor(item, update, () => setExpanded(undefined))
    ) : (
      <SimulatorContentFields
        plain
        label={title}
        value={Object.fromEntries(
          Object.entries({ ...fields, ...item }).filter(([key]) => key !== "id"),
        )}
        onChange={(next) => {
          if (contentObject(next)) update({ ...item, ...next });
        }}
      />
    );
  }
  const activeIndex = rows.findIndex(
    (item, index) => (typeof item.id === "string" ? item.id : String(index)) === activeKey,
  );
  const active = rows[activeIndex];
  return (
    <div className="graph-editor-root">
      <SimulatorCollectionOutlet>
        <SimulatorEditorPanel
          title={title}
          addLabel={`Add ${title.toLowerCase()} item`}
          onAdd={() => {
            const item = identified ? { ...create(), id: createSimulatorId() } : create();
            onChange([...rows, item]);
            const key = typeof item.id === "string" ? item.id : String(rows.length);
            setExpanded(key);
            layout?.selectGroup(id);
            onSelect?.(key);
          }}
        >
          <div className={layout ? "list-group list-group-flush" : "graph-editor-list"}>
            {rows.map((item, index) => {
              const key = typeof item.id === "string" ? item.id : String(index);
              const open = activeKey === key;
              const text = label(item) || `${title} ${index + 1}`;
              return (
                <div
                  key={key}
                  className={
                    layout
                      ? `list-group-item simulator-collection-item p-0${open ? " active" : ""}`
                      : "graph-editor-list__item"
                  }
                >
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className={
                        layout
                          ? `list-group-item list-group-item-action simulator-collection-row flex-grow-1 border-0${open ? " active" : ""}`
                          : "graph-editor-choice-toggle flex-grow-1"
                      }
                      aria-expanded={layout ? undefined : open}
                      aria-current={layout && open ? "true" : undefined}
                      aria-controls={layout ? undefined : `${id}-${index}`}
                      aria-label={text}
                      title={text}
                      onClick={() => {
                        const next = layout || !open ? key : undefined;
                        setExpanded(next);
                        layout?.selectGroup(id);
                        onSelect?.(next);
                      }}
                    >
                      {simulatorRowLabel(text)}
                    </button>
                    <span className="graph-editor-choice-inspector-actions">
                      <button
                        type="button"
                        className="graph-editor-action-icon graph-editor-action-icon--delete"
                        aria-label={`Remove ${title.toLowerCase()} item ${index + 1}`}
                        onClick={() => {
                          onChange(rows.filter((_, i) => i !== index));
                          if (open) {
                            setExpanded(undefined);
                            onSelect?.(undefined);
                          }
                        }}
                      />
                    </span>
                  </div>
                  {!layout && (
                    <div id={`${id}-${index}`} hidden={!open} className="pt-3">
                      {open && edit(item, index)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {rows.length === 0 && (
            <p className="graph-editor-card__body mb-0 text-muted">No {title.toLowerCase()} yet.</p>
          )}
        </SimulatorEditorPanel>
      </SimulatorCollectionOutlet>
      {layout && active && (
        <SimulatorEditorPanel
          title={title === "Contacts" ? "Contact" : title === "Emails" ? "Email" : title}
        >
          <div className="graph-editor-card__body">
            <SimulatorCollectionContext.Provider value={null}>
              {edit(active, activeIndex)}
            </SimulatorCollectionContext.Provider>
          </div>
        </SimulatorEditorPanel>
      )}
    </div>
  );
}
