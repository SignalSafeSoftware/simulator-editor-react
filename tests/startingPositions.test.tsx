import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { SimulatorEditor } from "../src/SimulatorEditor";
import { SimulatorStartingScreen } from "../src/SimulatorStartingScreen";
import { startingPositionOptions } from "../src/startingPositionOptions";
import type { SimulatorEditorSectionValue } from "../src/editorTypes";
const sections: SimulatorEditorSectionValue[] = [
  { key: "entry_point", label: "Starting screen", value: { app: "home", screen: "home" } },
  {
    key: "contacts",
    label: "Contacts",
    value: [
      { id: "one", display_name: "Same name" },
      { id: "two", display_name: "Same name" },
    ],
  },
  {
    key: "messages",
    label: "Messages",
    value: [
      {
        id: "thread",
        contact_name: "Sender",
        contact_number: "+12025550199",
        last_at: "2026-11-09T16:00:00Z",
        messages: [],
      },
    ],
  },
  { key: "phone", label: "Phone", value: { calls: [{ id: "call", caller_name: "Caller" }] } },
  { key: "email", label: "Email", value: { messages: [{ id: "email", subject: "Subject" }] } },
  {
    key: "vault",
    label: "Vault",
    value: { folders: ["Unfiled"], items: [{ id: "secret", title: "Secret" }] },
  },
  { key: "photos", label: "Photos", value: { items: [{ id: "photo", title: "Photo" }] } },
];
it("keeps duplicate display names distinct and clears record targets when changing screens", () => {
  const change = vi.fn();
  render(
    <SimulatorStartingScreen
      value={{ app: "phone", screen: "contacts", target: { kind: "contact", id: "one" } }}
      sections={sections}
      internet={{}}
      onChange={change}
    />,
  );
  fireEvent.focus(screen.getByLabelText("Starting item"));
  fireEvent.change(screen.getByLabelText("Starting items"), {
    target: { value: JSON.stringify({ kind: "contact", id: "two" }) },
  });
  expect(change).toHaveBeenLastCalledWith({
    app: "phone",
    screen: "contacts",
    target: { kind: "contact", id: "two" },
  });
  fireEvent.change(screen.getByLabelText("Starting screen"), { target: { value: "history" } });
  expect(change).toHaveBeenLastCalledWith({ app: "phone", screen: "history" });
  fireEvent.change(screen.getByLabelText("Starting app"), { target: { value: "home" } });
  expect(change).toHaveBeenLastCalledWith({ app: "home", screen: "home" });
});
it("offers record and nested app starts using stable identifiers", () => {
  expect(startingPositionOptions(sections, "home", "home").map((item) => item.target)).toEqual([
    { kind: "vault-folder", folder: null },
    { kind: "vault-folder", folder: "Unfiled" },
    { kind: "vault-entry", id: "secret" },
    { kind: "photo", id: "photo" },
  ]);
  for (const [app, screen, kind] of [
    ["messages", "thread_detail", "conversation"],
    ["phone", "history", "call"],
    ["email", "detail", "email"],
  ]) {
    expect(startingPositionOptions(sections, app ?? "", screen ?? "")[0]?.target.kind).toBe(kind);
  }
  expect(startingPositionOptions(sections, "home", "settings")).toEqual([]);
});
it("captures navigation only after an explicit click and disables transient records", () => {
  const change = vi.fn();
  render(
    <SimulatorEditor
      sections={sections}
      onChange={change}
      renderPreview={(context) => (
        <>
          <button
            onClick={() =>
              context.onStartingPositionChange?.({
                app: "phone",
                screen: "contacts",
                target: { kind: "contact", id: "two" },
              })
            }
          >
            Preview contact
          </button>
          <button
            onClick={() =>
              context.onStartingPositionChange?.({
                app: "phone",
                screen: "contacts",
                target: { kind: "contact", id: "temporary" },
              })
            }
          >
            Preview temporary contact
          </button>
        </>
      )}
    />,
  );
  expect(screen.queryByRole("button", { name: "Starting Page" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("Starting screen"));
  const save = screen.getByRole("button", { name: "Starting Page" });
  expect(save.parentElement).toBe(
    screen.getByRole("button", { name: "Reset to Home" }).parentElement,
  );
  expect(screen.getByRole("region", { name: "Simulator content editor" })).toContainElement(save);
  expect(save).toBeDisabled();
  fireEvent.click(screen.getByText("Preview contact"));
  expect(change).not.toHaveBeenCalled();
  expect(save).toBeEnabled();
  fireEvent.click(save);
  expect(change).toHaveBeenLastCalledWith("entry_point", {
    app: "phone",
    screen: "contacts",
    target: { kind: "contact", id: "two" },
  });
  fireEvent.click(screen.getByText("Preview temporary contact"));
  expect(save).toBeDisabled();
});

it("distinguishes calls from the same caller by their authored time and type", () => {
  const options = startingPositionOptions(
    [
      {
        key: "phone",
        label: "Phone",
        value: {
          calls: [
            {
              id: "first",
              name: "Travel Desk",
              type: "incoming",
              timestamp: "2026-11-09T16:00:00Z",
            },
            {
              id: "second",
              name: "Travel Desk",
              type: "declined",
              timestamp: "2026-11-09T10:58:00Z",
            },
          ],
        },
      },
    ],
    "phone",
    "history",
  );
  expect(options[0]?.label).toContain("16:00:00");
  expect(options[1]?.label).toContain("10:58:00");
  expect(options.every((option) => Array.from(option.label).length <= 40)).toBe(true);
});
