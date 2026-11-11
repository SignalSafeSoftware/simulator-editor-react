import type { SimulatorContact } from "@signalsafe/simulator-core/devicePayload";
import { useId, useRef, useState } from "react";
import type { SimulatorConversation } from "./simulatorConversationAdapter.js";
import { contactNumberOptions } from "./simulatorContactNumberOptions.js";

export function SimulatorContactNumbers({
  value,
  onChange,
  contacts = [],
  conversations = [],
}: Readonly<{
  contacts?: readonly SimulatorContact[];
  conversations?: readonly SimulatorConversation[];
  value: readonly string[];
  onChange: (value: string[]) => void;
}>) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const query = draft.trim();
  const options = contactNumberOptions(contacts, conversations).filter(
    (option) =>
      !value.includes(option.number) &&
      option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  const choices =
    query && !value.includes(query) && !options.some((option) => option.number === query)
      ? [...options, { number: query, label: `Add “${query}”` }]
      : options;
  const selected = Math.min(active, choices.length - 1);
  const activeChoice = choices[selected];
  function add(text: string) {
    const additions = text
      .split(/[,;\n]/u)
      .map((number) => number.trim())
      .filter(Boolean);
    if (additions.length) onChange([...new Set([...value, ...additions])]);
    setDraft("");
    setActive(0);
  }
  return (
    <div
      className="mb-3 simulator-number-picker"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          add(draft);
          setOpen(false);
        }
      }}
    >
      <label htmlFor={id} className="form-label">
        Contact numbers
      </label>
      <div className="simulator-number-picker__control border rounded p-2 d-flex flex-wrap gap-2 align-items-center">
        {value.map((number) => (
          <span
            key={number}
            className="simulator-number-picker__tag badge bg-light text-dark border d-inline-flex align-items-center gap-2"
          >
            <span>{number}</span>
            <button
              type="button"
              className="simulator-number-picker__remove"
              aria-label={`Remove ${number}`}
              onClick={() => onChange(value.filter((entry) => entry !== number))}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={input}
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-options`}
          aria-activedescendant={open && selected >= 0 ? `${id}-option-${selected}` : undefined}
          className="form-control simulator-number-picker__input"
          value={draft}
          placeholder="Search or enter a number"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setDraft(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              setActive((current) =>
                Math.max(
                  0,
                  Math.min(choices.length - 1, current + (event.key === "ArrowDown" ? 1 : -1)),
                ),
              );
            } else if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
            } else if (event.key === "Enter" || event.key === "," || event.key === ";") {
              event.preventDefault();
              add(event.key === "Enter" && open && activeChoice ? activeChoice.number : draft);
            }
          }}
        />
      </div>
      {open &&
        (choices.length ? (
          <select
            id={`${id}-options`}
            multiple
            size={Math.max(2, Math.min(choices.length, 6))}
            aria-label="Contact number suggestions"
            value={[]}
            className="simulator-number-picker__options border rounded"
            onChange={(event) => {
              add(
                Array.from(event.currentTarget.selectedOptions, (option) => option.value).join(";"),
              );
              input.current?.focus();
            }}
          >
            {choices.map((option, index) => (
              <option
                key={option.number}
                id={`${id}-option-${index}`}
                value={option.number}
                className={`simulator-number-picker__option${selected === index ? " simulator-number-picker__option--active" : ""}`}
              >
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-muted m-0 p-2">Type a number to add it.</p>
        ))}
    </div>
  );
}
