import { contentObject, SimulatorContentFields } from "./SimulatorContentFields.js";
import { SimulatorDateTimeField } from "./SimulatorDateTimeField.js";
import { SimulatorEmailFolderSelect } from "./SimulatorEmailFolderSelect.js";
import {
  simulatorEmailFolder,
  simulatorEmailFolders,
  type SimulatorEmailFolderOption,
} from "./simulatorEmailFolders.js";
export function SimulatorEmailFields({
  item,
  update,
  folders = simulatorEmailFolders,
}: Readonly<{
  item: Record<string, unknown>;
  folders?: readonly SimulatorEmailFolderOption[];
  update: (next: Record<string, unknown>) => void;
}>) {
  return (
    <>
      <SimulatorDateTimeField
        compact
        required
        value={typeof item.date_at === "string" ? item.date_at : ""}
        label="Sent date and time"
        onChange={(date_at) => update({ ...item, date_at })}
      />
      <SimulatorEmailFolderSelect
        value={simulatorEmailFolder(item.folder_id)}
        options={folders}
        onChange={(folder_id) => update({ ...item, folder_id })}
      />
      <SimulatorContentFields
        plain
        label="Email"
        value={Object.fromEntries(
          Object.entries({
            folder_id: "inbox",
            from: "",
            to: "",
            subject: "",
            body: "",
            ...item,
          }).filter(
            ([key]) => !["id", "snippet", "date_at", "timestamp", "folder_id"].includes(key),
          ),
        )}
        onChange={(next) => {
          if (contentObject(next)) update({ ...item, ...next });
        }}
      />
    </>
  );
}
