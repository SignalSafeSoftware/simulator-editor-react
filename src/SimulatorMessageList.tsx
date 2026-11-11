import { SimulatorMessageFields } from "./SimulatorMessageFields.js";
import { simulatorRowLabel } from "./simulatorRowLabel.js";
import { SimulatorEditorPanel } from "./SimulatorEditorPanel.js";
import { useId, useState } from "react";

import { sortConversationMessages } from "./simulatorConversationAdapter.js";
import { contentObject } from "./SimulatorContentFields.js";

export function SimulatorMessageList({
  value,
  onChange,
  contactNumbers = [],
}: Readonly<{
  value: readonly unknown[];
  contactNumbers?: readonly string[];
  onChange: (value: unknown[]) => void;
}>) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const id = useId();
  return (
    <section className="graph-editor-root" aria-label="Message list">
      <SimulatorEditorPanel
        title="Messages"
        addLabel="Add message"
        onAdd={() => {
          onChange([
            ...value,
            {
              from: "them",
              text: "",
              timestamp: "",
              ...(contactNumbers[0] ? { sender_number: contactNumbers[0] } : {}),
            },
          ]);
          setExpanded(value.length);
        }}
      >
        <div className="graph-editor-list">
          {value.map((item, index) => {
            const text =
              contentObject(item) && typeof item.text === "string" && item.text.trim()
                ? item.text
                : `Message ${index + 1}`;
            const open = expanded === index;
            return (
              <div key={index} className="graph-editor-list__item">
                <div className="d-flex align-items-start justify-content-between gap-2">
                  <button
                    type="button"
                    className="graph-editor-choice-toggle flex-grow-1"
                    title={text}
                    aria-label={text}
                    aria-expanded={open}
                    aria-controls={`${id}-${index}`}
                    onClick={() => setExpanded(open ? null : index)}
                  >
                    {simulatorRowLabel(text)}
                  </button>
                  <fieldset
                    className="graph-editor-choice-inspector-actions border-0 p-0 m-0"
                    aria-label={`Message ${index + 1} actions`}
                  >
                    <button
                      type="button"
                      className="graph-editor-action-icon graph-editor-action-icon--delete"
                      title="Remove message"
                      aria-label={`Remove message ${index + 1}`}
                      onClick={() => {
                        onChange(value.filter((_, i) => i !== index));
                        setExpanded((current) =>
                          current === index
                            ? null
                            : current !== null && current > index
                              ? current - 1
                              : current,
                        );
                      }}
                    ></button>
                  </fieldset>
                </div>
                <div id={`${id}-${index}`} hidden={!open} className="pt-3">
                  <SimulatorMessageFields
                    item={item}
                    index={index}
                    contactNumbers={contactNumbers}
                    onChange={(updated) => {
                      const sorted = sortConversationMessages(
                        value.map((entry, i) => (i === index ? updated : entry)),
                      );
                      onChange(sorted);
                      setExpanded(sorted.indexOf(updated));
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SimulatorEditorPanel>
    </section>
  );
}
