import { contentObject } from "./SimulatorContentFields.js";

interface EmailLink {
  href: string;
  text: string;
  title?: string;
}
function isEmailLink(value: unknown): value is EmailLink {
  return (
    contentObject(value) &&
    typeof value.href === "string" &&
    typeof value.text === "string" &&
    (value.title === undefined || typeof value.title === "string") &&
    Object.keys(value).every((key) => ["href", "text", "title"].includes(key))
  );
}
function containsUrl(body: string, href: string): boolean {
  return body
    .split(/\s+/u)
    .some(
      (token) => token === href || token.replace(/^[<([{ '"“‘]+|[>\])}'"”’,.;!]+$/gu, "") === href,
    );
}
/** Convert valid legacy metadata once; preserve unrecognized data for JSON repair. */
function messageBody(value: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(value.links) || !value.links.every(isEmailLink)) return value;
  let body =
    typeof value.body === "string"
      ? value.body
      : typeof value.snippet === "string"
        ? value.snippet
        : "";
  for (const link of value.links) {
    const parts = [...new Set([link.text.trim(), link.title?.trim() ?? ""])].filter(
      (part) => part && !body.includes(part),
    );
    const href = link.href.trim();
    if (href && !containsUrl(body, href)) parts.push(href);
    if (parts.length) body = [body, parts.join("\n")].filter(Boolean).join("\n\n");
  }
  const next = Object.fromEntries(Object.entries(value).filter(([key]) => key !== "links"));
  return body || typeof value.body === "string" ? { ...next, body } : next;
}
export function migrateEmailLinks(value: unknown): unknown {
  if (!contentObject(value)) return value;
  return {
    ...messageBody(value),
    ...(Array.isArray(value.messages)
      ? {
          messages: value.messages.map((item: unknown) =>
            contentObject(item) ? messageBody(item) : item,
          ),
        }
      : {}),
    ...(contentObject(value.detail) ? { detail: messageBody(value.detail) } : {}),
  };
}
