import { SimulatorSingleSelect } from "./SimulatorSingleSelect.js";
import { simulatorEmailFolder, type SimulatorEmailFolderOption } from "./simulatorEmailFolders.js";
/** Email-specific system folder normalization is independent of the shared picker. */
export function SimulatorEmailFolderSelect({
  value,
  options,
  onChange,
}: Readonly<{
  value: string;
  options: readonly SimulatorEmailFolderOption[];
  onChange: (value: string) => void;
}>) {
  return (
    <SimulatorSingleSelect
      label="Folder"
      optionsLabel="Folders"
      value={value}
      options={options}
      onChange={onChange}
      allowCreate
      normalize={simulatorEmailFolder}
    />
  );
}
