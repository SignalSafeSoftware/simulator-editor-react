import type { ComponentProps } from "react";
import { act, cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { SimulatorContentFields } from "../src/SimulatorContentFields";
import type { SimulatorRecordList } from "../src/SimulatorRecordList";
import { SimulatorPhoneCallFields } from "../src/SimulatorPhoneCallFields";
import { SimulatorPhotosContentEditor } from "../src/SimulatorPhotosContentEditor";
import { SimulatorVaultEntryFields } from "../src/SimulatorVaultEntryFields";
import { SimulatorHomeSectionEditor } from "../src/SimulatorHomeSectionEditor";
import { homeContentSchema } from "../src/simulatorHomeContent";
const captured = vi.hoisted(() => ({
  fields: [] as ComponentProps<typeof SimulatorContentFields>[],
  records: [] as ComponentProps<typeof SimulatorRecordList>[],
}));
vi.mock("../src/SimulatorContentFields", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/SimulatorContentFields")>();
  return {
    ...actual,
    SimulatorContentFields: (props: ComponentProps<typeof SimulatorContentFields>) => {
      captured.fields.push(props);
      return null;
    },
  };
});
vi.mock("../src/SimulatorRecordList", () => ({
  SimulatorRecordList: (props: ComponentProps<typeof SimulatorRecordList>) => {
    captured.records.push(props);
    return null;
  },
}));
afterEach(() => {
  cleanup();
  captured.fields = [];
  captured.records = [];
});
it("merges object call edits and refuses scalar field updates", () => {
  const changed = vi.fn();
  render(
    <SimulatorPhoneCallFields
      item={{ id: "one", type: "incoming", name: "Example" }}
      change={changed}
    />,
  );
  const fields = captured.fields.find((item) => item.label === "Call");
  if (!fields) throw new Error("Call fields missing");
  act(() => fields.onChange(false));
  expect(changed).not.toHaveBeenCalled();
  act(() => fields.onChange({ transcript: "Example" }));
  expect(changed).toHaveBeenCalledWith(
    expect.objectContaining({ transcript: "Example", id: "one" }),
  );
});
it("rejects malformed photo collection edits and safely renders partial record slots", () => {
  const changed = vi.fn();
  render(<SimulatorPhotosContentEditor value={{ items: [] }} onChange={changed} />);
  const record = captured.records[0];
  if (!record?.renderEditor) throw new Error("Photo records missing");
  expect(record.label({ title: false })).toBe("");
  act(() => record.onChange([{ id: "invalid" }]));
  expect(changed).not.toHaveBeenCalled();
  render(
    <>
      {record.renderEditor(
        { id: "one", asset: { data: "data:image/png;base64,AAAA" } },
        changed,
        () => {},
      )}
    </>,
  );
  const fields = captured.fields.find((item) => item.label === "Photo");
  if (!fields) throw new Error("Photo fields missing");
  act(() => fields.onChange(false));
  expect(changed).not.toHaveBeenCalled();
});
it("rejects incomplete Vault edits before calling the host", () => {
  const changed = vi.fn();
  const item = homeContentSchema.parse({
    vault: {
      folders: ["Unfiled"],
      items: [
        {
          id: "one",
          title: "Example",
          type: "note",
          folder: "Unfiled",
          value: "fictional",
          username: "",
          site: "",
          notes: "",
          createdAt: "2026-11-11T00:00:00Z",
          updatedAt: "2026-11-11T00:00:00Z",
        },
      ],
    },
  }).vault.items[0];
  if (!item) throw new Error("Vault record missing");
  render(<SimulatorVaultEntryFields item={item} folders={["Unfiled"]} onChange={changed} />);
  for (const field of captured.fields)
    act(() => {
      field.onChange(false);
      field.onChange({ title: 4 });
    });
  expect(changed).not.toHaveBeenCalled();
});
it("mounts standalone Settings and reports its authored changes", () => {
  const changed = vi.fn();
  render(<SimulatorHomeSectionEditor page="settings" value={{}} onChange={changed} />);
  fireEvent.change(screen.getByLabelText("Background color"), { target: { value: "#112233" } });
  expect(changed).toHaveBeenCalledWith(
    expect.objectContaining({ appearance: expect.objectContaining({ background: "#112233" }) }),
  );
});
