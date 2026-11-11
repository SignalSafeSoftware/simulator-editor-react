import { z } from "zod";
import {
  identityFromName,
  displayNameFromIdentity,
  type ContactFormDetails,
  type ContactFormValue,
} from "@signalsafe/simulator-react/views/contacts/contactFormModel";

const address = z
  .object({
    line1: z.string(),
    line2: z.string(),
    city: z.string(),
    region: z.string(),
    postalCode: z.string(),
    country: z.string(),
  })
  .strict();
const endpoint = z
  .object({
    id: z.string(),
    label: z.string(),
    value: z.string(),
    number: z.string().nullable().optional(),
    address: address.nullable().optional(),
  })
  .strict();
const detailsSchema = z
  .object({
    identity: z
      .object({ firstName: z.string(), lastName: z.string(), company: z.string() })
      .strict()
      .nullable()
      .optional(),
    phones: z.array(endpoint),
    emails: z.array(endpoint),
    addresses: z.array(endpoint),
    preferredPhone: z.string().nullable(),
    preferredEmail: z.string().nullable(),
    preferredAddress: z.string().nullable(),
  })
  .strict();
export const parseContactValue = (value: unknown): ContactFormValue => endpoint.parse(value);
export const parseContactDetails = (value: unknown): ContactFormDetails =>
  detailsSchema.parse(value);
function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
const text = (value: unknown) => (typeof value === "string" ? value : "");
export function contactDetails(value: Record<string, unknown>): ContactFormDetails {
  if (value.details !== undefined) return detailsSchema.parse(value.details);
  const id = text(value.id);
  const rows = (key: string, scalar: string, kind: string): ContactFormValue[] => {
    const entries = Array.isArray(value[key])
      ? value[key].filter(object)
      : text(value[scalar])
        ? [{ label: "", value: text(value[scalar]) }]
        : [];
    return entries.map((row, index) => ({
      id: `${id}-${kind}-${index}`,
      label: text(row.label),
      value: text(row.value),
      ...(typeof row.number === "string" ? { number: row.number } : {}),
    }));
  };
  const phones = rows("phone_numbers", "number", "phone");
  const emails = rows("email_addresses", "email", "email");
  return {
    identity: identityFromName(text(value.display_name)),
    phones,
    emails,
    addresses: [],
    preferredPhone:
      phones.find((row) => row.value === value.number || row.number === value.number)?.id ??
      phones[0]?.id ??
      null,
    preferredEmail: emails.find((row) => row.value === value.email)?.id ?? emails[0]?.id ?? null,
    preferredAddress: null,
  };
}
export function applyContactDetails(
  value: Record<string, unknown>,
  details: ContactFormDetails,
): Record<string, unknown> {
  const rows = (items: ContactFormValue[]) =>
    items.map(({ label, value: content, number }) => ({
      label,
      value: content,
      ...(number ? { number } : {}),
    }));
  const preferred = (items: ContactFormValue[], id: string | null) =>
    items.find((item) => item.id === id) ?? items[0];
  const phone = preferred(details.phones, details.preferredPhone);
  return {
    ...value,
    display_name: details.identity
      ? displayNameFromIdentity(details.identity)
      : text(value.display_name),
    number: phone?.number ?? phone?.value ?? "",
    email: preferred(details.emails, details.preferredEmail)?.value ?? "",
    phone_numbers: rows(details.phones),
    email_addresses: rows(details.emails),
    details,
  };
}
