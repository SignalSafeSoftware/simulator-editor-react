import { useState } from "react";
import { fireEvent, render, screen, within, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SimulatorContentFields } from "../src/SimulatorContentFields";
import { SimulatorContactEndpointsEditor } from "../src/SimulatorContactEndpointsEditor";
afterEach(cleanup);
it.each([
  ["Folder id", "inbox", "Folder", "trash"],
  ["Direction", null, "Direction", "out"],
  ["Direction", "in", "Direction", "missed"],
  ["From", "them", "Sender", "me"],
] as const)("edits the constrained %s field", (label, value, accessible, next) => {
  const changed = vi.fn();
  render(<SimulatorContentFields label={label} value={value} onChange={changed} />);
  fireEvent.change(screen.getByLabelText(accessible), { target: { value: next } });
  expect(changed).toHaveBeenCalledWith(next);
});
it.each(["Duration seconds", "Delay seconds", "Count"])(
  "accepts valid numeric values without replacing data with invalid input in %s",
  (label) => {
    const changed = vi.fn();
    const view = render(
      <SimulatorContentFields
        label={label}
        value={label === "Count" ? 3 : null}
        onChange={changed}
      />,
    );
    const input = screen.getByLabelText(label);
    fireEvent.change(input, { target: { value: "12" } });
    expect(changed).toHaveBeenLastCalledWith(12);
    changed.mockClear();
    fireEvent.change(input, { target: { value: "" } });
    expect(changed).not.toHaveBeenCalled();
    if (label !== "Count") {
      fireEvent.change(input, { target: { value: "-1" } });
      expect(changed).not.toHaveBeenCalled();
    }
    if (label === "Duration seconds") {
      fireEvent.change(input, { target: { value: "1.2" } });
      expect(changed).not.toHaveBeenCalled();
    }
    view.rerender(<SimulatorContentFields label={label} value={12} onChange={changed} />);
    expect(screen.getByLabelText(label)).toHaveValue(12);
  },
);
it("supports booleans, unset values, unknown inputs and multiline text without losing sibling fields", () => {
  function Fields() {
    const [value, setValue] = useState<unknown>({
      enabled: false,
      unset: null,
      unknown: undefined,
      short: "a",
      notes: "Hello",
      items: ["First", "Second"],
    });
    return <SimulatorContentFields label="Record" value={value} onChange={setValue} />;
  }
  render(<Fields />);
  fireEvent.click(screen.getByLabelText("Enabled"));
  expect(screen.getByLabelText("Enabled")).toBeChecked();
  expect(screen.getByText("Not set")).toBeVisible();
  fireEvent.change(screen.getByLabelText("Unknown"), { target: { value: "Entered" } });
  expect(screen.getByLabelText("Unknown")).toHaveValue("Entered");
  fireEvent.change(screen.getByLabelText("Notes"), { target: { value: "Changed" } });
  expect(screen.getByLabelText("Notes")).toHaveValue("Changed");
  fireEvent.change(screen.getByLabelText("Items 1"), { target: { value: "Updated" } });
  expect(screen.getByLabelText("Items 1")).toHaveValue("Updated");
  expect(screen.getByLabelText("Items 2")).toHaveValue("Second");
  fireEvent.click(screen.getByRole("button", { name: "Remove item 1" }));
  expect(screen.getByLabelText("Items 1")).toHaveValue("Second");
});
it.each([
  "Text",
  "Content",
  "Body",
  "Transcript",
  "Description",
  "Notes",
  "Caption",
  "Long",
  "Multiline",
])("provides multiline editing for %s", (label) => {
  const changed = vi.fn();
  render(
    <SimulatorContentFields
      label={label}
      value={
        label === "Long" ? "a".repeat(121) : label === "Multiline" ? "first\nsecond" : "Example"
      }
      onChange={changed}
    />,
  );
  const field = screen.getByLabelText(label);
  expect(field.tagName).toBe("TEXTAREA");
  fireEvent.change(field, { target: { value: "New" } });
  expect(changed).toHaveBeenCalledWith("New");
});
it("hides inferred snippets and removed incoming caller titles while keeping ordinary values editable", () => {
  const changed = vi.fn();
  const view = render(
    <SimulatorContentFields
      label="Incoming call"
      value={{ caller_title: "removed", number: "111" }}
      onChange={changed}
    />,
  );
  expect(screen.queryByLabelText("Caller title")).toBeNull();
  fireEvent.change(screen.getByLabelText("Number"), { target: { value: "222" } });
  expect(changed).toHaveBeenCalledWith({ caller_title: "removed", number: "222" });
  view.rerender(
    <SimulatorContentFields
      label="Thread detail"
      inferSnippets
      value={{ snippet: "inferred", title: "Title" }}
      onChange={changed}
    />,
  );
  expect(screen.queryByLabelText("Snippet")).toBeNull();
  view.rerender(
    <SimulatorContentFields
      label="Messages"
      plain
      value={{ snippet: "kept" }}
      onChange={changed}
    />,
  );
  expect(screen.getByLabelText("Snippet")).toHaveValue("kept");
});
it("adds, edits, chooses and removes phone/email/postal endpoints through the shared contact data model", () => {
  function Contact() {
    const [value, setValue] = useState<Record<string, unknown>>({
      id: "example",
      display_name: "Example",
    });
    return (
      <>
        <SimulatorContactEndpointsEditor value={value} onChange={setValue} />
        <output aria-label="Contact JSON">{JSON.stringify(value)}</output>
      </>
    );
  }
  render(<Contact />);
  for (const [panel, field, value] of [
    ["Phone numbers", "Phone number", "+12025550110"],
    ["Email addresses", "Email address", "alex@example.test"],
    ["Postal addresses", "Street address", "123 Example Road"],
  ] as const) {
    const region = within(screen.getByRole("region", { name: panel + " panel" }));
    fireEvent.click(region.getByRole("button", { name: "Add " + panel.toLowerCase() + " item" }));
    fireEvent.change(region.getByLabelText("Label"), { target: { value: "Example label" } });
    fireEvent.change(region.getByLabelText(field), { target: { value } });
    const preferred = region.getByRole("checkbox");
    fireEvent.click(preferred);
    expect(preferred).toBeChecked();
    fireEvent.click(preferred);
    expect(preferred).not.toBeChecked();
    if (panel === "Postal addresses") {
      for (const label of ["Address line 2", "City", "State / region", "Postal code", "Country"])
        fireEvent.change(region.getByLabelText(label), { target: { value: "Example" } });
    }
    fireEvent.click(preferred);
    fireEvent.click(
      region.getByRole("button", { name: "Remove " + panel.toLowerCase() + " item 1" }),
    );
  }
  expect(screen.getByLabelText("Contact JSON").textContent).toContain('"preferredAddress":null');
});
it("edits one phone endpoint without replacing the other", () => {
  const changed = vi.fn();
  render(
    <SimulatorContactEndpointsEditor
      value={{
        id: "one",
        phone_numbers: [
          { label: "Mobile", value: "111" },
          { label: "Work", value: "222" },
        ],
      }}
      onChange={changed}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "111" }));
  fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "333" } });
  expect(changed).toHaveBeenCalledWith(
    expect.objectContaining({
      details: expect.objectContaining({
        phones: [
          expect.objectContaining({ value: "333" }),
          expect.objectContaining({ value: "222" }),
        ],
      }),
    }),
  );
});
