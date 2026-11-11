import { contentObject, SimulatorContentFields } from "./SimulatorContentFields.js";
export function SimulatorMessageFields({
  item,
  index,
  contactNumbers,
  onChange,
}: Readonly<{
  item: unknown;
  index: number;
  contactNumbers: readonly string[];
  onChange: (next: unknown) => void;
}>) {
  return (
    <>
      {contentObject(item) && (
        <label className="form-label d-block mb-3">
          Sender
          <select
            aria-label="Sender"
            className="form-select"
            value={
              typeof item.sender_number === "string"
                ? item.sender_number
                : item.from === "them"
                  ? (contactNumbers[0] ?? "")
                  : ""
            }
            onChange={(event) =>
              onChange({ ...item, from: "them", sender_number: event.target.value })
            }
          >
            <option value="">Choose a contact number</option>
            {[...new Set(contactNumbers)].map((number) => (
              <option key={number} value={number}>
                {number}
              </option>
            ))}
          </select>
        </label>
      )}
      <SimulatorContentFields
        requiredTimestamp
        compactTimestamp
        timestampDateLabel="Sent Date"
        plain
        label={`Message ${index + 1} details`}
        value={
          contentObject(item)
            ? {
                ...Object.fromEntries(
                  Object.entries(item).filter(
                    ([key]) => !["id", "from", "sender_number", "delay_seconds"].includes(key),
                  ),
                ),
                timestamp: typeof item.timestamp === "string" ? item.timestamp : "",
              }
            : item
        }
        onChange={(next) =>
          onChange(contentObject(item) && contentObject(next) ? { ...item, ...next } : next)
        }
      />
    </>
  );
}
