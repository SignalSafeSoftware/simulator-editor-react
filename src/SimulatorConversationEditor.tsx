import type { SimulatorContact } from "@signalsafe/simulator-core/devicePayload";
import { SimulatorContactNumbers } from "./SimulatorContactNumbers.js";
import { displayDateTime, localDateTime } from "./SimulatorDateTimeField.js";
import { conversationTime, type SimulatorConversation } from "./simulatorConversationAdapter.js";

export function SimulatorConversationEditor({
  value,
  onChange,
  contacts = [],
  conversations = [],
}: Readonly<{
  contacts?: readonly SimulatorContact[];
  conversations?: readonly SimulatorConversation[];
  value: SimulatorConversation;
  onChange: (value: SimulatorConversation) => void;
}>) {
  const timestamp = conversationTime(value.messages);
  const missingDate = localDateTime(timestamp) === "";
  const dateTime = missingDate
    ? timestamp
      ? `Date not set — ${timestamp}`
      : ""
    : displayDateTime(timestamp);
  return (
    <section aria-label="Conversation editor">
      <label className="form-label d-block mb-3">
        Contact name
        <input
          className="form-control"
          value={value.contact_name}
          onChange={(event) => onChange({ ...value, contact_name: event.target.value })}
        />
      </label>
      <SimulatorContactNumbers
        contacts={contacts}
        conversations={conversations}
        value={value.contact_numbers ?? (value.contact_number ? [value.contact_number] : [])}
        onChange={(numbers) =>
          onChange({
            ...value,
            contact_numbers: numbers,
            contact_number: numbers[0] ?? "",
          })
        }
      />
      <label className="form-label d-block mb-3">
        Conversation Date &amp; Time
        <input
          className="form-control"
          value={dateTime}
          readOnly
          aria-required="true"
          aria-invalid={missingDate}
        />
      </label>
      {missingDate && (
        <small className="text-muted d-block mb-3">
          Set the sent date and time on a message to show the full conversation date and time.
        </small>
      )}
    </section>
  );
}
