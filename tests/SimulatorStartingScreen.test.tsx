import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { SimulatorStartingScreen } from "../src/SimulatorStartingScreen";

it("offers app screens and authored browser pages while retaining existing values", () => {
  const change = vi.fn();
  const { rerender } = render(
    <SimulatorStartingScreen
      value={{ app: "messages", screen: "thread_detail" }}
      internet={{}}
      onChange={change}
    />,
  );
  expect(screen.getByLabelText("Starting screen")).toHaveValue("threads");
  fireEvent.change(screen.getByLabelText("Starting app"), { target: { value: "phone" } });
  expect(change).toHaveBeenLastCalledWith({ app: "phone", screen: "history" });
  rerender(
    <SimulatorStartingScreen
      value={{ app: "internet", screen: "saved-page" }}
      internet={{ pages: [{ id: "saved-page" }, { id: "other-page" }] }}
      onChange={change}
    />,
  );
  expect(screen.getByLabelText("Starting screen")).toHaveValue("saved-page");
  fireEvent.change(screen.getByLabelText("Starting screen"), { target: { value: "other-page" } });
  expect(change).toHaveBeenLastCalledWith({ app: "internet", screen: "other-page" });
});

it.each([
  ["phone", "incoming_call", "history", "Incoming call"],
  ["phone", "voicemail", "history", "Voicemail"],
  ["messages", "thread_detail", "threads", "Thread detail"],
  ["email", "detail", "list", "Detail"],
])(
  "groups %s saved %s under %s without a duplicate detail choice",
  (app, detail, collection, removed) => {
    render(
      <SimulatorStartingScreen value={{ app, screen: detail }} internet={{}} onChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("Starting screen")).toHaveValue(collection);
    expect(screen.queryByRole("option", { name: removed })).not.toBeInTheDocument();
  },
);

it.each([
  [
    "messages",
    "threads",
    "messages",
    [{ id: "chosen", contact_name: "Bob" }],
    "conversation",
    "thread_detail",
  ],
  [
    "email",
    "list",
    "email",
    { messages: [{ id: "chosen", subject: "Appointment" }] },
    "email",
    "detail",
  ],
  [
    "phone",
    "history",
    "phone",
    { calls: [{ id: "chosen", type: "incoming", name: "Travel" }] },
    "call",
    "history",
  ],
] as const)(
  "opens a selected %s collection item and can return to the collection",
  (app, collection, key, value, kind, detail) => {
    const change = vi.fn();
    const { rerender } = render(
      <SimulatorStartingScreen
        value={{ app, screen: collection }}
        sections={[{ key, label: app, value }]}
        internet={{}}
        onChange={change}
      />,
    );
    fireEvent.focus(screen.getByLabelText("Starting item"));
    fireEvent.change(screen.getByLabelText("Starting items"), {
      target: { value: JSON.stringify({ kind, id: "chosen" }) },
    });
    expect(change).toHaveBeenLastCalledWith({
      app,
      screen: detail,
      target: { kind, id: "chosen" },
    });
    rerender(
      <SimulatorStartingScreen
        value={{ app, screen: detail, target: { kind, id: "chosen" } }}
        sections={[{ key, label: app, value }]}
        internet={{}}
        onChange={change}
      />,
    );
    fireEvent.focus(screen.getByLabelText("Starting item"));
    fireEvent.change(screen.getByLabelText("Starting items"), { target: { value: "" } });
    expect(change).toHaveBeenLastCalledWith({ app, screen: collection });
  },
);

it("searches starting items, ignores unmatched text and supports keyboard selection", () => {
  const change = vi.fn();
  render(
    <SimulatorStartingScreen
      value={{ app: "messages", screen: "threads" }}
      sections={[
        {
          key: "messages",
          label: "Messages",
          value: [
            { id: "alice", contact_name: "Alice Chen" },
            { id: "bob", contact_name: "Bob Martinez" },
          ],
        },
      ]}
      internet={{}}
      onChange={change}
    />,
  );
  const picker = screen.getByRole("combobox", { name: "Starting item" });
  fireEvent.change(picker, { target: { value: "Bob" } });
  expect(screen.queryByRole("option", { name: "Alice Chen" })).not.toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Bob Martinez" })).toBeInTheDocument();
  fireEvent.keyDown(picker, { key: "Enter" });
  expect(change).toHaveBeenLastCalledWith({
    app: "messages",
    screen: "thread_detail",
    target: { kind: "conversation", id: "bob" },
  });
  change.mockClear();
  fireEvent.change(picker, { target: { value: "Unknown person" } });
  fireEvent.keyDown(picker, { key: "Enter" });
  expect(change).not.toHaveBeenCalled();
  fireEvent.keyDown(picker, { key: "Escape" });
  expect(picker).toHaveValue("No selected item");
});
