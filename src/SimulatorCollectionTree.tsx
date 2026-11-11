import { useContext, useEffect, useId, useRef, useState } from "react";
import { ChevronRight, ChevronDown, Plus } from "lucide-react";
import {
  SimulatorCollectionContext,
  SimulatorCollectionOutlet,
} from "./SimulatorCollectionOutlet.js";
import { SimulatorEditorPanel } from "./SimulatorEditorPanel.js";
import { simulatorRowLabel } from "./simulatorRowLabel.js";
export interface SimulatorTreeNode {
  id: string;
  label: string;
  children?: SimulatorTreeNode[];
  removable?: boolean;
}
export function SimulatorCollectionTree({
  title,
  addLabel,
  nodes,
  selectedId,
  onSelect,
  onAdd,
  onAddChild,
  onRemove,
}: Readonly<{
  title: string;
  addLabel?: string;
  nodes: SimulatorTreeNode[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onAddChild: (id: string) => void;
  onRemove: (id: string) => void;
}>) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () =>
      new Set(
        [...nodes.slice(0, 1), ...nodes.filter((node) => node.id === selectedId)].map(
          (node) => node.id,
        ),
      ),
  );
  const disabled = useContext(SimulatorCollectionContext)?.disabled ?? false;
  const treeId = useId();
  const root = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const parent = nodes.find((node) => node.children?.some((child) => child.id === selectedId));
    if (parent)
      setExpanded((previous) =>
        previous.has(parent.id) ? previous : new Set([...previous, parent.id]),
      );
  }, [nodes, selectedId]);
  function toggle(id: string) {
    if (
      expanded.has(id) &&
      nodes.find((node) => node.id === id)?.children?.some((child) => child.id === selectedId)
    )
      onSelect(id);
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function row(node: SimulatorTreeNode, parent?: string) {
    const open = expanded.has(node.id);
    const group = node.children !== undefined;
    const active = selectedId === node.id;
    return (
      <li role="none" key={node.id}>
        <div
          role="treeitem"
          aria-label={node.label}
          aria-selected={active}
          aria-disabled={disabled || undefined}
          aria-expanded={group ? open : undefined}
          aria-level={parent ? 2 : 1}
          aria-owns={group && open ? `${treeId}-${node.id}` : undefined}
          data-node-id={node.id}
          data-parent-id={parent}
          tabIndex={!disabled && (active || (!selectedId && nodes[0]?.id === node.id)) ? 0 : -1}
          className={`list-group-item simulator-collection-item p-0${active ? " active" : ""}`}
          onClick={() => {
            if (!disabled) onSelect(node.id);
          }}
          onKeyDown={(event) => {
            if (disabled || event.target !== event.currentTarget) return;
            const visible = [
              ...(root.current?.querySelectorAll<HTMLElement>('[role="treeitem"]') ?? []),
            ];
            const index = visible.indexOf(event.currentTarget);
            let target: HTMLElement | undefined;
            if (event.key === "ArrowDown") target = visible[index + 1];
            else if (event.key === "ArrowUp") target = visible[index - 1];
            else if (event.key === "Home") target = visible[0];
            else if (event.key === "End") target = visible.at(-1);
            else if (event.key === "ArrowRight") {
              if (group && !open) toggle(node.id);
              else if (group) target = visible[index + 1];
            } else if (event.key === "ArrowLeft") {
              if (group && open) toggle(node.id);
              else target = visible.find((item) => item.dataset.nodeId === parent);
            } else if (event.key === "Enter" || event.key === " ") onSelect(node.id);
            else return;
            event.preventDefault();
            if (target) {
              target.focus();
              onSelect(target.dataset.nodeId ?? node.id);
            }
          }}
        >
          <div className={`d-flex align-items-center gap-2${parent ? " ps-5" : ""}`}>
            {group && (
              <button
                type="button"
                className="graph-editor-action-icon"
                aria-label={`${open ? "Collapse" : "Expand"} ${node.label}`}
                onClick={(event) => {
                  event.stopPropagation();
                  toggle(node.id);
                }}
              >
                {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
            <span className="simulator-collection-row flex-grow-1" title={node.label}>
              {simulatorRowLabel(node.label)}
            </span>
            <span className="graph-editor-choice-inspector-actions">
              {group && (
                <button
                  type="button"
                  className="graph-editor-action-icon"
                  aria-label={`Add item to ${node.label}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setExpanded((previous) => new Set([...previous, node.id]));
                    onAddChild(node.id);
                  }}
                >
                  <Plus size={16} aria-hidden="true" />
                </button>
              )}
              {node.removable !== false && (
                <button
                  type="button"
                  className="graph-editor-action-icon graph-editor-action-icon--delete"
                  aria-label={`Remove ${node.label}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemove(node.id);
                  }}
                />
              )}
            </span>
          </div>
        </div>
        {group && open && (
          <>
            {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- Nested ARIA trees require a group list, not a fieldset. */}
            <ul id={`${treeId}-${node.id}`} role="group" className="list-unstyled m-0">
              {node.children?.map((child) => row(child, node.id))}
            </ul>
          </>
        )}
      </li>
    );
  }
  return (
    <SimulatorCollectionOutlet>
      <SimulatorEditorPanel
        title={title}
        addLabel={
          addLabel ??
          `Add ${title === "Conversations" ? "conversation" : `${title.toLowerCase()} item`}`
        }
        onAdd={onAdd}
      >
        <ul
          ref={root}
          role="tree"
          aria-label={title}
          className="list-group list-group-flush list-unstyled m-0"
        >
          {nodes.map((node) => row(node))}
        </ul>
        {!nodes.length && (
          <p className="graph-editor-card__body mb-0 text-muted">No {title.toLowerCase()} yet.</p>
        )}
      </SimulatorEditorPanel>
    </SimulatorCollectionOutlet>
  );
}
