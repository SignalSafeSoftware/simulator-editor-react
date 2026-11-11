import { SimulatorSingleSelect } from "./SimulatorSingleSelect.js";
import { SECRET_TYPES } from "@signalsafe/simulator-core/apps/contracts";
import { SimulatorContentFields, contentObject } from "./SimulatorContentFields.js";
import { homeContentSchema, type HomeContent } from "./simulatorHomeContent.js";
export function SimulatorVaultEntryFields({
  item,
  folders,
  onChange,
}: Readonly<{
  item: HomeContent["vault"]["items"][number];
  folders: readonly string[];
  onChange: (item: HomeContent["vault"]["items"][number]) => void;
}>) {
  function change(value: unknown) {
    const parsed = homeContentSchema.shape.vault.safeParse({ folders: [], items: [value] });
    const item = parsed.success ? parsed.data.items[0] : undefined;
    if (item) onChange(item);
  }
  return (
    <>
      <label className="form-label d-block mb-3">
        Entry type
        <select
          className="form-select"
          value={item.type}
          onChange={(e) =>
            change({
              ...item,
              type: e.target.value,
              updatedAt: new Date().toISOString(),
            })
          }
        >
          {SECRET_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <SimulatorSingleSelect
        label="Vault folder"
        optionsLabel="Vault folders"
        value={item.folder}
        options={folders.map((value) => ({ value, label: value }))}
        allowCreate
        onChange={(folder) => change({ ...item, folder, updatedAt: new Date().toISOString() })}
      />
      <SimulatorContentFields
        plain
        label="Vault entry"
        value={{
          title: item.title,
          ...(item.type === "credentials" ? { username: item.username, site: item.site } : {}),
          ...(item.type !== "note" ? { value: item.value } : {}),
          notes: item.notes,
        }}
        onChange={(next) => {
          if (contentObject(next))
            change({ ...item, ...next, updatedAt: new Date().toISOString() });
        }}
      />
    </>
  );
}
