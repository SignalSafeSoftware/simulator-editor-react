import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { SimulatorHomeContentEditor } from "../src/SimulatorHomeContentEditor";
import { readHomeContent, homeContentComplete } from "../src/simulatorHomeContent";
import { photoSchema, secretSchema } from "@signalsafe/simulator-core/apps/contracts";
function setup(initial: unknown = {}) {
  let saved = initial;
  const select = vi.fn();
  function Editor() {
    const [value, setValue] = useState(initial);
    saved = value;
    return <SimulatorHomeContentEditor value={value} onChange={setValue} onPageSelect={select} />;
  }
  const view = render(<Editor />);
  return { view, select, data: () => readHomeContent(saved) };
}
it("replaces obsolete Home forms with three editors and authors portable settings", () => {
  const editor = setup();
  expect(screen.queryByText("Widgets")).toBeNull();
  fireEvent.change(screen.getByLabelText("Appearance preset"), { target: { value: "ocean" } });
  expect(editor.data().settings.appearance?.background).toBe("#f2f7fc");
  fireEvent.change(screen.getByLabelText("Accent color"), { target: { value: "#123456" } });
  fireEvent.change(screen.getByLabelText("Background color"), { target: { value: "#112233" } });
  fireEvent.change(screen.getByLabelText("Time format"), { target: { value: "24" } });
  fireEvent.change(screen.getByLabelText("Date format"), { target: { value: "dmy" } });
  fireEvent.change(screen.getByLabelText("Language"), { target: { value: "fr" } });
  for (const [label, value] of [
    ["Country code", "CA"],
    ["Currency code", "CAD"],
    ["Time zone", "UTC"],
  ] as const) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fireEvent.blur(screen.getByLabelText(label));
  }
  expect(editor.data().settings.regional).toMatchObject({
    country: "CA",
    currency: "CAD",
    timeZone: "UTC",
    language: "fr",
    dateFormat: "dmy",
    timeFormat: "24",
  });
  fireEvent.change(screen.getByLabelText("Time zone"), { target: { value: "Invalid/Zone" } });
  fireEvent.blur(screen.getByLabelText("Time zone"));
  expect(screen.getByLabelText("Time zone")).toHaveValue("UTC");
  expect(editor.data().settings.regional?.timeZone).toBe("UTC");
});
it("adds, changes and removes Vault entries and reuses folders without losing Photos/settings", () => {
  const editor = setup();
  fireEvent.click(screen.getByRole("button", { name: "Vault" }));
  expect(editor.select).toHaveBeenCalledWith("vault");
  fireEvent.click(screen.getByRole("button", { name: "Add item to Unfiled" }));
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Bank login" } });
  fireEvent.change(screen.getByLabelText("Vault folder"), { target: { value: "Finance" } });
  fireEvent.blur(screen.getByLabelText("Vault folder"));
  fireEvent.change(screen.getByLabelText("Entry type"), { target: { value: "credentials" } });
  fireEvent.change(screen.getByLabelText("Username"), { target: { value: "learner" } });
  fireEvent.change(screen.getByLabelText("Value"), { target: { value: "fictional" } });
  expect(secretSchema.safeParse(editor.data().vault.items[0]).success).toBe(true);
  expect(editor.data().vault.folders).toContain("Finance");
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "" } });
  expect(homeContentComplete(editor.data())).toBe(false);
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Bank login" } });
  expect(homeContentComplete(editor.data())).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Remove Bank login" }));
  expect(editor.data().vault.items).toEqual([]);
});
it("uploads and edits photos, retains original metadata, and removes records", async () => {
  const editor = setup();
  fireEvent.click(screen.getByRole("button", { name: "Photos" }));
  fireEvent.click(screen.getByRole("button", { name: "Add photos item" }));
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Holiday" } });
  fireEvent.change(screen.getByLabelText("Caption"), { target: { value: "At the beach" } });
  fireEvent.change(screen.getByLabelText("Captured date"), { target: { value: "2026-11-09" } });
  fireEvent.change(screen.getByLabelText("Time"), { target: { value: "10:30" } });
  expect(screen.queryByLabelText("Photo time zone")).toBeNull();
  fireEvent.change(screen.getByLabelText("Latitude"), { target: { value: "40" } });
  fireEvent.change(screen.getByLabelText("Longitude"), { target: { value: "-105" } });
  expect(editor.data().photos.items[0]?.original.capturedAt).toBe("");
  expect(photoSchema.safeParse(editor.data().photos.items[0]).success).toBe(false);
  const file = new File([new Uint8Array([137, 80, 78, 71])], "test.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("Image file"), { target: { files: [file] } });
  await waitFor(() => expect(editor.data().photos.items[0]?.asset.name).toBe("test.png"));
  expect(editor.data().photos.items[0]?.caption).toBe("At the beach");
  expect(photoSchema.safeParse(editor.data().photos.items[0]).success).toBe(true);
  fireEvent.change(screen.getByLabelText("Image file"), {
    target: { files: [new File(["text"], "bad.txt", { type: "text/plain" })] },
  });
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("PNG"));
  fireEvent.click(screen.getByRole("button", { name: "Remove photos item 1" }));
  expect(editor.data().photos.items).toEqual([]);
});
it("follows preview page selection and exposes invalid data for JSON repair", () => {
  const view = render(
    <SimulatorHomeContentEditor value={{}} onChange={vi.fn()} selectedPage="vault" />,
  );
  expect(screen.getByRole("button", { name: "Add item to Unfiled" })).toBeTruthy();
  view.rerender(<SimulatorHomeContentEditor value={{}} onChange={vi.fn()} selectedPage="photos" />);
  expect(screen.getByRole("button", { name: "Add photos item" })).toBeTruthy();
  view.rerender(
    <SimulatorHomeContentEditor value={{ vault: { items: "bad" } }} onChange={vi.fn()} />,
  );
  expect(screen.getByRole("alert").textContent).toContain("Repair invalid Home content");
  expect(homeContentComplete({ vault: { items: "bad" } })).toBe(false);
});
