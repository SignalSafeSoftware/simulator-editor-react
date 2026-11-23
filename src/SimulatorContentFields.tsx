import { SimulatorArrayFields } from "./SimulatorArrayFields.js";
import { simulatorEmailFolder, simulatorEmailFolders } from "./simulatorEmailFolders.js";
import { SimulatorDateTimeField } from "./SimulatorDateTimeField.js";
import { SimulatorMessageList } from "./SimulatorMessageList.js";

export function contentObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
export function contentLabel(key: string): string {
  return key.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}
/** Structured authoring of portable simulator data; never renders device screens. */
export function SimulatorContentFields({
  value,
  label,
  onChange,
  plain = false,
  inferSnippets = false,
  compactTimestamp = true,
  timestampDateLabel = "Date",
  requiredTimestamp = false,
}: Readonly<{
  value: unknown;
  label: string;
  onChange: (value: unknown) => void;
  plain?: boolean;
  inferSnippets?: boolean;
  compactTimestamp?: boolean;
  timestampDateLabel?: string;
  requiredTimestamp?: boolean;
}>) {
  const special = renderSpecialField(
    value,
    label,
    onChange,
    compactTimestamp,
    timestampDateLabel,
    requiredTimestamp,
  );
  if (special !== undefined) return special;
  if (Array.isArray(value) && label === "Messages")
    return <SimulatorMessageList value={value} onChange={onChange} />;
  if (Array.isArray(value))
    return (
      <SimulatorArrayFields
        label={label}
        value={value}
        onChange={onChange}
        renderItem={(item, index, change) => (
          <SimulatorContentFields
            compactTimestamp={compactTimestamp}
            timestampDateLabel={timestampDateLabel}
            requiredTimestamp={requiredTimestamp}
            inferSnippets={inferSnippets}
            label={`${label} ${index + 1}`}
            value={item}
            onChange={change}
          />
        )}
      />
    );
  if (contentObject(value))
    return (
      <fieldset
        className={
          plain || label === "Messages" || label === "Thread detail"
            ? "mb-3"
            : "border rounded p-3 mb-3"
        }
      >
        {!plain && label !== "Messages" && (
          <legend className="float-none w-auto h6">{label}</legend>
        )}
        {Object.entries(value)
          .filter(
            ([key]) =>
              !(inferSnippets && key === "snippet") &&
              !(label === "Incoming call" && key === "caller_title"),
          )
          .map(([key, item]) => (
            <SimulatorContentFields
              key={key}
              compactTimestamp={compactTimestamp}
              timestampDateLabel={timestampDateLabel}
              requiredTimestamp={requiredTimestamp}
              inferSnippets={inferSnippets}
              label={contentLabel(key)}
              value={item}
              onChange={(next) => onChange({ ...value, [key]: next })}
            />
          ))}
      </fieldset>
    );
  return (
    <div className="mb-3">
      <label className="form-label d-block">
        {label}
        {renderPrimitiveField(value, label, onChange)}
      </label>
    </div>
  );
}

function renderSpecialField(
  value: unknown,
  label: string,
  onChange: (value: unknown) => void,
  compactTimestamp: boolean,
  timestampDateLabel: string,
  requiredTimestamp: boolean,
) {
  if (label === "Folder id")
    return (
      <label className="form-label d-block mb-3">
        Folder{" "}
        <select
          className="form-select"
          value={simulatorEmailFolder(value)}
          onChange={(event) => onChange(event.target.value)}
        >
          {simulatorEmailFolders.map((folder) => (
            <option key={folder.value} value={folder.value}>
              {folder.label}
            </option>
          ))}
        </select>
      </label>
    );
  if (label === "Timestamp" && typeof value === "string")
    return (
      <SimulatorDateTimeField
        value={value}
        onChange={onChange}
        compact={compactTimestamp}
        required={requiredTimestamp}
        dateLabel={timestampDateLabel}
        label={compactTimestamp ? "Sent date and time" : "Timestamp"}
      />
    );
  if (label === "Direction")
    return (
      <label className="form-label d-block mb-3">
        Direction{" "}
        <select
          className="form-select"
          aria-label="Direction"
          value={typeof value === "string" ? value : "in"}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="in">Incoming</option>
          <option value="out">Outgoing</option>
          <option value="missed">Missed</option>
          <option value="voicemail">Voicemail</option>
        </select>
      </label>
    );
  if (label === "Duration seconds")
    return (
      <label className="form-label d-block mb-3">
        Duration seconds{" "}
        <input
          type="number"
          min={0}
          step={1}
          className="form-control"
          value={typeof value === "number" ? value : ""}
          onChange={(event) => {
            const next = event.target.valueAsNumber;
            if (Number.isInteger(next) && next >= 0) onChange(next);
          }}
        />
      </label>
    );
  if (label === "From" && (value === "them" || value === "me"))
    return (
      <label className="form-label d-block mb-3">
        Sender{" "}
        <select
          className="form-select"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="them">Other person</option>
          <option value="me">Learner</option>
        </select>
      </label>
    );
  if (label === "Delay seconds") return renderDelayField(value, onChange);
  return undefined;
}

function renderPrimitiveField(value: unknown, label: string, onChange: (value: unknown) => void) {
  if (typeof value === "boolean")
    return (
      <input
        type="checkbox"
        className="form-check-input ms-2"
        checked={value}
        onChange={(event) => onChange(event.target.checked)}
      />
    );
  if (typeof value === "number")
    return (
      <input
        type="number"
        className="form-control"
        value={value}
        onChange={(event) => {
          if (event.target.value !== "" && Number.isFinite(event.target.valueAsNumber))
            onChange(event.target.valueAsNumber);
        }}
      />
    );
  if (value === null) return <span className="text-muted ms-2">Not set</span>;
  if (
    typeof value === "string" &&
    (label === "Text" ||
      label === "Content" ||
      label === "Body" ||
      label === "Transcript" ||
      label === "Description" ||
      label === "Notes" ||
      label === "Caption" ||
      value.length > 120 ||
      value.includes("\n"))
  )
    return (
      <textarea
        aria-label={label}
        className="form-control"
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  return (
    <input
      className="form-control"
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function renderDelayField(value: unknown, onChange: (value: unknown) => void) {
  return (
    <label className="form-label d-block mb-3">
      Delay seconds{" "}
      <input
        type="number"
        className="form-control"
        min={0}
        step="any"
        value={typeof value === "number" || typeof value === "string" ? value : ""}
        onChange={(event) => {
          const next = event.target.valueAsNumber;
          if (event.target.value !== "" && Number.isFinite(next) && next >= 0) onChange(next);
        }}
      />
    </label>
  );
}
