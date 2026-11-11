import { startingScreenCollection } from "./startingScreenCollection.js";
import type { SimulatorEntryTarget } from "@signalsafe/simulator-core/devicePayload";
import type { SimulatorEditorSectionValue } from "./editorTypes.js";
import { simulatorRowLabel } from "./simulatorRowLabel.js";
import { contentObject } from "./SimulatorContentFields.js";

export interface StartingPositionOption {
  label: string;
  target: SimulatorEntryTarget;
}
const records = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter(contentObject) : [];
const label = (row: Record<string, unknown>): string => {
  for (const key of [
    "display_name",
    "contact_name",
    "caller_name",
    "title",
    "subject",
    "name",
    "number",
    "id",
  ])
    if (typeof row[key] === "string" && row[key]) return row[key];
  return "Untitled item";
};
/** Stable ids distinguish records even when their visible names are identical. */
export function startingPositionOptions(
  sections: readonly SimulatorEditorSectionValue[],
  app: string,
  screen: string,
): StartingPositionOption[] {
  screen = startingScreenCollection(app, screen);
  const section = (key: string) => sections.find((item) => item.key === key)?.value;
  const itemLabel = (row: Record<string, unknown>, kind: string, prefix: string) =>
    simulatorRowLabel(
      kind === "call"
        ? [row.timestamp, row.type, label(row)]
            .filter((part) => typeof part === "string" && part)
            .join(" · ")
        : prefix + label(row),
    );
  const items = (
    kind: "conversation" | "contact" | "call" | "email" | "photo" | "vault-entry",
    value: unknown,
    prefix = "",
  ) =>
    records(value).flatMap((row): StartingPositionOption[] =>
      typeof row.id === "string" && row.id
        ? [{ label: itemLabel(row, kind, prefix), target: { kind, id: row.id } }]
        : [],
    );
  if (app === "messages" && screen === "threads") return items("conversation", section("messages"));
  if (app === "phone" && screen === "contacts") return items("contact", section("contacts"));
  if (app === "phone" && screen === "history") {
    const phone = section("phone");
    return contentObject(phone) ? items("call", phone.calls) : [];
  }
  if (app === "email" && ["list", "outbox", "trash"].includes(screen)) {
    const email = section("email");
    return contentObject(email) ? items("email", email.messages) : [];
  }
  if (app !== "home" || screen !== "home") return [];
  const vault = section("vault");
  const photos = section("photos");
  const folders = contentObject(vault) && Array.isArray(vault.folders) ? vault.folders : [];
  return [
    { label: "Vault — all folders", target: { kind: "vault-folder", folder: null } },
    ...folders.flatMap((folder: unknown): StartingPositionOption[] =>
      typeof folder === "string"
        ? [
            {
              label: simulatorRowLabel(`Vault folder — ${folder}`),
              target: { kind: "vault-folder", folder },
            },
          ]
        : [],
    ),
    ...items("vault-entry", contentObject(vault) ? vault.items : [], "Vault entry — "),
    ...items("photo", contentObject(photos) ? photos.items : [], "Photo — "),
  ];
}
