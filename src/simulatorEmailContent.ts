import { emptySimulatorStore } from "@signalsafe/simulator-core/apps/contracts";
import { contentObject } from "./SimulatorContentFields.js";
import { simulatorEmailFolder } from "./simulatorEmailFolders.js";
import { simulatorRowLabel } from "./simulatorRowLabel.js";

const text = (value: unknown): string => (typeof value === "string" ? value : "");
export function emailSnippet(message: Record<string, unknown>): string {
  return simulatorRowLabel(text(message.subject).trim() || text(message.body));
}
const sentTime = (message: Record<string, unknown>): number => {
  const time = Date.parse(text(message.date_at));
  return Number.isFinite(time) ? time : 0;
};
/** Join legacy list/detail data into complete editable records, retaining stable internal IDs. */
export function emailMessages(email: Record<string, unknown>): Record<string, unknown>[] {
  const rows = Array.isArray(email.messages) ? email.messages.filter(contentObject) : [];
  const detail = contentObject(email.detail) ? email.detail : undefined;
  const joined = rows.map((row) => (detail && row.id === detail.id ? { ...row, ...detail } : row));
  if (detail && !rows.some((row) => row.id === detail.id)) joined.push(detail);
  const usedIds = new Set(joined.map((row) => text(row.id)).filter(Boolean));
  const internalId = (row: Record<string, unknown>, index: number): string => {
    if (text(row.id)) return text(row.id);
    let id = `email-${index + 1}`;
    while (usedIds.has(id)) id += "-missing";
    usedIds.add(id);
    return id;
  };
  return joined
    .map((row, index) => {
      const message = {
        ...row,
        id: internalId(row, index),
        from: text(row.from),
        to: typeof row.to === "string" ? row.to : emptySimulatorStore().identity,
        subject: text(row.subject),
        body: typeof row.body === "string" ? row.body : text(row.snippet),
        date_at: text(row.date_at) || text(row.timestamp),
        folder_id: simulatorEmailFolder(row.folder_id),
      };
      return { ...message, snippet: emailSnippet(message) };
    })
    .sort((a, b) => sentTime(b) - sentTime(a));
}
/** Keep legacy selected-detail routing while making the message list authoritative. */
export function updateEmailMessages(
  email: Record<string, unknown>,
  rows: Record<string, unknown>[],
): Record<string, unknown> {
  const messages = emailMessages({ messages: rows });
  const detail = contentObject(email.detail) ? email.detail : undefined;
  const selected = detail ? messages.find((row) => row.id === detail.id) : undefined;
  const rest = Object.fromEntries(Object.entries(email).filter(([key]) => key !== "detail"));
  return { ...rest, messages, ...(selected ? { detail: selected } : {}) };
}
