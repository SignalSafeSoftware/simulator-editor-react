import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { SimulatorEditor } from "../src/SimulatorEditor";
import type { SimulatorEditorSectionValue } from "../src/editorTypes";

function Workspace({ disabled = false, validity = vi.fn() } = {}) {
  const [sections, setSections] = useState<SimulatorEditorSectionValue[]>([
    { key: "messages", label: "Messages", value: [] },
    { key: "email", label: "Email", value: { messages: [] } },
    { key: "contacts", label: "Contacts", value: [] },
    { key: "internet", label: "Browser pages", value: {} },
  ]);
  return (
    <SimulatorEditor
      sections={sections}
      disabled={disabled}
      onValidityChange={validity}
      validateJson={(value) => value !== null}
      onChange={(key, value) =>
        setSections((previous) =>
          previous.map((item) => (item.key === key ? { ...item, value } : item)),
        )
      }
      renderPreview={(context) => (
        <div>
          <output aria-label="Preview target">{context.navigation?.section}</output>
          <button
            onClick={() => {
              context.onShortcutChange("internet");
              context.onSectionNavigate("internet");
            }}
          >
            Navigate preview to Internet
          </button>
        </div>
      )}
    />
  );
}
it("keeps preview navigation, shortcut selection and the authoring panel synchronized", () => {
  render(<Workspace />);
  fireEvent.click(screen.getByRole("button", { name: "Email" }));
  expect(screen.getByLabelText("Preview target")).toHaveTextContent("email");
  expect(screen.getByRole("region", { name: "Emails panel" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Navigate preview to Internet" }));
  expect(screen.getByRole("button", { name: "Browser pages" })).toHaveAttribute(
    "aria-current",
    "true",
  );
  expect(screen.getByRole("region", { name: "Browser content panel" })).toBeVisible();
});
it("blocks invalid section JSON, then recovers without losing its draft", () => {
  const validity = vi.fn();
  render(<Workspace validity={validity} />);
  fireEvent.click(screen.getByRole("button", { name: "Email" }));
  fireEvent.click(screen.getByRole("tab", { name: "JSON" }));
  const json = screen.getByLabelText("Simulator content JSON");
  fireEvent.change(json, { target: { value: "{unfinished" } });
  expect(screen.getByRole("alert")).toHaveTextContent("Enter valid JSON");
  expect(validity).toHaveBeenLastCalledWith(false);
  expect(screen.getByRole("button", { name: "Contacts" })).toBeDisabled();
  fireEvent.change(json, { target: { value: "null" } });
  expect(screen.getByRole("alert")).toBeVisible();
  fireEvent.change(json, { target: { value: '{"messages":[]}' } });
  expect(validity).toHaveBeenLastCalledWith(true);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole("tab", { name: "JSON" }), { key: "ArrowLeft" });
  expect(screen.getByRole("tab", { name: "Simulator" })).toHaveFocus();
});
it("disables authoring but leaves shortcut navigation usable", () => {
  render(<Workspace disabled />);
  fireEvent.click(screen.getByRole("button", { name: "Contacts" }));
  expect(screen.getByRole("button", { name: "Add contacts item" })).toBeDisabled();
  fireEvent.click(screen.getByRole("tab", { name: "JSON" }));
  expect(screen.getByLabelText("Simulator content JSON")).toBeDisabled();
  expect(
    within(screen.getByRole("navigation", { name: "Simulator content sections" })).getByRole(
      "button",
      { name: "Email" },
    ),
  ).not.toBeDisabled();
});

it("reports missing email sent dates as invalid until the author supplies them", () => {
  const validity = vi.fn();
  const props = { onChange: vi.fn(), onValidityChange: validity, renderPreview: () => null };
  const email = {
    key: "email" as const,
    label: "Email",
    value: { messages: [{ id: "mail", subject: "Alert", date_at: "" }] },
  };
  const { rerender } = render(<SimulatorEditor {...props} sections={[email]} />);
  expect(validity).toHaveBeenLastCalledWith(false);
  expect(screen.getByRole("alert")).toHaveTextContent("before saving");
  rerender(
    <SimulatorEditor
      {...props}
      sections={[
        {
          ...email,
          value: { messages: [{ ...email.value.messages[0], date_at: "2026-11-08T15:45:00Z" }] },
        },
      ]}
    />,
  );
  expect(validity).toHaveBeenLastCalledWith(true);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("follows preview email selection into the matching expanded authoring record", () => {
  const sections: SimulatorEditorSectionValue[] = [
    { key: "messages", label: "Messages", value: [] },
    {
      key: "email",
      label: "Email",
      value: {
        messages: [
          {
            id: "one",
            subject: "First email",
            body: "First body",
            date_at: "2026-11-08T15:00:00Z",
          },
          {
            id: "two",
            subject: "Second email",
            body: "Second body",
            date_at: "2026-11-08T16:00:00Z",
          },
        ],
      },
    },
  ];
  render(
    <SimulatorEditor
      sections={sections}
      onChange={() => undefined}
      renderPreview={(context) => (
        <>
          <button onClick={() => context.onEmailSelect("one")}>Open first email in preview</button>
          <button onClick={() => context.onEmailSelect("two")}>Open second email in preview</button>
          <button onClick={() => context.onEmailSelect(undefined)}>Return to mailbox list</button>
        </>
      )}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Open first email in preview" }));
  expect(screen.getByRole("button", { name: "Email" })).toHaveAttribute("aria-current", "true");
  expect(screen.getByLabelText("Subject")).toHaveValue("First email");
  expect(screen.getByLabelText("Body")).toHaveValue("First body");
  fireEvent.click(screen.getByRole("button", { name: "Collapse emails" }));
  fireEvent.click(screen.getByRole("button", { name: "Open second email in preview" }));
  expect(screen.getByLabelText("Subject")).toBeVisible();
  expect(screen.getByLabelText("Subject")).toHaveValue("Second email");
  fireEvent.click(screen.getByRole("button", { name: "Return to mailbox list" }));
  expect(screen.queryByLabelText("Subject")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Open second email in preview" }));
  expect(screen.getByLabelText("Subject")).toHaveValue("Second email");
});

it("reports unfinished section JSON separately from required email dates for host leave protection", () => {
  const validity = vi.fn();
  const jsonValidity = vi.fn();
  render(
    <SimulatorEditor
      sections={[
        {
          key: "email",
          label: "Email",
          value: { messages: [{ id: "mail", subject: "Alert", date_at: "" }] },
        },
      ]}
      onChange={() => undefined}
      renderPreview={() => null}
      onValidityChange={validity}
      onJsonValidityChange={jsonValidity}
    />,
  );
  expect(validity).toHaveBeenLastCalledWith(false);
  expect(jsonValidity).toHaveBeenLastCalledWith(true);
  fireEvent.click(screen.getByRole("button", { name: "Email" }));
  fireEvent.click(screen.getByRole("tab", { name: "JSON" }));
  fireEvent.change(screen.getByLabelText("Simulator content JSON"), {
    target: { value: "{unfinished" },
  });
  expect(jsonValidity).toHaveBeenLastCalledWith(false);
  fireEvent.change(screen.getByLabelText("Simulator content JSON"), {
    target: { value: '{"messages":[]}' },
  });
  expect(jsonValidity).toHaveBeenLastCalledWith(true);
});
