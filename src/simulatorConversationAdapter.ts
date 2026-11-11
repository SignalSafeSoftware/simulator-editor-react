import { createSimulatorId } from "@signalsafe/simulator-core/apps/id";
/** Portable conversation authoring and canonical device-message projection. */
function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}
function matchingSummary(
  rows: unknown[],
  detail: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const match =
    typeof detail.id === "string" && detail.id
      ? rows.find((row) => object(row) && row.id === detail.id)
      : (rows.find(
          (row) =>
            object(row) &&
            typeof detail.sender_number === "string" &&
            row.contact_number === detail.sender_number,
        ) ?? (rows.length === 1 ? rows[0] : undefined));
  return object(match) ? match : undefined;
}
/** Keep dated messages chronological and preserve stable ordering for ties and legacy values. */
export function sortConversationMessages(messages: readonly unknown[]): unknown[] {
  const timestamp = (message: unknown): number => {
    const value = object(message) ? text(message.timestamp) : "";
    const parsed = /^\d{4}-\d{2}-\d{2}T/u.test(value) ? Date.parse(value) : NaN;
    return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
  };
  return [...messages].sort((left, right) => {
    const a = timestamp(left);
    const b = timestamp(right);
    return a === b ? 0 : a < b ? -1 : 1;
  });
}
export function conversationTime(messages: readonly unknown[]): string {
  const ordered = sortConversationMessages(messages);
  const dated = ordered.filter(
    (message) =>
      object(message) &&
      /^\d{4}-\d{2}-\d{2}T/u.test(text(message.timestamp)) &&
      Number.isFinite(Date.parse(text(message.timestamp))),
  );
  const latest = dated.length
    ? dated[dated.length - 1]
    : [...ordered].reverse().find((message) => object(message) && text(message.timestamp));
  return object(latest) ? text(latest.timestamp) : "";
}
/** Preserve a legacy conversation time on its final message when it had no timestamp. */
export function conversationMessages(messages: readonly unknown[], legacyTime: unknown): unknown[] {
  const latest = messages[messages.length - 1];
  if (!object(latest) || latest.timestamp !== undefined || !text(legacyTime))
    return sortConversationMessages(messages);
  return sortConversationMessages(
    messages.map((message, index) =>
      index === messages.length - 1 ? { ...latest, timestamp: text(legacyTime) } : message,
    ),
  );
}
export interface SimulatorConversation {
  contact_name: string;
  contact_number: string;
  contact_numbers?: string[];
  last_at: string;
  messages: unknown[];
}
export function readSimulatorConversation(value: unknown): SimulatorConversation {
  const source = object(value) ? value : {};
  const detail = object(source.thread_detail) ? source.thread_detail : {};
  const summaries: unknown[] = Array.isArray(source.threads) ? source.threads : [];
  const summary = matchingSummary(summaries, detail) ?? {};
  const messages = conversationMessages(
    Array.isArray(detail.messages) ? detail.messages : [],
    detail.last_at ?? summary.last_at,
  );
  return {
    contact_name: text(detail.sender_display_name ?? summary.contact_name),
    contact_number: text(detail.sender_number ?? summary.contact_number),
    last_at: conversationTime(messages),
    messages,
  };
}
export function writeSimulatorConversation(
  source: unknown,
  edited: unknown,
): Record<string, unknown> {
  if (
    !object(edited) ||
    typeof edited.contact_name !== "string" ||
    typeof edited.contact_number !== "string" ||
    typeof edited.last_at !== "string" ||
    !Array.isArray(edited.messages) ||
    Object.keys(edited).some(
      (key) =>
        !["contact_name", "contact_number", "contact_numbers", "last_at", "messages"].includes(key),
    )
  )
    throw new Error(
      "Enter a conversation with contact_name, contact_number, last_at and messages.",
    );
  const base = object(source) ? source : {};
  const detail = object(base.thread_detail) ? base.thread_detail : {};
  const rows: unknown[] = Array.isArray(base.threads) ? base.threads : [];
  const existing = matchingSummary(rows, detail);
  const id =
    typeof detail.id === "string" && detail.id
      ? detail.id
      : typeof existing?.id === "string" && existing.id
        ? existing.id
        : createSimulatorId();
  const messages = conversationMessages(edited.messages, edited.last_at);
  const lastAt = conversationTime(messages);
  const latest: unknown = messages[messages.length - 1];
  const snippet = object(latest) ? text(latest.text).replace(/\s+/gu, " ").trim() : "";
  const summary = {
    ...(object(existing) ? existing : {}),
    id,
    contact_name: edited.contact_name,
    contact_number: edited.contact_number,
    last_at: lastAt,
    snippet,
  };
  const threads = rows.some((row) => object(row) && row.id === id)
    ? rows.map((row) => (object(row) && row.id === id ? summary : row))
    : [...rows, summary];
  return {
    ...base,
    threads,
    thread_detail: {
      ...detail,
      id,
      sender_display_name: edited.contact_name,
      sender_number: edited.contact_number,
      last_at: lastAt,
      messages,
    },
  };
}

export interface AuthoredConversation extends SimulatorConversation {
  id: string;
}
