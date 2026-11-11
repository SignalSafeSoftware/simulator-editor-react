import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SimulatorAdditionalContentEditor } from "../src/SimulatorAdditionalContentEditor";
import { SimulatorConversationEditor } from "../src/SimulatorConversationEditor";
import { SimulatorDateTimeField } from "../src/SimulatorDateTimeField";
import { SimulatorHomeSectionEditor } from "../src/SimulatorHomeSectionEditor";
import { SimulatorEditor } from "../src/SimulatorEditor";
import { SimulatorSectionEditor } from "../src/SimulatorSectionEditor";
afterEach(cleanup);
it("edits browser records with absent optional text and keeps extra properties", () => {
  const changed = vi.fn();
  render(
    <SimulatorAdditionalContentEditor
      section="internet"
      value={{ pages: [{ id: "one", url: "https://example.test", extra: true }] }}
      onChange={changed}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "https://example.test" }));
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Example" } });
  expect(changed).toHaveBeenCalledWith({
    pages: [{ id: "one", url: "https://example.test", extra: true, title: "Example", content: "" }],
  });
  cleanup();
  render(<SimulatorAdditionalContentEditor section="other" value={null} onChange={changed} />);
  expect(screen.queryByRole("textbox")).toBeNull();
});
it("updates conversation numbers through keyboard entry and removal", () => {
  const changed = vi.fn();
  render(
    <SimulatorConversationEditor
      value={{ contact_name: "Example", contact_number: "111", last_at: "", messages: [] }}
      onChange={changed}
    />,
  );
  const input = screen.getByRole("combobox");
  fireEvent.change(input, { target: { value: "222" } });
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "ArrowUp" });
  fireEvent.keyDown(input, { key: ";" });
  expect(changed).toHaveBeenCalledWith(
    expect.objectContaining({ contact_numbers: ["111", "222"], contact_number: "111" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Remove 111" }));
  expect(changed).toHaveBeenLastCalledWith(
    expect.objectContaining({ contact_numbers: [], contact_number: "" }),
  );
});
it("describes unsupported time input without committing invalid data", () => {
  const changed = vi.fn();
  render(<SimulatorDateTimeField value="" onChange={changed} />);
  const time = screen.getByLabelText("Time");
  time.setAttribute("type", "text");
  fireEvent.change(time, { target: { value: "bad time" } });
  expect(screen.getByText("Enter a time such as 09:30 or 14:30.")).toBeTruthy();
  expect(changed).toHaveBeenCalledWith("");
});
it("rejects malformed device-page data before mounting its form", () => {
  for (const page of ["photos", "vault", "settings"] as const) {
    const view = render(
      <SimulatorHomeSectionEditor page={page} value={false} onChange={vi.fn()} />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(`Repair invalid ${page}`);
    view.unmount();
  }
});
it("edits explicitly configured custom sections and dispatches home updates", () => {
  const changed = vi.fn();
  const props = { contacts: [], internet: {}, onChange: changed, onSelectConversation: vi.fn() };
  const view = render(
    <SimulatorSectionEditor
      {...props}
      selected={{
        key: "entry_point",
        label: "Starting page",
        value: { app: "home", screen: "home" },
      }}
    />,
  );
  view.rerender(
    <SimulatorSectionEditor {...props} selected={{ key: "home", label: "Home", value: {} }} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Vault" }));
  fireEvent.click(screen.getByRole("button", { name: "Add vault folder" }));
  expect(changed).toHaveBeenCalledWith("home", expect.any(Object));
});
it("allows an empty workspace to inspect JSON without creating a section", () => {
  const changed = vi.fn();
  render(<SimulatorEditor sections={[]} onChange={changed} renderPreview={() => null} />);
  fireEvent.click(screen.getByRole("tab", { name: "JSON" }));
  fireEvent.change(screen.getByLabelText("Simulator content JSON"), { target: { value: "{}" } });
  expect(changed).not.toHaveBeenCalled();
});
it("keeps JSON synchronized with the right-side form and rejects oversized custom-editor input", () => {
  const changed = vi.fn();
  render(
    <SimulatorEditor
      sections={[
        {
          key: "messages",
          label: "Messages",
          value: [
            {
              id: "one",
              contact_name: "Example",
              contact_number: "111",
              last_at: "",
              messages: [],
            },
          ],
        },
      ]}
      onChange={changed}
      renderPreview={() => null}
    />,
  );
  fireEvent.click(screen.getByRole("tab", { name: "JSON" }));
  fireEvent.change(screen.getByLabelText("Contact name"), { target: { value: "Updated" } });
  expect(screen.getByLabelText("Simulator content JSON")).toHaveProperty(
    "value",
    expect.stringContaining("Updated"),
  );
  fireEvent.change(screen.getByLabelText("Simulator content JSON"), {
    target: { value: " ".repeat(4000001) },
  });
  expect(screen.getByRole("alert")).toBeTruthy();
});
it("dispatches standalone device-page edits through its section key", () => {
  const changed = vi.fn();
  render(
    <SimulatorSectionEditor
      selected={{ key: "settings", label: "Settings", value: {} }}
      contacts={[]}
      internet={{}}
      onChange={changed}
      onSelectConversation={() => {}}
    />,
  );
  fireEvent.change(screen.getByLabelText("Background color"), { target: { value: "#112233" } });
  expect(changed).toHaveBeenCalledWith(
    "settings",
    expect.objectContaining({ appearance: expect.objectContaining({ background: "#112233" }) }),
  );
});
it("dispatches newly authored browser, email and starting-page values through section ownership", () => {
  const changed = vi.fn(),
    props = { contacts: [], internet: {}, onChange: changed, onSelectConversation: () => {} };
  const view = render(
    <SimulatorSectionEditor
      {...props}
      selected={{ key: "internet", label: "Browser", value: { pages: [] } }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Add browser content item" }));
  expect(changed).toHaveBeenLastCalledWith(
    "internet",
    expect.objectContaining({
      pages: [expect.objectContaining({ id: expect.any(String), title: "" })],
    }),
  );
  view.rerender(
    <SimulatorSectionEditor
      {...props}
      selected={{ key: "email", label: "Email", value: { messages: [] } }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Add emails item" }));
  expect(changed).toHaveBeenLastCalledWith(
    "email",
    expect.objectContaining({ messages: expect.any(Array) }),
  );
  view.rerender(
    <SimulatorSectionEditor
      {...props}
      selected={{
        key: "entry_point",
        label: "Starting page",
        value: { app: "phone", screen: "history" },
      }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Reset to Home" }));
  expect(changed).toHaveBeenLastCalledWith("entry_point", { app: "home", screen: "home" });
});
it("removes an existing screen lock through the standalone settings owner", () => {
  const changed = vi.fn();
  render(
    <SimulatorHomeSectionEditor
      page="settings"
      value={{ lock: { salt: "a".repeat(32), digest: "b".repeat(64) } }}
      onChange={changed}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Remove screen password" }));
  expect(changed).toHaveBeenCalledWith({ lock: null });
});
