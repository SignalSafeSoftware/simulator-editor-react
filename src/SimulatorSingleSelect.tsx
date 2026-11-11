import { useId, useRef, useState } from "react";
export interface SimulatorSelectOption {
  readonly value: string;
  readonly label: string;
}

/** One editable folder, committed on selection, Enter or leaving the field. */
export function SimulatorSingleSelect({
  label: fieldLabel,
  optionsLabel,
  allowCreate = false,
  normalize = (value: string) => value.trim(),
  value,
  options,
  onChange,
}: Readonly<{
  label: string;
  optionsLabel: string;
  allowCreate?: boolean;
  normalize?: (value: string) => string;
  value: string;
  options: readonly SimulatorSelectOption[];
  onChange: (value: string) => void;
}>) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const label = options.find((option) => option.value === value)?.label ?? value;
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const search = query?.trim() ?? "";
  const matches = options.filter(
    (option) =>
      option.label.toLowerCase().includes(search.toLowerCase()) ||
      option.value.toLowerCase().includes(search.toLowerCase()),
  );
  const canonical = normalize(search);
  const existing = options.find(
    (option) =>
      option.value.toLowerCase() === canonical.toLowerCase() ||
      option.label.toLowerCase() === search.toLowerCase(),
  );
  const choices =
    existing && search
      ? [existing, ...matches.filter((option) => option.value !== existing.value)]
      : search && allowCreate
        ? [{ value: canonical, label: `Add “${search}”` }, ...matches]
        : matches;
  function commit(next: string) {
    input.current?.focus();
    setQuery(null);
    setOpen(false);
    if (next !== value) onChange(next);
  }
  function commitQuery() {
    if (search && (existing || allowCreate)) commit(existing?.value ?? canonical);
    else {
      setQuery(null);
      setOpen(false);
    }
  }
  return (
    <div className="mb-3 position-relative">
      <label className="form-label" htmlFor={id}>
        {fieldLabel}
      </label>
      <input
        ref={input}
        id={id}
        className="form-select"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        aria-activedescendant={open && choices[highlight] ? `${id}-option-${highlight}` : undefined}
        value={query ?? label}
        onFocus={() => {
          setOpen(true);
          setHighlight(
            Math.max(
              0,
              options.findIndex((option) => option.value === value),
            ),
          );
        }}
        onClick={() => {
          setOpen(true);
          if (query === null)
            setHighlight(
              Math.max(
                0,
                options.findIndex((option) => option.value === value),
              ),
            );
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onBlur={(event) => {
          if (event.relatedTarget?.id !== `${id}-options`) commitQuery();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setQuery(null);
            setOpen(false);
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            setHighlight((current) =>
              Math.max(
                0,
                Math.min(choices.length - 1, current + (event.key === "ArrowDown" ? 1 : -1)),
              ),
            );
          }
          if (event.key === "Enter") {
            event.preventDefault();
            if (choices[highlight]) commit(choices[highlight].value);
          }
        }}
      />
      {open && (
        <select
          id={`${id}-options`}
          size={Math.max(2, Math.min(choices.length, 6))}
          aria-label={optionsLabel}
          className="simulator-number-picker__options border rounded"
          value={choices[highlight]?.value ?? ""}
          onChange={(event) => commit(event.target.value)}
          onClick={(event) => {
            if (choices.some((option) => option.value === event.currentTarget.value))
              commit(event.currentTarget.value);
          }}
          onBlur={commitQuery}
        >
          {!choices.length && (
            <option value="" disabled>
              No matches
            </option>
          )}
          {choices.map((option, index) => (
            <option
              key={option.value}
              id={`${id}-option-${index}`}
              value={option.value}
              className={`simulator-number-picker__option${highlight === index ? " simulator-number-picker__option--active" : ""}`}
            >
              {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
