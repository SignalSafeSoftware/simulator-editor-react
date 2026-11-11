import { readHomeContent } from "../src/simulatorHomeContent";
import { useState } from "react";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { migrateEmailLinks } from "../src/emailBody";
import { emailMessages, updateEmailMessages } from "../src/simulatorEmailContent";
import { parseConversations } from "../src/parseConversations";
import { contactDetails, applyContactDetails } from "../src/contactModel";
import { startingPositionOptions } from "../src/startingPositionOptions";
import {
  SimulatorDateTimeField,
  localDateTime,
  displayDateTime,
} from "../src/SimulatorDateTimeField";
import { SimulatorContactContentEditor } from "../src/SimulatorContactContentEditor";
import type { SimulatorEditorSectionValue } from "../src/editorTypes";
afterEach(cleanup);
it("retains malformed email metadata for JSON repair and migrates valid links idempotently", () => {
  for (const value of [null, undefined, [], true, "text"])
    expect(migrateEmailLinks(value)).toEqual(value);
  for (const links of [
    false,
    [null],
    [{ href: 2, text: "Link" }],
    [{ href: "url", text: 4 }],
    [{ href: "url", text: "Link", title: 4 }],
    [{ href: "url", text: "Link", extra: true }],
  ])
    expect(migrateEmailLinks({ links })).toEqual({ links });
  const empty = migrateEmailLinks({
    messages: [
      null,
      { links: [] },
      { body: "", links: [] },
      { snippet: "Fallback", links: [{ href: "", text: "", title: "" }] },
    ],
    detail: {
      body: "Go (https://example.test).",
      links: [{ href: "https://example.test", text: "Go", title: "Go" }],
    },
  });
  expect(empty).toEqual({
    messages: [null, {}, { body: "" }, { snippet: "Fallback", body: "Fallback" }],
    detail: { body: "Go (https://example.test)." },
  });
  expect(
    migrateEmailLinks({ links: [{ href: "https://example.test", text: "Visit", title: "Title" }] }),
  ).toEqual({ body: "Visit\nTitle\nhttps://example.test" });
});
it("assigns collision-free email identities and retains only a still-present selected detail", () => {
  const rows = emailMessages({
    messages: [{ id: "email-2" }, null, {}, {}],
    detail: { id: "detail", subject: "Separate detail", body: "Body" },
  });
  expect(new Set(rows.map((item) => item.id)).size).toBe(4);
  expect(rows.find((item) => item.id === "email-2-missing")).toBeTruthy();
  expect(updateEmailMessages({ detail: { id: "gone" } }, [{ id: "kept" }])).not.toHaveProperty(
    "detail",
  );
  expect(
    updateEmailMessages({ detail: { id: "kept" } }, [{ id: "kept", subject: "Updated" }]),
  ).toHaveProperty("detail.subject", "Updated");
  expect(emailMessages({ messages: [], detail: { id: "detail" } })).toHaveLength(1);
});
it("rejects malformed authored conversation records and normalizes optional numbers", () => {
  const valid = {
    id: "one",
    contact_name: "Example",
    contact_number: "111",
    last_at: "",
    messages: [],
  };
  for (const bad of [
    null,
    {},
    { ...valid, id: "" },
    { ...valid, contact_name: 0 },
    { ...valid, contact_number: 0 },
    { ...valid, contact_numbers: 4 },
    { ...valid, contact_numbers: [4] },
    { ...valid, last_at: 0 },
    { ...valid, messages: null },
    { ...valid, extra: 1 },
  ])
    expect(() => parseConversations([bad])).toThrow();
  expect(parseConversations([{ ...valid, contact_numbers: [] }])[0]?.contact_number).toBe("");
});
it("preserves rich contact identity and chooses a deterministic preferred fallback", () => {
  const source = {
    id: "example",
    display_name: "Example",
    number: "222",
    email: "b@example.test",
    phone_numbers: [
      null,
      { label: "Other", value: "111" },
      { label: "Preferred", value: "x", number: "222" },
    ],
    email_addresses: [
      null,
      { label: "Work", value: "a@example.test" },
      { label: "Home", value: "b@example.test" },
    ],
  };
  const rich = contactDetails(source);
  expect(rich.preferredPhone).toBe("example-phone-1");
  expect(rich.preferredEmail).toBe("example-email-1");
  const absent = contactDetails({ phone_numbers: [], email_addresses: [] });
  absent.identity = null;
  expect(applyContactDetails({ display_name: "Retained" }, absent)).toMatchObject({
    display_name: "Retained",
    number: "",
    email: "",
  });
  const unknownPreferred = {
    ...rich,
    preferredPhone: "missing",
    preferredEmail: "missing",
    identity: null,
  };
  expect(applyContactDetails(source, unknownPreferred)).toMatchObject({
    display_name: "Example",
    number: "111",
    email: "a@example.test",
  });
  render(<SimulatorContactContentEditor value={{ details: absent }} onChange={vi.fn()} />);
  expect(screen.getByLabelText("First name")).toHaveValue("");
});
it("offers only usable starting targets, including empty and malformed collection input", () => {
  const sections: SimulatorEditorSectionValue[] = [
    {
      key: "messages",
      label: "Messages",
      value: [null, {}, { id: "" }, { id: "fallback" }, { id: "named", name: "Named" }],
    },
    { key: "phone", label: "Phone", value: 4 },
    { key: "email", label: "Email", value: null },
    { key: "vault", label: "Vault", value: { folders: [1, "Examples"], items: null } },
    { key: "photos", label: "Photos", value: { items: [{ id: "photo" }] } },
  ];
  expect(
    startingPositionOptions(sections, "messages", "threads").map((item) => item.target),
  ).toHaveLength(2);
  expect(startingPositionOptions(sections, "phone", "history")).toEqual([]);
  expect(startingPositionOptions(sections, "email", "list")).toEqual([]);
  expect(startingPositionOptions(sections, "home", "settings")).toEqual([]);
  expect(startingPositionOptions(sections, "home", "home")).toHaveLength(3);
  expect(startingPositionOptions([], "home", "home")).toHaveLength(1);
});
it("keeps unreadable timestamps visible, clears them explicitly and replaces them with valid local capture times", () => {
  expect(localDateTime("legacy label")).toBe("");
  expect(localDateTime("2026-99-99T99:99")).toBe("");
  expect(displayDateTime("legacy label")).toBe("legacy label");
  function Field() {
    const [value, setValue] = useState("legacy label");
    return <SimulatorDateTimeField storage="local" value={value} onChange={setValue} />;
  }
  const view = render(<Field />);
  expect(screen.getByText(/Existing time: legacy label/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Clear timestamp" }));
  fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-11-11" } });
  fireEvent.change(screen.getByLabelText("Time"), { target: { value: "09:30" } });
  expect(screen.getByLabelText("Time")).toHaveValue("09:30");
  view.rerender(
    <SimulatorDateTimeField storage="local" value="2026-11-11T09:30" onChange={vi.fn()} />,
  );
  expect(screen.getByLabelText("Time")).toHaveValue("09:30");
  view.rerender(
    <SimulatorDateTimeField storage="local" value="2026-99-99T09:30" onChange={vi.fn()} />,
  );
  expect(screen.getByText(/Existing time:/)).toBeVisible();
});
it("reads null Home documents using the portable defaults", () => {
  expect(readHomeContent(null).photos.items).toEqual([]);
});
