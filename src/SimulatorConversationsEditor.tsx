import { useEffect, useRef, useState } from "react";
import type { SimulatorContact } from "@signalsafe/simulator-core/devicePayload";
import { createSimulatorId } from "@signalsafe/simulator-core/apps/id";
import { SimulatorConversationEditor } from "./SimulatorConversationEditor.js";
import { SimulatorMessageFields } from "./SimulatorMessageFields.js";
import { SimulatorEditorPanel } from "./SimulatorEditorPanel.js";
import { SimulatorCollectionTree } from "./SimulatorCollectionTree.js";
import { contentObject } from "./SimulatorContentFields.js";
import {
  conversationTime,
  sortConversationMessages,
  type SimulatorConversation,
  type AuthoredConversation,
} from "./simulatorConversationAdapter.js";
const messageKey = (message: unknown, index: number) =>
  contentObject(message) && typeof message.id === "string" ? message.id : `index:${index}`;
export function SimulatorConversationsEditor({
  value,
  onChange,
  contacts = [],
  onSelect,
  selectedId,
}: Readonly<{
  contacts?: readonly SimulatorContact[];
  selectedId?: string;
  value: AuthoredConversation[];
  onChange: (value: AuthoredConversation[]) => void;
  onSelect?: (id: string | undefined) => void;
}>) {
  const [selected, setSelected] = useState(selectedId ?? value[0]?.id);
  const [message, setMessage] = useState<string>();
  const requested = useRef(selectedId);
  useEffect(() => {
    if (selectedId !== requested.current) {
      requested.current = selectedId;
      setSelected(selectedId);
      setMessage(undefined);
    }
  }, [selectedId]);
  const active = value.find((item) => item.id === selected);
  const index = active?.messages.findIndex((entry, i) => messageKey(entry, i) === message) ?? -1;
  function select(conversation: string, child?: string) {
    setSelected(conversation);
    setMessage(child);
    requested.current = conversation;
    onSelect?.(conversation);
  }
  function update(id: string, next: SimulatorConversation) {
    onChange(value.map((item) => (item.id === id ? { ...next, id } : item)));
  }
  function messages(next: unknown[]) {
    if (active) update(active.id, { ...active, messages: next, last_at: conversationTime(next) });
  }
  function addMessage(id: string) {
    const parent = value.find((item) => item.id === id);
    if (!parent) return;
    const entry = {
      id: createSimulatorId(),
      from: "them",
      text: "",
      timestamp: "",
      sender_number: parent.contact_numbers?.[0] ?? parent.contact_number,
    };
    update(id, { ...parent, messages: [...parent.messages, entry] });
    select(id, entry.id);
  }
  const nodes = value.map((item, i) => ({
    id: item.id,
    label: item.contact_name || item.contact_number || `Conversation ${i + 1}`,
    children: item.messages.map((entry, index) => ({
      id: JSON.stringify([item.id, messageKey(entry, index)]),
      label:
        contentObject(entry) && typeof entry.text === "string" && entry.text.trim()
          ? entry.text
          : `Message ${index + 1}`,
    })),
  }));
  return (
    <section className="graph-editor-root" aria-label="Conversations editor">
      <SimulatorCollectionTree
        title="Conversations"
        nodes={nodes}
        selectedId={message && active ? JSON.stringify([active.id, message]) : selected}
        onSelect={(id) => {
          const parent = value.find((item) => item.id === id);
          if (parent) select(id);
          else {
            const pair: unknown = JSON.parse(id);
            if (Array.isArray(pair) && typeof pair[0] === "string" && typeof pair[1] === "string")
              select(pair[0], pair[1]);
          }
        }}
        onAdd={() => {
          const id = createSimulatorId();
          onChange([
            ...value,
            { id, contact_name: "", contact_number: "", last_at: "", messages: [] },
          ]);
          select(id);
        }}
        onAddChild={addMessage}
        onRemove={(id) => {
          const parent = value.find((item) => item.id === id);
          if (parent) {
            const remaining = value.filter((item) => item.id !== id);
            onChange(remaining);
            if (selected === id) select(remaining[0]?.id ?? "");
          } else {
            const node = nodes.flatMap((item) => item.children).find((item) => item.id === id);
            if (!node) return;
            const pair: unknown = JSON.parse(id);
            if (Array.isArray(pair)) {
              const owner = value.find((item) => item.id === pair[0]);
              if (owner) {
                const remaining = owner.messages.filter(
                  (entry, index) => messageKey(entry, index) !== pair[1],
                );
                update(owner.id, {
                  ...owner,
                  messages: remaining,
                  last_at: conversationTime(remaining),
                });
                select(owner.id);
              }
            }
          }
        }}
      />
      {active && (
        <SimulatorEditorPanel title={index >= 0 ? "Message" : "Conversation"}>
          <div className="graph-editor-card__body">
            {index >= 0 ? (
              <SimulatorMessageFields
                item={active.messages[index]}
                index={index}
                contactNumbers={
                  active.contact_numbers ?? (active.contact_number ? [active.contact_number] : [])
                }
                onChange={(next) => {
                  const id = message ?? createSimulatorId();
                  const updated = contentObject(next)
                    ? {
                        ...next,
                        id:
                          contentObject(active.messages[index]) &&
                          typeof active.messages[index].id === "string"
                            ? active.messages[index].id
                            : id,
                      }
                    : next;
                  messages(
                    sortConversationMessages(
                      active.messages.map((entry, i) => (i === index ? updated : entry)),
                    ),
                  );
                  if (contentObject(updated) && typeof updated.id === "string")
                    setMessage(updated.id);
                }}
              />
            ) : (
              <SimulatorConversationEditor
                contacts={contacts}
                conversations={value}
                value={active}
                onChange={(next) => update(active.id, next)}
              />
            )}
          </div>
        </SimulatorEditorPanel>
      )}
    </section>
  );
}
