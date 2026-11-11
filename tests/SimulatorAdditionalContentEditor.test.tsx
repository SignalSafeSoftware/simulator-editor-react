import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { validateDeviceJson } from "@signalsafe/simulator-core/validateDeviceJson";
import { SimulatorAdditionalContentEditor } from "../src/SimulatorAdditionalContentEditor";

it("adds valid call history and preserves unrelated phone content", () => {
  let saved: unknown;
  function Editor() {
    const [value, setValue] = useState<unknown>({ dial: { digits: "123" }, history: [] });
    saved = value;
    return <SimulatorAdditionalContentEditor section="phone" value={value} onChange={setValue} />;
  }
  render(<Editor />);
  fireEvent.click(screen.getByRole("button", { name: "Add calls item" }));
  fireEvent.change(screen.getByLabelText("Caller name"), { target: { value: "Bank" } });
  fireEvent.change(screen.getByLabelText("Call type"), { target: { value: "missed" } });
  expect(saved).toMatchObject({
    dial: { digits: "123" },
    calls: [{ name: "Bank", type: "missed" }],
  });
  expect(() =>
    validateDeviceJson({ entry_point: { app: "phone", screen: "history" }, phone: saved }),
  ).not.toThrow();
  fireEvent.click(screen.getByRole("button", { name: "Remove Bank" }));
  expect(saved).toEqual({ dial: { digits: "123" }, calls: [] });
});

it("edits page content while preserving page layout and forms", () => {
  const changed = vi.fn();
  render(
    <SimulatorAdditionalContentEditor
      section="internet"
      value={{
        pages: [
          {
            id: "page",
            title: "Portal",
            url: "https://example.test",
            content: "Old",
            layout: "centered",
          },
        ],
        forms: [],
      }}
      onChange={changed}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Portal" }));
  fireEvent.change(screen.getByLabelText("Content"), { target: { value: "New" } });
  expect(changed).toHaveBeenLastCalledWith({
    pages: [
      {
        id: "page",
        title: "Portal",
        url: "https://example.test",
        content: "New",
        layout: "centered",
      },
    ],
    forms: [],
  });
});

it("edits contact values directly with administration fields and no simulator form", () => {
  let saved: unknown;
  function Editor() {
    const [value, setValue] = useState<unknown>([]);
    saved = value;
    return (
      <SimulatorAdditionalContentEditor section="contacts" value={value} onChange={setValue} />
    );
  }
  render(<Editor />);
  fireEvent.click(screen.getByRole("button", { name: "Add contacts item" }));
  fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Bank" } });
  fireEvent.click(screen.getByRole("button", { name: "Add phone numbers item" }));
  fireEvent.change(screen.getByLabelText("Phone number"), {
    target: { value: "+1-202-555-0100" },
  });
  expect(screen.queryByLabelText("Contact name")).not.toBeInTheDocument();
  expect(document.querySelector(".simulator-root")).toBeNull();
  expect(screen.queryByRole("button", { name: "Save contact" })).not.toBeInTheDocument();
  expect(saved).toEqual([
    expect.objectContaining({
      display_name: "Bank",
      phone_numbers: [{ label: "Mobile", value: "+1-202-555-0100" }],
    }),
  ]);
});

it("keeps contact value panels separate and follows the selected contact without mixing records", () => {
  let saved: unknown;
  function Editor() {
    const [value, setValue] = useState<unknown>([
      {
        id: "alice",
        display_name: "Alice",
        phone_numbers: [{ label: "Mobile", value: "111" }],
      },
      { id: "bob", display_name: "Bob", phone_numbers: [{ label: "Work", value: "222" }] },
    ]);
    saved = value;
    return (
      <SimulatorAdditionalContentEditor section="contacts" value={value} onChange={setValue} />
    );
  }
  render(<Editor />);
  const contacts = screen.getByRole("region", { name: "Contacts panel" });
  for (const name of ["Phone numbers panel", "Email addresses panel", "Postal addresses panel"]) {
    const panel = screen.getByRole("region", { name });
    expect(contacts.contains(panel)).toBe(false);
  }
  expect(screen.queryByRole("button", { name: "111" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Add phone numbers item" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Alice" }));
  fireEvent.click(screen.getByRole("button", { name: "111" }));
  fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "123" } });
  fireEvent.click(screen.getByRole("button", { name: "Bob" }));
  expect(screen.getByRole("button", { name: "222" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "123" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "222" }));
  fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "456" } });
  fireEvent.click(screen.getByRole("button", { name: "Collapse contacts" }));
  expect(screen.getByLabelText("Phone number")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Expand contacts" }));
  fireEvent.click(within(contacts).getByRole("button", { name: "Remove contacts item 2" }));
  expect(screen.queryByRole("button", { name: "123" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Alice" }));
  expect(screen.getByRole("button", { name: "123" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Alice" }));
  expect(screen.queryByRole("button", { name: "123" })).not.toBeInTheDocument();
  expect(saved).toEqual([
    expect.objectContaining({
      id: "alice",
      phone_numbers: [{ label: "Mobile", value: "123" }],
    }),
  ]);
  fireEvent.click(within(contacts).getByRole("button", { name: "Remove contacts item 1" }));
  expect(screen.queryByRole("button", { name: "123" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Add phone numbers item" })).not.toBeInTheDocument();
});

it("edits migrated voicemail in the Calls collection without losing its transcript", () => {
  const changed = vi.fn();
  render(
    <SimulatorAdditionalContentEditor
      section="phone"
      value={{ voicemail: { caller_name: "Bank", transcript: "Call back", timestamp: "" } }}
      onChange={changed}
    />,
  );
  fireEvent.click(screen.getByRole("treeitem", { name: "Voicemail" }));
  fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "+12025550123" } });
  expect(changed).toHaveBeenLastCalledWith({
    calls: [
      {
        id: "voicemail",
        type: "voicemail",
        name: "Bank",
        number: "+12025550123",
        transcript: "Call back",
        timestamp: "",
      },
    ],
  });
});
