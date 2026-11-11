import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { SimulatorPhoneCallsEditor } from "../src/SimulatorPhoneCallsEditor";
vi.mock("@signalsafe/simulator-react/utils/payload/phoneCallGroups", () => ({
  phoneCallGroups: () => [[]],
}));
it("tolerates an empty group returned by the grouping adapter", () => {
  render(<SimulatorPhoneCallsEditor value={{ calls: [] }} onChange={() => {}} />);
  expect(screen.getByRole("tree", { name: "Calls" })).toBeTruthy();
  expect(screen.queryByRole("treeitem")).toBeNull();
});
