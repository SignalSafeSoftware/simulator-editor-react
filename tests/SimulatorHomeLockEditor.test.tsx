import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { SimulatorHomeLockEditor } from "../src/SimulatorHomeLockEditor";
const mocks = vi.hoisted(() => ({ available: true, create: vi.fn() }));
vi.mock("@signalsafe/simulator-react/apps/lock/lock", () => ({
  isLockAvailable: () => mocks.available,
  createLock: mocks.create,
}));
it("sets a hashed password, clears input, and removes a lock", async () => {
  const change = vi.fn();
  mocks.available = true;
  const lock = { salt: "a".repeat(32), digest: "b".repeat(64) };
  mocks.create.mockResolvedValue(lock);
  const view = render(<SimulatorHomeLockEditor value={null} onChange={change} />);
  fireEvent.change(screen.getByLabelText("New screen password"), {
    target: { value: "test-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Set screen password" }));
  await waitFor(() => expect(change).toHaveBeenCalledWith(lock));
  expect(screen.getByLabelText("New screen password")).toHaveProperty("value", "");
  view.rerender(<SimulatorHomeLockEditor value={lock} onChange={change} />);
  fireEvent.click(screen.getByRole("button", { name: "Remove screen password" }));
  expect(change).toHaveBeenCalledWith(null);
});
it("retains a failed password and explains unsupported browsers", async () => {
  const change = vi.fn();
  mocks.create.mockRejectedValue(new Error("Unavailable"));
  mocks.available = true;
  const view = render(<SimulatorHomeLockEditor value={null} onChange={change} />);
  fireEvent.change(screen.getByLabelText("New screen password"), {
    target: { value: "test-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Set screen password" }));
  await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Unavailable"));
  expect(change).not.toHaveBeenCalled();
  view.unmount();
  mocks.available = false;
  render(<SimulatorHomeLockEditor value={null} onChange={change} />);
  expect(screen.getByRole("button", { name: "Set screen password" })).toHaveProperty(
    "disabled",
    true,
  );
  expect(screen.getByText(/require HTTPS/)).toBeTruthy();
  mocks.available = true;
});
