import type { SimulatorContact } from "@signalsafe/simulator-core/devicePayload";
import type { SimulatorConversation } from "./simulatorConversationAdapter.js";

export interface ContactNumberOption {
  number: string;
  label: string;
}
export function contactNumberOptions(
  contacts: readonly SimulatorContact[],
  conversations: readonly SimulatorConversation[],
): ContactNumberOption[] {
  const options = new Map<string, ContactNumberOption>();
  const add = (number: string, name: string, label = "") => {
    const trimmed = number.trim();
    if (trimmed && !options.has(trimmed))
      options.set(trimmed, {
        number: trimmed,
        label: `${name ? `${name} — ` : ""}${trimmed}${label ? ` (${label})` : ""}`,
      });
  };
  for (const contact of contacts) {
    for (const phone of contact.phone_numbers ?? [])
      add(phone.number || phone.value, contact.display_name, phone.label);
    if (contact.number) add(contact.number, contact.display_name);
  }
  for (const conversation of conversations) {
    for (const number of [conversation.contact_number, ...(conversation.contact_numbers ?? [])])
      add(number, conversation.contact_name);
  }
  return [...options.values()];
}
