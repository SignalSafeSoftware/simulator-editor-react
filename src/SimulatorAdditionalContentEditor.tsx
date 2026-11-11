import { SimulatorPhoneCallsEditor } from "./SimulatorPhoneCallsEditor.js";
import { SimulatorRecordList } from "./SimulatorRecordList.js";
import { SimulatorContactsEditor } from "./SimulatorContactsEditor.js";
import { SimulatorContentFields, contentObject } from "./SimulatorContentFields.js";

const text = (item: Record<string, unknown>, key: string) =>
  typeof item[key] === "string" ? item[key] : "";
export function SimulatorAdditionalContentEditor({
  section,
  value,
  onChange,
  selectedCallId,
  onSelectCall,
  onSelectContact,
  onSelectBrowserPage,
}: Readonly<{
  section: string;
  value: unknown;
  onChange: (next: unknown) => void;
  selectedCallId?: string;
  onSelectBrowserPage?: (id: string | undefined) => void;
  onSelectContact?: (id: string | undefined) => void;
  onSelectCall?: (id: string | undefined) => void;
}>) {
  const object = contentObject(value) ? value : {};
  if (section === "contacts")
    return <SimulatorContactsEditor value={value} onChange={onChange} onSelect={onSelectContact} />;
  if (section === "phone")
    return (
      <SimulatorPhoneCallsEditor
        value={value}
        onChange={onChange}
        selectedId={selectedCallId}
        onSelect={onSelectCall}
      />
    );
  if (section === "internet")
    return (
      <SimulatorRecordList
        title="Browser content"
        onSelect={onSelectBrowserPage}
        value={object.pages}
        onChange={(next) => onChange({ ...object, pages: next })}
        create={() => ({ title: "", url: "", content: "" })}
        fields={{ title: "", url: "", content: "" }}
        label={(item) => text(item, "title") || text(item, "url")}
        renderEditor={(item, change) => (
          <SimulatorContentFields
            plain
            label="Browser content"
            value={{
              title: text(item, "title"),
              url: text(item, "url"),
              content: text(item, "content"),
            }}
            onChange={(next) => {
              if (contentObject(next)) change({ ...item, ...next });
            }}
          />
        )}
      />
    );
  return null;
}
