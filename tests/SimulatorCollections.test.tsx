import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { SimulatorEditor } from "../src/SimulatorEditor";
import type { SimulatorEditorSectionValue } from "../src/editorTypes";

function Workspace({ disabled = false } = {}) {
  const [sections, setSections] = useState<SimulatorEditorSectionValue[]>([
    {
      key: "messages",
      label: "Messages",
      value: [
        { id: "alpha", contact_name: "Alpha", contact_number: "111", last_at: "", messages: [] },
        { id: "beta", contact_name: "Beta", contact_number: "222", last_at: "", messages: [] },
      ],
    },
    {
      key: "email",
      label: "Email",
      value: {
        messages: [
          {
            id: "first",
            subject: "First email",
            from: "a@test",
            body: "First body",
            date_at: "2026-11-08T14:00:00Z",
          },
          {
            id: "second",
            subject: "Second email",
            from: "b@test",
            body: "Second body",
            date_at: "2026-11-08T15:00:00Z",
          },
        ],
      },
    },
    {
      key: "contacts",
      label: "Contacts",
      value: [{ id: "contact", display_name: "Contact A", number: "111" }],
    },
    {
      key: "phone",
      label: "Phone",
      value: { history: [{ id: "call", name: "A call", number: "111" }] },
    },
    {
      key: "internet",
      label: "Browser pages",
      value: {
        pages: [{ id: "page", title: "A page", url: "https://example.test", content: "Hello" }],
      },
    },
  ]);
  return (
    <SimulatorEditor
      sections={sections}
      disabled={disabled}
      onChange={(key, value) =>
        setSections((previous) =>
          previous.map((item) => (item.key === key ? { ...item, value } : item)),
        )
      }
      renderPreview={(context) => (
        <div>
          <output aria-label="Selected preview conversation">{context.selectedId}</output>
          <button onClick={() => context.onConversationSelect?.("beta")}>Open Beta preview</button>
          <button onClick={() => context.onEmailSelect("second")}>Open second email preview</button>
        </div>
      )}
    />
  );
}
const collection = () => screen.getByRole("region", { name: "Simulator collections" });
const detail = () => screen.getByRole("region", { name: "Simulator content editor" });
it("keeps tree conversation selection below Shortcuts and the selected form on the right", () => {
  render(<Workspace />);
  const beta = within(collection()).getByRole("treeitem", { name: "Beta" });
  expect(within(collection()).queryByLabelText("Contact name")).not.toBeInTheDocument();
  expect(within(detail()).getByLabelText("Contact name")).toHaveValue("Alpha");
  fireEvent.click(beta);
  expect(beta).toHaveAttribute("aria-selected", "true");
  expect(beta).toHaveAttribute("aria-expanded", "false");
  expect(within(detail()).getByLabelText("Contact name")).toHaveValue("Beta");
  expect(screen.getByLabelText("Selected preview conversation")).toHaveTextContent("beta");
  fireEvent.click(beta);
  expect(within(detail()).getByLabelText("Contact name")).toBeVisible();
  fireEvent.change(within(detail()).getByLabelText("Contact name"), {
    target: { value: "Edited Beta" },
  });
  expect(within(collection()).getByRole("treeitem", { name: "Edited Beta" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  fireEvent.click(within(collection()).getByRole("button", { name: "Remove Edited Beta" }));
  expect(within(detail()).getByLabelText("Contact name")).toHaveValue("Alpha");
  fireEvent.click(within(collection()).getByRole("button", { name: "Add conversation" }));
  expect(within(detail()).getByLabelText("Contact name")).toHaveValue("");
});
it("follows preview selections into the collection and selected email form", () => {
  render(<Workspace />);
  fireEvent.click(screen.getByRole("button", { name: "Open Beta preview" }));
  expect(within(collection()).getByRole("treeitem", { name: "Beta" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(within(detail()).getByLabelText("Contact name")).toHaveValue("Beta");
  fireEvent.click(screen.getByRole("button", { name: "Open second email preview" }));
  expect(within(collection()).getByRole("treeitem", { name: "Second email" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(within(detail()).getByLabelText("Subject")).toHaveValue("Second email");
  fireEvent.click(within(collection()).getByRole("treeitem", { name: "First email" }));
  expect(within(detail()).getByLabelText("Subject")).toHaveValue("First email");
});
it("moves contacts, browser pages and phone collections while keeping nested fields in details", () => {
  render(<Workspace />);
  fireEvent.click(screen.getByRole("button", { name: "Contacts" }));
  expect(within(detail()).queryByLabelText("First name")).not.toBeInTheDocument();
  fireEvent.click(within(collection()).getByRole("button", { name: "Contact A" }));
  expect(within(detail()).getByLabelText("First name")).toBeVisible();
  expect(
    within(collection()).queryByRole("region", { name: "Phone numbers panel" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Browser pages" }));
  fireEvent.click(within(collection()).getByRole("button", { name: "A page" }));
  expect(within(detail()).getByLabelText("Title")).toHaveValue("A page");
  fireEvent.click(screen.getByRole("button", { name: "Phone" }));
  fireEvent.click(within(collection()).getByRole("treeitem", { name: "Received" }));
  expect(within(detail()).getByLabelText("Caller name")).toHaveValue("A call");
  fireEvent.click(within(collection()).getByRole("button", { name: "Add calls item" }));
  expect(within(detail()).getByLabelText("Caller name")).toHaveValue("");
});
it("keeps portalled collection actions disabled with the editor", () => {
  render(<Workspace disabled />);
  expect(within(collection()).getByRole("treeitem", { name: "Beta" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  expect(within(collection()).getByRole("button", { name: "Add conversation" })).toBeDisabled();
});

it("caps visible contact collection labels at 40 characters without shortening the contact", () => {
  render(<Workspace />);
  fireEvent.click(screen.getByRole("button", { name: "Contacts" }));
  fireEvent.click(within(collection()).getByRole("button", { name: "Contact A" }));
  const name = `Example Bank — ${"X".repeat(80)}`;
  fireEvent.change(within(detail()).getByLabelText("First name"), { target: { value: name } });
  const fullName = `${name} A`;
  const row = within(collection()).getByRole("button", { name: fullName });
  expect(Array.from(row.textContent ?? "")).toHaveLength(40);
  expect(row.textContent?.endsWith("…")).toBe(true);
  expect(row).toHaveAttribute("title", fullName);
  expect(within(detail()).getByLabelText("First name")).toHaveValue(name);
});
