import { unifyPhoneCalls } from "@signalsafe/simulator-core/phoneCalls";
import { validateDeviceJson } from "@signalsafe/simulator-core/validateDeviceJson";
import { contentObject } from "./SimulatorContentFields.js";
import { localDateTime } from "./SimulatorDateTimeField.js";
const dated = (value: unknown) => typeof value === "string" && localDateTime(value) !== "";
/** Conversation time is derived: each conversation needs a message, and all messages need dates. */
export function missingConversationDates(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.some(
      (conversation) =>
        !contentObject(conversation) ||
        !Array.isArray(conversation.messages) ||
        conversation.messages.length === 0 ||
        conversation.messages.some(
          (message) => !contentObject(message) || !dated(message.timestamp),
        ),
    )
  );
}
/** Authoring requirement only; legacy persisted snapshots retain their read compatibility. */
export function missingCallDates(phone: unknown): boolean {
  if (!contentObject(phone)) return false;
  try {
    const device = { entry_point: { app: "phone", screen: "history" }, phone };
    validateDeviceJson(device);
    return unifyPhoneCalls(device.phone).some((call) => !dated(call.timestamp));
  } catch {
    return true;
  }
}
