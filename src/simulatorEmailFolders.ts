import { mailFolderNameSchema, mailFolderSchema } from "@signalsafe/simulator-core/apps/contracts";

const folders = mailFolderSchema.enum;
export type SimulatorEmailFolderOption = Readonly<{ value: string; label: string }>;
export const simulatorEmailFolders: readonly SimulatorEmailFolderOption[] = [
  { value: folders.inbox, label: "Inbox" },
  { value: folders.drafts, label: "Draft" },
  { value: folders.sent, label: "Sent" },
  { value: folders.trash, label: "Trash" },
];

export function simulatorEmailFolder(value: unknown): string {
  const result = mailFolderNameSchema.safeParse(value);
  return result.success ? result.data : folders.inbox;
}

export function emailFolderOptions(
  rows: readonly Record<string, unknown>[],
): SimulatorEmailFolderOption[] {
  const options = new Map(simulatorEmailFolders.map((folder) => [folder.value, folder]));
  for (const row of rows) {
    const value = simulatorEmailFolder(row.folder_id);
    if (!options.has(value.toLowerCase()))
      options.set(value.toLowerCase(), { value, label: value });
  }
  return [...options.values()];
}
