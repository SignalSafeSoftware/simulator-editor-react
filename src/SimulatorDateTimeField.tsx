import { useId, useState } from "react";

export function localDateTime(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T/u.test(value)) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 19);
}
export function displayDateTime(value: string): string {
  return localDateTime(value) ? new Date(value).toLocaleString() : value;
}
export function SimulatorDateTimeField({
  value,
  onChange,
  label = "Timestamp",
  compact = false,
  required = false,
  dateLabel = compact ? "Sent Date" : "Date",
  storage = "instant",
}: Readonly<{
  value: string;
  label?: string;
  compact?: boolean;
  required?: boolean;
  dateLabel?: string;
  /** Photo captures retain wall-clock time without converting it to a UTC instant. */
  storage?: "instant" | "local";
  onChange: (value: string) => void;
}>) {
  const id = useId();
  const local = storage === "local" ? localCaptureTime(value) : localDateTime(value);
  const [draft, setDraft] = useState({
    source: value,
    date: local.slice(0, 10),
    time: local.slice(11),
  });
  if (draft.source !== value)
    setDraft({ source: value, date: local.slice(0, 10), time: local.slice(11) });
  const validTime = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/u.test(draft.time);
  function update(date: string, time: string) {
    const valid = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/u.test(time);
    const parsed =
      date && valid ? new Date(`${date}T${time}${storage === "local" ? "Z" : ""}`) : undefined;
    const next =
      parsed && Number.isFinite(parsed.getTime())
        ? storage === "local"
          ? `${date}T${time}`
          : parsed.toISOString()
        : undefined;
    setDraft({ source: next ?? "", date, time });
    onChange(next ?? "");
  }
  return (
    <fieldset className="mb-3 simulator-date-time" aria-label={compact ? label : undefined}>
      {!compact && <legend className="form-label fs-6">{label}</legend>}
      <div className="simulator-date-time__fields">
        <div>
          <label className="form-label" htmlFor={`${id}-date`}>
            {dateLabel}
          </label>
          <input
            id={`${id}-date`}
            type="date"
            required={required}
            aria-invalid={required && draft.date === ""}
            className="form-control"
            value={draft.date}
            onChange={(event) => update(event.target.value, draft.time)}
          />
        </div>
        <div>
          <label className="form-label" htmlFor={`${id}-time`}>
            Time
          </label>
          <input
            id={`${id}-time`}
            type="time"
            step={1}
            required={required}
            className="form-control"
            placeholder="14:30"
            value={draft.time}
            aria-describedby={compact ? undefined : `${id}-help`}
            aria-invalid={(required && draft.time === "") || (draft.time !== "" && !validTime)}
            onChange={(event) => update(draft.date, event.target.value)}
          />
        </div>
      </div>
      {required && (!draft.date || !draft.time) && (
        <output className="small text-danger d-block">Enter a sent date and time.</output>
      )}
      {!compact && (
        <small id={`${id}-help`} className="text-muted">
          Local time, 24-hour format (HH:MM). Seconds are optional.
        </small>
      )}
      {value !== "" && local === "" && (
        <small className="text-muted d-block">
          Existing time: {value}. Choose a date and enter a time to replace it.
        </small>
      )}
      {draft.time !== "" && !validTime && (
        <output className="small text-danger d-block">Enter a time such as 09:30 or 14:30.</output>
      )}
      {!compact && (
        <button
          type="button"
          className="btn btn-link btn-sm d-block px-0"
          onClick={() => {
            setDraft({ source: "", date: "", time: "" });
            onChange("");
          }}
        >
          Clear timestamp
        </button>
      )}
    </fieldset>
  );
}

function localCaptureTime(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/u.test(value)) return "";
  return Number.isFinite(Date.parse(`${value}Z`)) ? value.slice(0, 19) : "";
}
