import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { SimulatorEditor } from "../src/SimulatorEditor";
import type { SimulatorEditorSectionValue } from "../src/editorTypes";
const stamp = "2026-11-10T12:00:00Z";
const metadata = { capturedAt: "", timeZone: "", latitude: null, longitude: null };
const photo = {
  id: "photo-1",
  title: "Training photo",
  caption: "Training",
  asset: { name: "training.png", mime: "image/png" as const, data: "data:image/png;base64,AAAA" },
  metadata,
  original: metadata,
  createdAt: stamp,
  updatedAt: stamp,
};
function Workspace() {
  const [sections, setSections] = useState<SimulatorEditorSectionValue[]>([
    { key: "photos", label: "Photos", value: { items: [photo] } },
  ]);
  return (
    <SimulatorEditor
      sections={sections}
      onChange={(key, value) =>
        setSections((current) =>
          current.map((item) => (item.key === key ? { ...item, value } : item)),
        )
      }
      renderPreview={(context) => (
        <>
          <output aria-label="Photo navigation">{JSON.stringify(context.photoNavigation)}</output>
          <output aria-label="Authored photos">{JSON.stringify(sections[0]?.value)}</output>
          <button onClick={() => context.onPhotoSelect?.(photo.id)}>Open preview photo</button>
          <button onClick={() => context.onPhotoSelect?.(undefined)}>Preview Back</button>
          <button onClick={() => context.onPhotoRemove?.(photo.id)}>Preview delete</button>
          <button onClick={() => context.onPhotoSave?.({ ...photo, title: "Changed photo" })}>
            Preview Save
          </button>
        </>
      )}
    />
  );
}
it("follows preview opening, Back and deletion in the collection and inspector", () => {
  render(<Workspace />);
  fireEvent.click(screen.getByRole("button", { name: "Open preview photo" }));
  expect(screen.getByLabelText("Title")).toHaveValue("Training photo");
  const list = screen.getByRole("region", { name: "Simulator collections" });
  expect(within(list).getByRole("button", { name: "Training photo" })).toHaveAttribute(
    "aria-current",
    "true",
  );
  fireEvent.click(screen.getByRole("button", { name: "Preview Back" }));
  expect(screen.queryByLabelText("Title")).toBeNull();
  expect(within(list).getByRole("button", { name: "Training photo" })).not.toHaveAttribute(
    "aria-current",
  );
  fireEvent.click(screen.getByRole("button", { name: "Open preview photo" }));
  fireEvent.click(screen.getByRole("button", { name: "Preview delete" }));
  expect(within(list).queryByRole("button", { name: "Training photo" })).toBeNull();
  expect(screen.queryByLabelText("Title")).toBeNull();
  expect(screen.getByLabelText("Authored photos")).toHaveTextContent('{"items":[]}');
});
it("requests preview navigation from the photo list and applies saved photo changes", () => {
  render(<Workspace />);
  fireEvent.click(screen.getByRole("button", { name: "Photos" }));
  const list = screen.getByRole("region", { name: "Simulator collections" });
  fireEvent.click(within(list).getByRole("button", { name: "Training photo" }));
  expect(screen.getByLabelText("Photo navigation")).toHaveTextContent('"id":"photo-1"');
  fireEvent.click(screen.getByRole("button", { name: "Preview Save" }));
  expect(screen.getByLabelText("Authored photos")).toHaveTextContent("Changed photo");
});
