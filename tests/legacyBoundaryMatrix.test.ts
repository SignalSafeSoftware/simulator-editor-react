import { afterEach, expect, it, vi } from "vitest";
import { contactDetails } from "../src/contactModel";
import {
  readSimulatorConversation,
  writeSimulatorConversation,
  sortConversationMessages,
} from "../src/simulatorConversationAdapter";
import { emailMessages } from "../src/simulatorEmailContent";
import { homeContentComplete, changeVaultFolder } from "../src/simulatorHomeContent";
import { contactNumberOptions } from "../src/simulatorContactNumberOptions";
afterEach(() => vi.restoreAllMocks());
it("handles sparse legacy contacts, absent email details and empty vault folders", () => {
  expect(
    contactDetails({
      display_name: "Example",
      phone_numbers: [{ value: "111" }],
      email_addresses: [{ value: "a@example.test" }],
    }),
  ).toMatchObject({ preferredPhone: expect.any(String), preferredEmail: expect.any(String) });
  expect(contactNumberOptions([{ id: "one", display_name: "Example" }], [])).toEqual([]);
  expect(emailMessages({ messages: [{ id: "one", subject: "Example" }] })).toHaveLength(1);
  expect(homeContentComplete(false)).toBe(false);
  expect(changeVaultFolder({ folders: ["Empty"], items: [] }, "Empty", null, "Unfiled")).toEqual({
    folders: [],
    items: [],
  });
});
it("migrates partial legacy conversations by identity, number, and a lone summary", () => {
  for (const source of [
    null,
    {
      threads: [null, { id: "one", contact_name: "Example", contact_number: "111" }],
      thread_detail: { sender_number: "111" },
    },
    { threads: [{ id: "one", contact_name: "Example" }], thread_detail: {} },
    { threads: [{ id: "one" }, { id: "two" }], thread_detail: {} },
    { threads: [null], thread_detail: { messages: false } },
    { threads: false, thread_detail: false },
  ]) {
    const read = readSimulatorConversation(source);
    expect(Array.isArray(read.messages)).toBe(true);
    const result = writeSimulatorConversation(source, {
      contact_name: "Example",
      contact_number: "111",
      last_at: "",
      messages: [],
    });
    expect(result).toHaveProperty("thread_detail");
  }
  expect(
    sortConversationMessages([
      null,
      { timestamp: "legacy" },
      { timestamp: "2026-11-11T00:00:00Z" },
    ]),
  ).toEqual([{ timestamp: "2026-11-11T00:00:00Z" }, null, { timestamp: "legacy" }]);
});
it("retains country and currency codes when a runtime has no display names", async () => {
  vi.spyOn(Intl.DisplayNames.prototype, "of").mockReturnValue(undefined);
  vi.resetModules();
  const { regionalCountryOptions, regionalCurrencyOptions } =
    await import("../src/simulatorRegionalOptions");
  expect(regionalCountryOptions[0]?.label).toMatch(/^([A-Z]+) — \1$/);
  expect(regionalCurrencyOptions[0]?.label).toMatch(/^([A-Z]+) — \1$/);
});
it("merges a matching email detail and keeps unrelated vault entries unchanged", () => {
  expect(
    emailMessages({
      messages: [{ id: "one", subject: "Before" }],
      detail: { id: "one", subject: "After" },
    })[0],
  ).toMatchObject({ subject: "After" });
  expect(
    contactDetails({ number: "missing", phone_numbers: [{ value: "111" }] }).preferredPhone,
  ).toBe("-phone-0");
  const entry = {
    id: "one",
    title: "Example",
    type: "note" as const,
    folder: "Other",
    value: "fictional",
    username: "",
    site: "",
    notes: "",
    createdAt: "2026-11-11T00:00:00Z",
    updatedAt: "2026-11-11T00:00:00Z",
  };
  expect(
    changeVaultFolder({ folders: ["Work", "Other"], items: [entry] }, "Work", "Renamed", "Unfiled")
      .items,
  ).toEqual([entry]);
});
