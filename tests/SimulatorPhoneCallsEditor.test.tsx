import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { SimulatorPhoneCallsEditor } from "../src/SimulatorPhoneCallsEditor";

it("authors all nine unique call types in one collection", () => {
  function Editor() {
    const [value, setValue] = useState<unknown>({ calls: [] });
    return <SimulatorPhoneCallsEditor value={value} onChange={setValue} />;
  }
  render(<Editor />);
  fireEvent.click(screen.getByRole("button", { name: "Add calls item" }));
  const select = screen.getByLabelText("Call type");
  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
    "Incoming — Someone is calling you.",
    "Calling — You’re calling someone.",
    "Received — You answered their call.",
    "Accepted — They answered your call.",
    "Missed — You didn’t answer.",
    "Voicemail — They left a message.",
    "Unanswered — They didn’t answer.",
    "Cancelled — You stopped calling before they answered.",
    "Declined — You rejected their call.",
  ]);
  fireEvent.change(screen.getByLabelText("Caller name"), { target: { value: "Bank" } });
  fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "123" } });
  fireEvent.change(select, { target: { value: "voicemail" } });
  expect(screen.getByLabelText("Caller name")).toHaveValue("Bank");
  expect(screen.getByLabelText("Phone number")).toHaveValue("123");
  expect(screen.getByLabelText("Transcript")).toBeVisible();
});

it("retains an imported outgoing outcome without guessing it was accepted", () => {
  render(
    <SimulatorPhoneCallsEditor
      value={{ history: [{ id: "old", name: "Imported", direction: "out" }] }}
      onChange={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole("treeitem", { name: "Outgoing" }));
  expect(screen.getByLabelText("Call type")).toHaveValue("outgoing");
  expect(screen.getByRole("option", { name: "Outgoing (outcome unknown)" })).toBeVisible();
});

it("groups a person's calls and edits all records without losing ids", () => {
  const change = vi.fn();
  render(
    <SimulatorPhoneCallsEditor
      value={{
        calls: [
          {
            id: "old",
            name: "James",
            number: "+1 (303) 333-3333",
            type: "missed",
            timestamp: "2026-11-01T09:00:00Z",
          },
          {
            id: "mom",
            name: "Mom",
            number: "+13032649086",
            type: "received",
            timestamp: "2026-11-22T01:00:00Z",
          },
          {
            id: "new",
            name: "James",
            number: "+13033333333",
            type: "received",
            timestamp: "2026-11-01T11:00:00Z",
          },
        ],
      }}
      onChange={change}
    />,
  );
  expect(screen.getAllByRole("treeitem", { name: "James" })).toHaveLength(1);
  const people = screen
    .getAllByRole("treeitem")
    .filter((button) => ["James", "Mom"].includes(button.getAttribute("aria-label") ?? ""));
  expect(people.map((button) => button.getAttribute("aria-label"))).toEqual(["Mom", "James"]);
  fireEvent.click(screen.getByRole("button", { name: "Expand James" }));
  const records = screen
    .getAllByRole("treeitem")
    .filter((button) => button.getAttribute("data-parent-id") === "group:new");
  expect(records.map((button) => button.textContent)).toEqual([
    "Received — 2026-11-01T11:00:00Z",
    "Missed — 2026-11-01T09:00:00Z",
  ]);
  fireEvent.click(screen.getByRole("button", { name: "Add item to James" }));
  expect(change).toHaveBeenLastCalledWith(
    expect.objectContaining({
      calls: expect.arrayContaining([
        expect.objectContaining({ id: "old" }),
        expect.objectContaining({ id: "new" }),
        expect.objectContaining({ name: "James", number: "+13033333333", type: "received" }),
      ]),
    }),
  );
});
