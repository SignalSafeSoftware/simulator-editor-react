import type { ComponentProps } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type * as ContentFieldsModule from "../src/SimulatorContentFields";
import type { SimulatorContentFields } from "../src/SimulatorContentFields";
import { SimulatorAdditionalContentEditor } from "../src/SimulatorAdditionalContentEditor";
import { SimulatorEmailFields } from "../src/SimulatorEmailFields";
import { SimulatorRecordList } from "../src/SimulatorRecordList";
import { SimulatorHomeSettingsEditor } from "../src/SimulatorHomeSettingsEditor";

const captured = vi.hoisted(() => ({
  fields: new Map<string, ComponentProps<typeof SimulatorContentFields>>(),
}));
vi.mock("../src/SimulatorContentFields", async (importOriginal) => {
  const actual = await importOriginal<typeof ContentFieldsModule>();
  return {
    ...actual,
    SimulatorContentFields: (props: ComponentProps<typeof SimulatorContentFields>) => {
      captured.fields.set(props.label, props);
      return null;
    },
  };
});
afterEach(() => {
  cleanup();
  captured.fields.clear();
});
function field(label: string): ComponentProps<typeof SimulatorContentFields> {
  const value = captured.fields.get(label);
  if (!value) throw new Error(`Expected mounted ${label} fields`);
  return value;
}

it("refuses malformed browser field callbacks and preserves page identity on recovery", () => {
  const page = { id: "page-a", title: "Portal", content: "Old", layout: "centered" };
  const value = { pages: [page], forms: [{ id: "sign-in" }] };
  const changed = vi.fn();
  render(<SimulatorAdditionalContentEditor section="internet" value={value} onChange={changed} />);
  fireEvent.click(screen.getByRole("button", { name: "Portal" }));
  for (const malformed of [null, false, []])
    act(() => field("Browser content").onChange(malformed));
  expect(changed).not.toHaveBeenCalled();
  act(() => field("Browser content").onChange({ content: "Recovered" }));
  expect(changed).toHaveBeenCalledExactlyOnceWith({
    pages: [{ ...page, content: "Recovered" }],
    forms: value.forms,
  });
  expect(page.content).toBe("Old");
});

it("rejects malformed email edits without replacing authoring metadata", () => {
  const item = { id: "email-a", subject: "Example", body: "Old", snippet: "Summary" };
  const changed = vi.fn();
  render(<SimulatorEmailFields item={item} update={changed} />);
  for (const malformed of [undefined, "not an email object", []])
    act(() => field("Email").onChange(malformed));
  expect(changed).not.toHaveBeenCalled();
  act(() => field("Email").onChange({ body: "Recovered" }));
  expect(changed).toHaveBeenCalledExactlyOnceWith({ ...item, body: "Recovered" });
  expect(item.body).toBe("Old");
});

it("keeps sibling records intact when a field callback fails then recovers", () => {
  const rows = [
    { id: "one", name: "First" },
    { id: "two", name: "Second" },
  ];
  const changed = vi.fn();
  render(
    <SimulatorRecordList
      title="Records"
      value={rows}
      onChange={changed}
      create={() => ({})}
      fields={{ name: "" }}
      label={(item) => (typeof item.name === "string" ? item.name : "")}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "First" }));
  for (const malformed of [null, 42, []]) act(() => field("Records").onChange(malformed));
  expect(changed).not.toHaveBeenCalled();
  act(() => field("Records").onChange({ name: "Recovered" }));
  expect(changed).toHaveBeenCalledExactlyOnceWith([{ id: "one", name: "Recovered" }, rows[1]]);
  expect(rows[0]?.name).toBe("First");
});

it("rejects an invalid regional option before emitting saved settings", () => {
  const changed = vi.fn();
  render(<SimulatorHomeSettingsEditor value={{}} onChange={changed} />);
  const language = screen.getByLabelText("Language");
  if (!(language instanceof HTMLSelectElement)) throw new Error("Expected language select");
  const invalid = document.createElement("option");
  invalid.value = "not-a-supported-language";
  language.append(invalid);
  fireEvent.change(language, { target: { value: invalid.value } });
  expect(changed).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Time format"), { target: { value: "24" } });
  expect(changed).toHaveBeenCalledExactlyOnceWith({
    regional: expect.objectContaining({ language: "en", timeFormat: "24" }),
  });
});

it("ignores an unavailable appearance preset without clearing custom colors", () => {
  const value = { appearance: { background: "#112233", accent: "#445566" } };
  const changed = vi.fn();
  render(<SimulatorHomeSettingsEditor value={value} onChange={changed} />);
  const preset = screen.getByLabelText("Appearance preset");
  if (!(preset instanceof HTMLSelectElement)) throw new Error("Expected preset select");
  const unavailable = document.createElement("option");
  unavailable.value = "removed-preset";
  preset.append(unavailable);
  fireEvent.change(preset, { target: { value: unavailable.value } });
  expect(changed).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Background color")).toHaveValue("#112233");
  expect(screen.getByLabelText("Accent color")).toHaveValue("#445566");
});
