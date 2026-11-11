import { SimulatorCollectionContext } from "./SimulatorCollectionOutlet.js";
import { useContext, useState } from "react";
import { contentObject } from "./SimulatorContentFields.js";
import { SimulatorEditorPanel } from "./SimulatorEditorPanel.js";
import { SimulatorRecordList } from "./SimulatorRecordList.js";
import { SimulatorContactContentEditor } from "./SimulatorContactContentEditor.js";
import { SimulatorContactEndpointsEditor } from "./SimulatorContactEndpointsEditor.js";

const contactKey = (item: Record<string, unknown>, index: number) =>
  typeof item.id === "string" ? item.id : String(index);

export function SimulatorContactsEditor({
  value,
  onChange,
  onSelect,
}: Readonly<{
  value: unknown;
  onSelect?: (id: string | undefined) => void;
  onChange: (next: Record<string, unknown>[]) => void;
}>) {
  const layout = useContext(SimulatorCollectionContext);
  const rows = Array.isArray(value) ? value.filter(contentObject) : [];
  const [selected, setSelected] = useState<string>();
  const active = rows.find((item, index) => contactKey(item, index) === selected);
  return (
    <section className="graph-editor-root" aria-label="Contacts editor">
      <SimulatorRecordList
        title="Contacts"
        value={rows}
        onChange={onChange}
        onSelect={(id) => {
          setSelected(id);
          onSelect?.(id);
        }}
        create={() => ({ display_name: "", phone_numbers: [], email_addresses: [] })}
        fields={{ display_name: "" }}
        label={(item) => (typeof item.display_name === "string" ? item.display_name : "")}
        renderEditor={(item, change) => (
          <SimulatorContactContentEditor value={item} onChange={change} />
        )}
      />
      <SimulatorCollectionContext.Provider value={null}>
        {active ? (
          <SimulatorContactEndpointsEditor
            key={contactKey(active, rows.indexOf(active))}
            value={active}
            onChange={(next) => onChange(rows.map((item) => (item === active ? next : item)))}
          />
        ) : !layout ? (
          ["Phone numbers", "Email addresses", "Postal addresses"].map((title) => (
            <SimulatorEditorPanel key={title} title={title}>
              {null}
            </SimulatorEditorPanel>
          ))
        ) : null}
      </SimulatorCollectionContext.Provider>
    </section>
  );
}
