import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { missingConversationDates, missingCallDates } from "../src/activityDates";
import { SimulatorDateTimeField } from "../src/SimulatorDateTimeField";
it("requires every message and call to have a complete date and time", () => {
  expect(missingConversationDates([])).toBe(false);
  expect(missingConversationDates([{ messages: [] }])).toBe(true);
  expect(missingConversationDates([{ messages: [{ timestamp: "2:30 PM" }] }])).toBe(true);
  expect(missingConversationDates([{ messages: [{ timestamp: "2026-11-09T14:30:00Z" }] }])).toBe(
    false,
  );
  expect(missingCallDates(undefined)).toBe(false);
  expect(missingCallDates({ calls: [] })).toBe(false);
  expect(missingCallDates({ calls: [{ id: "a", type: "received" }] })).toBe(true);
  expect(
    missingCallDates({ calls: [{ id: "a", type: "received", timestamp: "2026-11-09T14:30:00Z" }] }),
  ).toBe(false);
  expect(missingCallDates({ calls: [{ id: "a", type: "bad" }] })).toBe(true);
});
it("clearing either required date/time removes the old timestamp, while completing both restores it", () => {
  function Field() {
    const [value, setValue] = useState("2026-11-09T14:30:00Z");
    return (
      <>
        <SimulatorDateTimeField value={value} onChange={setValue} required compact />
        <output aria-label="Saved timestamp">{value}</output>
      </>
    );
  }
  render(<Field />);
  const date = screen.getByLabelText("Sent Date"),
    time = screen.getByLabelText("Time");
  expect(date).toBeRequired();
  expect(time).toBeRequired();
  fireEvent.change(date, { target: { value: "" } });
  expect(screen.getByLabelText("Saved timestamp")).toBeEmptyDOMElement();
  expect(date).toHaveAttribute("aria-invalid", "true");
  fireEvent.change(date, { target: { value: "2026-11-10" } });
  expect(screen.getByLabelText("Saved timestamp").textContent).not.toBe("");
  fireEvent.change(time, { target: { value: "" } });
  expect(screen.getByLabelText("Saved timestamp")).toBeEmptyDOMElement();
  fireEvent.change(time, { target: { value: "16:45" } });
  expect(screen.getByLabelText("Saved timestamp").textContent).toContain("2026-11-10");
});
