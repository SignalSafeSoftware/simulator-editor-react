import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import type { SimulatorMessageFields } from "../src/SimulatorMessageFields";
import { SimulatorConversationsEditor } from "../src/SimulatorConversationsEditor";
vi.mock("../src/SimulatorMessageFields", () => ({
  SimulatorMessageFields: (props: ComponentProps<typeof SimulatorMessageFields>) => (
    <button onClick={() => props.onChange("Updated legacy value")}>Edit legacy message</button>
  ),
}));
afterEach(cleanup);
it("preserves primitive legacy message updates without inventing a contact number", () => {
  const changed = vi.fn();
  render(
    <SimulatorConversationsEditor
      value={[
        {
          id: "one",
          contact_name: "Example",
          contact_number: "",
          last_at: "",
          messages: ["Legacy"],
        },
      ]}
      onChange={changed}
    />,
  );
  fireEvent.click(screen.getByRole("treeitem", { name: "Message 1" }));
  fireEvent.click(screen.getByRole("button", { name: "Edit legacy message" }));
  expect(changed).toHaveBeenCalledWith([
    expect.objectContaining({ messages: ["Updated legacy value"] }),
  ]);
});
it("prefills newly added message senders from the conversation number list", () => {
  const changed = vi.fn();
  render(
    <SimulatorConversationsEditor
      value={[
        {
          id: "one",
          contact_name: "Example",
          contact_number: "",
          contact_numbers: ["111"],
          last_at: "",
          messages: [],
        },
      ]}
      onChange={changed}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Add item to Example" }));
  expect(changed).toHaveBeenCalledWith([
    expect.objectContaining({ messages: [expect.objectContaining({ sender_number: "111" })] }),
  ]);
});
