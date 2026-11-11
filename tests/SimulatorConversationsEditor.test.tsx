import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { SimulatorConversationsEditor } from "../src/SimulatorConversationsEditor";
import type { AuthoredConversation } from "../src/simulatorConversationAdapter";
function Editor() {
  const [value, setValue] = useState<AuthoredConversation[]>([
    {
      id: "one",
      contact_name: "Amazon",
      contact_number: "111",
      last_at: "",
      messages: [{ from: "them", text: "Original message", timestamp: "2:30 PM" }],
    },
  ]);
  return <SimulatorConversationsEditor value={value} onChange={setValue} />;
}
it("selects parent settings and individual message forms from the tree", () => {
  render(<Editor />);
  expect(screen.getByRole("treeitem", { name: "Amazon" })).toHaveAttribute("aria-expanded", "true");
  fireEvent.click(screen.getByRole("treeitem", { name: "Original message" }));
  expect(screen.getByLabelText("Text")).toHaveValue("Original message");
  expect(screen.queryByLabelText("Contact name")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Text"), { target: { value: "Edited message" } });
  fireEvent.click(screen.getByRole("treeitem", { name: "Amazon" }));
  expect(screen.getByLabelText("Contact name")).toHaveValue("Amazon");
  fireEvent.click(screen.getByRole("button", { name: "Add item to Amazon" }));
  fireEvent.change(screen.getByLabelText("Text"), { target: { value: "Another message" } });
  expect(screen.getByRole("treeitem", { name: "Another message" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  fireEvent.click(screen.getByRole("button", { name: "Remove Another message" }));
  expect(screen.queryByRole("treeitem", { name: "Another message" })).not.toBeInTheDocument();
  expect(screen.getByRole("treeitem", { name: "Edited message" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Add conversation" }));
  fireEvent.change(screen.getByLabelText("Contact name"), { target: { value: "Bank" } });
  fireEvent.click(screen.getByRole("button", { name: "Remove Bank" }));
  expect(screen.getByLabelText("Contact name")).toHaveValue("Amazon");
});
it("derives parent conversation time after editing a message date and time", () => {
  render(<Editor />);
  expect(screen.getByLabelText("Conversation Date & Time")).toHaveValue("Date not set — 2:30 PM");
  fireEvent.click(screen.getByRole("treeitem", { name: "Original message" }));
  fireEvent.change(screen.getByLabelText("Sent Date"), { target: { value: "2026-11-07" } });
  fireEvent.change(screen.getByLabelText("Time"), { target: { value: "15:15" } });
  fireEvent.click(screen.getByRole("treeitem", { name: "Amazon" }));
  expect(screen.getByLabelText("Conversation Date & Time").getAttribute("value")).toContain("2026");
});
