import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { SimulatorPhotoMetadataFields } from "../src/SimulatorPhotoMetadataFields";
import { emptyMetadata, type PhotoMetadata } from "@signalsafe/simulator-core/apps/contracts";
it("uses shared separate date/time controls and preserves hidden zone/location metadata", () => {
  let saved: PhotoMetadata = {
    ...emptyMetadata,
    timeZone: "America/New_York",
    capturedAt: "2026-03-08T02:30:00",
    latitude: 40,
    longitude: -74,
  };
  function Editor() {
    const [value, setValue] = useState(saved);
    saved = value;
    return <SimulatorPhotoMetadataFields value={value} onChange={setValue} />;
  }
  render(<Editor />);
  expect(screen.queryByLabelText("Photo time zone")).toBeNull();
  expect(screen.getByLabelText("Captured date")).toHaveAttribute("type", "date");
  expect(screen.getByLabelText("Time")).toHaveAttribute("type", "time");
  expect(screen.getByLabelText("Time")).toHaveValue("02:30:00");
  fireEvent.change(screen.getByLabelText("Time"), { target: { value: "02:45:01" } });
  expect(saved).toEqual({
    ...emptyMetadata,
    timeZone: "America/New_York",
    capturedAt: "2026-03-08T02:45:01",
    latitude: 40,
    longitude: -74,
  });
  fireEvent.change(screen.getByLabelText("Captured date"), { target: { value: "" } });
  expect(saved.capturedAt).toBe("");
});
it("keeps partial date-first input until a time completes a local capture value", () => {
  let saved = { ...emptyMetadata };
  function Editor() {
    const [value, setValue] = useState(saved);
    saved = value;
    return <SimulatorPhotoMetadataFields value={value} onChange={setValue} />;
  }
  render(<Editor />);
  fireEvent.change(screen.getByLabelText("Captured date"), { target: { value: "2026-11-09" } });
  expect(saved.capturedAt).toBe("");
  expect(screen.getByLabelText("Captured date")).toHaveValue("2026-11-09");
  fireEvent.change(screen.getByLabelText("Time"), { target: { value: "14:15" } });
  expect(saved.capturedAt).toBe("2026-11-09T14:15");
  expect(saved.timeZone).toBe("");
});
it("clears coordinates explicitly and preserves them when a browser supplies a nonfinite number", () => {
  const changed = vi.fn();
  render(
    <SimulatorPhotoMetadataFields
      value={{ ...emptyMetadata, latitude: 40, longitude: 20 }}
      onChange={changed}
    />,
  );
  const latitude = screen.getByLabelText("Latitude");
  fireEvent.change(latitude, { target: { value: "" } });
  expect(changed).toHaveBeenCalledWith(expect.objectContaining({ latitude: null }));
  latitude.setAttribute("type", "text");
  fireEvent.change(latitude, { target: { value: "not a number" } });
  expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ latitude: 40 }));
});
