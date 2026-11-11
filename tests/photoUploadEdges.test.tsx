import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { photoSchema, MAX_PHOTO_BYTES } from "@signalsafe/simulator-core/apps/contracts";
import { SimulatorPhotosContentEditor } from "../src/SimulatorPhotosContentEditor";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const stamp = "2026-11-11T00:00:00Z",
  metadata = { capturedAt: "", timeZone: "", latitude: null, longitude: null };
const photo = photoSchema.parse({
  id: "one",
  title: "Example",
  caption: "",
  asset: { name: "one.png", mime: "image/png", data: "data:image/png;base64,AAAA" },
  original: metadata,
  metadata,
  createdAt: stamp,
  updatedAt: stamp,
});
it("reports oversized, failed and superseded uploads without overwriting the selected photo", () => {
  const readers: FileReader[] = [];
  vi.spyOn(FileReader.prototype, "readAsDataURL").mockImplementation(function (this: FileReader) {
    readers.push(this);
  });
  const changed = vi.fn();
  const view = render(
    <SimulatorPhotosContentEditor value={{ items: [photo] }} selectedId="one" onChange={changed} />,
  );
  const input = screen.getByLabelText("Image file");
  fireEvent.change(input, { target: { files: [] } });
  const large = new File(["x"], "large.png", { type: "image/png" });
  Object.defineProperty(large, "size", { value: MAX_PHOTO_BYTES + 1 });
  fireEvent.change(input, { target: { files: [large] } });
  expect(screen.getByRole("alert")).toHaveTextContent("25 MiB");
  const file = new File(["x"], "example.png", { type: "image/png" });
  fireEvent.change(input, { target: { files: [file] } });
  act(() => {
    readers[0]?.dispatchEvent(new ProgressEvent("error"));
  });
  expect(screen.getByRole("alert")).toHaveTextContent("Could not read");
  fireEvent.change(input, { target: { files: [file] } });
  fireEvent.change(input, { target: { files: [file] } });
  const first = readers[1],
    last = readers[2];
  if (!first || !last) throw new Error("Readers missing");
  Object.defineProperty(first, "result", { value: "data:image/png;base64,AAAA" });
  act(() => {
    first.dispatchEvent(new ProgressEvent("load"));
  });
  expect(changed).not.toHaveBeenCalled();
  Object.defineProperty(last, "result", { value: "data:image/png;base64,AAAA" });
  view.rerender(
    <SimulatorPhotosContentEditor value={{ items: [] }} selectedId="one" onChange={changed} />,
  );
  act(() => {
    last.dispatchEvent(new ProgressEvent("load"));
  });
  expect(changed).not.toHaveBeenCalled();
});
it("updates authored photo metadata independently of its original capture data", () => {
  const changed = vi.fn();
  render(
    <SimulatorPhotosContentEditor value={{ items: [photo] }} selectedId="one" onChange={changed} />,
  );
  fireEvent.change(screen.getByLabelText("Latitude"), { target: { value: "40" } });
  expect(changed).toHaveBeenCalledWith({
    items: [
      expect.objectContaining({
        metadata: expect.objectContaining({ latitude: 40 }),
        original: metadata,
      }),
    ],
  });
});
it("replaces one uploaded asset without changing its siblings", () => {
  const readers: FileReader[] = [];
  vi.spyOn(FileReader.prototype, "readAsDataURL").mockImplementation(function (this: FileReader) {
    readers.push(this);
  });
  const changed = vi.fn();
  const sibling = { ...photo, id: "two", title: "Other" };
  render(
    <SimulatorPhotosContentEditor
      value={{ items: [photo, sibling] }}
      selectedId="one"
      onChange={changed}
    />,
  );
  fireEvent.change(screen.getByLabelText("Image file"), {
    target: { files: [new File(["x"], "updated.png", { type: "image/png" })] },
  });
  const reader = readers[0];
  if (!reader) throw new Error("Reader missing");
  Object.defineProperty(reader, "result", { value: "data:image/png;base64,AAAA" });
  act(() => reader?.dispatchEvent(new ProgressEvent("load")));
  expect(changed).toHaveBeenCalledWith({
    items: [
      expect.objectContaining({ asset: expect.objectContaining({ name: "updated.png" }) }),
      sibling,
    ],
  });
});
