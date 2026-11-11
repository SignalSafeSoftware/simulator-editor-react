import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SimulatorContactsEditor } from "../src/SimulatorContactsEditor";
import { SimulatorContactContentEditor } from "../src/SimulatorContactContentEditor";
import { SimulatorContentFields } from "../src/SimulatorContentFields";
import { SimulatorMessageList } from "../src/SimulatorMessageList";
import { SimulatorMessageFields } from "../src/SimulatorMessageFields";
import { SimulatorPhoneCallFields } from "../src/SimulatorPhoneCallFields";
import { SimulatorEmailFields } from "../src/SimulatorEmailFields";
import { SimulatorEmailContentEditor } from "../src/SimulatorEmailContentEditor";
import { SimulatorStartingScreen } from "../src/SimulatorStartingScreen";
afterEach(cleanup);
it("renders sparse contacts without inventing names or endpoint data", () => {
  const changed = vi.fn();
  const view = render(<SimulatorContactsEditor value={null} onChange={changed} />);
  view.rerender(<SimulatorContactsEditor value={[{}]} onChange={changed} />);
  fireEvent.click(screen.getByRole("button", { name: "Contacts 1" }));
  expect(screen.getByLabelText("First name")).toHaveValue("");
  cleanup();
  render(<SimulatorContactContentEditor value={{ display_name: 4 }} onChange={changed} />);
  expect(screen.getByLabelText("First name")).toHaveValue("");
});
it("updates primitive message fields and handles malformed sender and call names", () => {
  const changed = vi.fn();
  render(<SimulatorMessageFields item="Legacy" index={0} contactNumbers={[]} onChange={changed} />);
  fireEvent.change(screen.getByLabelText("Message 1 details"), { target: { value: "Updated" } });
  expect(changed).toHaveBeenCalledWith("Updated");
  cleanup();
  render(
    <SimulatorMessageFields
      item={{ from: "them" }}
      index={0}
      contactNumbers={[]}
      onChange={changed}
    />,
  );
  expect(screen.getByLabelText("Sender")).toHaveValue("");
  cleanup();
  render(<SimulatorPhoneCallFields item={{ type: 4, name: 4 }} change={changed} />);
  expect(screen.getByLabelText("Caller name")).toHaveValue("");
  fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "111" } });
  expect(changed).toHaveBeenCalled();
});
it("removes messages before and after an expanded row while retaining correct selection", () => {
  const changed = vi.fn();
  const value = [{ text: "First" }, { text: "Second" }, { text: "Third" }];
  render(<SimulatorMessageList value={value} contactNumbers={["111"]} onChange={changed} />);
  fireEvent.click(screen.getByRole("button", { name: "Third" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove message 1" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove message 3" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove message 2" }));
  expect(changed).toHaveBeenCalledTimes(3);
});
it("renders default direction and primitive arrays and sparse email bodies", () => {
  render(<SimulatorContentFields label="Direction" value={null} onChange={vi.fn()} />);
  expect(screen.getByRole("combobox")).toHaveValue("in");
  cleanup();
  render(
    <SimulatorContentFields
      label="Examples"
      value={[{ text: "Snippet" }]}
      inferSnippets
      onChange={vi.fn()}
    />,
  );
  expect(screen.getByText("Snippet")).toBeTruthy();
  cleanup();
  render(<SimulatorEmailFields item={{}} folders={[]} update={vi.fn()} />);
  expect(screen.getByLabelText("Body")).toHaveValue("");
  cleanup();
  render(<SimulatorEmailContentEditor value={null} onChange={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Add emails item" }));
});
it("resets malformed starting positions and preserves unknown authored routes", () => {
  const changed = vi.fn();
  const view = render(
    <SimulatorStartingScreen
      value={false}
      internet={{ pages: [null, {}, { id: "custom" }] }}
      onChange={changed}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Reset to Home" }));
  expect(changed).toHaveBeenCalledWith({ app: "home", screen: "home" });
  view.rerender(
    <SimulatorStartingScreen
      value={{ app: "custom", screen: "", target: { kind: "call", id: "gone" } }}
      internet={null}
      onChange={changed}
    />,
  );
  expect(screen.getByRole("option", { name: "Choose a screen" })).toBeTruthy();
  fireEvent.change(screen.getByRole("combobox", { name: "Starting app" }), {
    target: { value: "custom" },
  });
  fireEvent.focus(screen.getByRole("combobox", { name: "Starting item" }));
  fireEvent.change(screen.getByRole("listbox", { name: "Starting items" }), {
    target: { value: "" },
  });
  expect(changed).toHaveBeenCalledWith({ app: "custom", screen: "" });
});
it("supports generic message arrays through the shared field boundary", () => {
  const changed = vi.fn();
  render(<SimulatorContentFields label="Messages" value={[]} onChange={changed} />);
  fireEvent.click(screen.getByRole("button", { name: "Add message" }));
  expect(changed).toHaveBeenCalledWith([expect.objectContaining({ from: "them", text: "" })]);
});
it("retains missing names when structured contact identity is explicitly absent", () => {
  render(
    <SimulatorContactContentEditor
      value={{
        details: {
          identity: null,
          phones: [],
          emails: [],
          addresses: [],
          preferredPhone: null,
          preferredEmail: null,
          preferredAddress: null,
        },
      }}
      onChange={vi.fn()}
    />,
  );
  expect(screen.getByLabelText("First name")).toHaveValue("");
});
it("allows reopening a message row to collapse its inspector", () => {
  render(<SimulatorMessageList value={[{ text: "Example" }]} onChange={vi.fn()} />);
  const row = screen.getByRole("button", { name: "Example" });
  fireEvent.click(row);
  expect(row).toHaveAttribute("aria-expanded", "true");
  fireEvent.click(row);
  expect(row).toHaveAttribute("aria-expanded", "false");
});
it("labels a noncompact authored timestamp explicitly", () => {
  render(
    <SimulatorContentFields
      label="Timestamp"
      value=""
      compactTimestamp={false}
      onChange={vi.fn()}
    />,
  );
  expect(screen.getByRole("group", { name: "Timestamp" })).toBeTruthy();
});
it("uses an authored display name when structured identity is explicitly null", () => {
  render(
    <SimulatorContactContentEditor
      value={{
        display_name: "Alex Example",
        details: {
          identity: null,
          phones: [],
          emails: [],
          addresses: [],
          preferredPhone: null,
          preferredEmail: null,
          preferredAddress: null,
        },
      }}
      onChange={vi.fn()}
    />,
  );
  expect(screen.getByLabelText("First name")).toHaveValue("Alex");
});
