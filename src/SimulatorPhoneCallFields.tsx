import { SimulatorCallType } from "@signalsafe/simulator-core/phoneCalls";
import { contentObject, contentLabel, SimulatorContentFields } from "./SimulatorContentFields.js";
const CALL_TYPE_DESCRIPTIONS = {
  incoming: "Someone is calling you.",
  calling: "You’re calling someone.",
  received: "You answered their call.",
  accepted: "They answered your call.",
  missed: "You didn’t answer.",
  voicemail: "They left a message.",
  unanswered: "They didn’t answer.",
  cancelled: "You stopped calling before they answered.",
  declined: "You rejected their call.",
} satisfies Record<Exclude<SimulatorCallType, "outgoing">, string>;

export function SimulatorPhoneCallFields({
  item,
  change,
}: Readonly<{
  item: Record<string, unknown>;
  change: (next: Record<string, unknown>) => void;
}>) {
  return (
    <>
      <label className="form-label d-block mb-3">
        Call type
        <select
          className="form-select"
          aria-label="Call type"
          value={typeof item.type === "string" ? item.type : SimulatorCallType.Received}
          onChange={(event) => change({ ...item, type: event.target.value })}
        >
          {Object.values(SimulatorCallType)
            .filter((type) => type !== SimulatorCallType.Outgoing || item.type === type)
            .map((type) => (
              <option key={type} value={type}>
                {type === SimulatorCallType.Outgoing
                  ? "Outgoing (outcome unknown)"
                  : `${contentLabel(type)} — ${CALL_TYPE_DESCRIPTIONS[type]}`}
              </option>
            ))}
        </select>
      </label>
      <SimulatorContentFields
        requiredTimestamp
        label="Caller name"
        value={typeof item.name === "string" ? item.name : ""}
        onChange={(name) => change({ ...item, name })}
      />
      <SimulatorContentFields
        requiredTimestamp
        label="Phone number"
        value={typeof item.number === "string" ? item.number : ""}
        onChange={(number) => change({ ...item, number })}
      />
      <SimulatorContentFields
        requiredTimestamp
        plain
        label="Call"
        value={{
          timestamp: "",
          ...(item.type === SimulatorCallType.Voicemail ||
          item.type === SimulatorCallType.Incoming ||
          item.type === SimulatorCallType.Calling
            ? { transcript: "" }
            : { duration_seconds: 0 }),
          ...Object.fromEntries(
            Object.entries(item).filter(
              ([key]) =>
                !["id", "type", "name", "number", "caller_title", "avatar_url"].includes(key),
            ),
          ),
        }}
        onChange={(next) => {
          if (contentObject(next)) change({ ...item, ...next });
        }}
      />
    </>
  );
}
