import { validateDeviceJson } from "@signalsafe/simulator-core/validateDeviceJson";
import { contentObject } from "./SimulatorContentFields.js";
import {
  conversationMessages,
  conversationTime,
  type AuthoredConversation,
} from "./simulatorConversationAdapter.js";
export function parseConversations(value: unknown): AuthoredConversation[] {
  if (!Array.isArray(value)) throw new Error("Enter a conversation list.");
  const ids = new Set<string>();
  return value.map((item: unknown) => {
    if (
      !contentObject(item) ||
      typeof item.id !== "string" ||
      !item.id ||
      ids.has(item.id) ||
      typeof item.contact_name !== "string" ||
      typeof item.contact_number !== "string" ||
      (item.contact_numbers !== undefined &&
        (!Array.isArray(item.contact_numbers) ||
          item.contact_numbers.some((number: unknown) => typeof number !== "string"))) ||
      typeof item.last_at !== "string" ||
      !Array.isArray(item.messages) ||
      Object.keys(item).some(
        (key) =>
          ![
            "id",
            "contact_name",
            "contact_number",
            "contact_numbers",
            "last_at",
            "messages",
          ].includes(key),
      )
    )
      throw new Error(
        "Each conversation needs a unique id, contact name, number, time and messages.",
      );
    validateDeviceJson({
      entry_point: { app: "messages", screen: "thread_detail" },
      messages: { thread_detail: { messages: item.messages } },
    });
    ids.add(item.id);
    const messages = conversationMessages(item.messages, item.last_at);
    return {
      id: item.id,
      contact_name: item.contact_name,
      contact_number: Array.isArray(item.contact_numbers)
        ? (item.contact_numbers[0] ?? "")
        : item.contact_number,
      ...(Array.isArray(item.contact_numbers) ? { contact_numbers: item.contact_numbers } : {}),
      last_at: conversationTime(messages),
      messages,
    };
  });
}
