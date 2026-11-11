import {
  identityFromName,
  type ContactFormDetails,
} from "@signalsafe/simulator-react/views/contacts/contactFormModel";
import { applyContactDetails, contactDetails } from "./contactModel.js";

export function SimulatorContactContentEditor({
  value,
  onChange,
}: Readonly<{
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}>) {
  const details = contactDetails(value);
  const identity =
    details.identity ??
    identityFromName(typeof value.display_name === "string" ? value.display_name : "");
  const update = (next: ContactFormDetails) => onChange(applyContactDetails(value, next));
  return (
    <section aria-label="Contact editor">
      {(
        [
          ["firstName", "First name"],
          ["lastName", "Last name"],
          ["company", "Company"],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="form-label d-block mb-3">
          {label}
          <input
            className="form-control"
            value={identity[key]}
            maxLength={100}
            onChange={(event) =>
              update({
                ...details,
                identity: { ...identity, [key]: event.target.value },
              })
            }
          />
        </label>
      ))}
    </section>
  );
}
