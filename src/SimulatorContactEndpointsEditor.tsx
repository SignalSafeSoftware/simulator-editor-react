import {
  formatPostalAddress,
  postalAddressFields,
  type ContactFormDetails,
  type ContactFormValue,
} from "@signalsafe/simulator-react/views/contacts/contactFormModel";
import { applyContactDetails, contactDetails, parseContactValue } from "./contactModel.js";
import { SimulatorRecordList } from "./SimulatorRecordList.js";

export function SimulatorContactEndpointsEditor({
  value,
  onChange,
}: Readonly<{
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}>) {
  const details = contactDetails(value);
  const update = (next: ContactFormDetails) => onChange(applyContactDetails(value, next));
  function endpoints(
    kind: "phones" | "emails" | "addresses",
    title: string,
    preferredKey: "preferredPhone" | "preferredEmail" | "preferredAddress",
  ) {
    return (
      <SimulatorRecordList
        title={title}
        value={details[kind]}
        fields={{ label: "", value: "" }}
        create={() =>
          kind === "addresses"
            ? {
                label: "Home",
                value: "",
                address: {
                  line1: "",
                  line2: "",
                  city: "",
                  region: "",
                  postalCode: "",
                  country: "",
                },
              }
            : { label: kind === "phones" ? "Mobile" : "Personal", value: "" }
        }
        label={(item) => (typeof item.value === "string" ? item.value : "")}
        onChange={(next) => {
          const rows = next.map(parseContactValue);
          update({
            ...details,
            [kind]: rows,
            [preferredKey]: rows.some((row) => row.id === details[preferredKey])
              ? details[preferredKey]
              : null,
          });
        }}
        renderEditor={(item) => {
          const index = details[kind].findIndex((row) => row.id === item.id);
          const endpoint = details[kind][index];
          if (!endpoint) return null;
          const change = (patch: Partial<ContactFormValue>) =>
            update({
              ...details,
              [kind]: details[kind].map((row, i) => (i === index ? { ...row, ...patch } : row)),
            });
          const address = postalAddressFields(endpoint);
          const label =
            kind === "phones"
              ? "Phone number"
              : kind === "emails"
                ? "Email address"
                : "Postal address";
          return (
            <>
              <label className="form-label d-block mb-3">
                Label
                <input
                  className="form-control"
                  value={endpoint.label}
                  maxLength={100}
                  onChange={(event) => change({ label: event.target.value })}
                />
              </label>
              {kind === "addresses" ? (
                (
                  [
                    ["line1", "Street address"],
                    ["line2", "Address line 2"],
                    ["city", "City"],
                    ["region", "State / region"],
                    ["postalCode", "Postal code"],
                    ["country", "Country"],
                  ] as const
                ).map(([key, title]) => (
                  <label key={key} className="form-label d-block mb-3">
                    {title}
                    <input
                      className="form-control"
                      value={address[key]}
                      onChange={(event) => {
                        const next = {
                          ...address,
                          [key]: event.target.value,
                        };
                        change({
                          address: next,
                          value: formatPostalAddress(next),
                        });
                      }}
                    />
                  </label>
                ))
              ) : (
                <label className="form-label d-block mb-3">
                  {label}
                  <input
                    className="form-control"
                    type={kind === "phones" ? "tel" : "email"}
                    value={endpoint.value}
                    onChange={(event) =>
                      change({
                        value: event.target.value,
                        ...(kind === "phones" ? { number: undefined } : {}),
                      })
                    }
                  />
                </label>
              )}
              <label className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={details[preferredKey] === endpoint.id}
                  onChange={(event) =>
                    update({
                      ...details,
                      [preferredKey]: event.target.checked ? endpoint.id : null,
                    })
                  }
                />
                <span className="form-check-label">
                  Preferred {kind === "phones" ? "phone" : kind === "emails" ? "email" : "address"}
                </span>
              </label>
            </>
          );
        }}
      />
    );
  }
  return (
    <>
      {endpoints("phones", "Phone numbers", "preferredPhone")}
      {endpoints("emails", "Email addresses", "preferredEmail")}
      {endpoints("addresses", "Postal addresses", "preferredAddress")}
    </>
  );
}
