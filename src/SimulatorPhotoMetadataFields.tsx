import { SimulatorDateTimeField } from "./SimulatorDateTimeField.js";
import type { PhotoMetadata } from "@signalsafe/simulator-core/apps/contracts";
export function SimulatorPhotoMetadataFields({
  value,
  onChange,
}: Readonly<{ value: PhotoMetadata; onChange: (value: PhotoMetadata) => void }>) {
  return (
    <>
      <SimulatorDateTimeField
        compact
        label="Captured date and time"
        dateLabel="Captured date"
        storage="local"
        value={value.capturedAt}
        onChange={(capturedAt) => onChange({ ...value, capturedAt })}
      />
      {(["latitude", "longitude"] as const).map((key) => (
        <label className="form-label d-block mb-3" key={key}>
          {key === "latitude" ? "Latitude" : "Longitude"}
          <input
            type="number"
            step="any"
            min={key === "latitude" ? -90 : -180}
            max={key === "latitude" ? 90 : 180}
            className="form-control"
            value={value[key] ?? ""}
            onChange={(e) => {
              const number = e.target.valueAsNumber;
              onChange({
                ...value,
                [key]: e.target.value === "" ? null : Number.isFinite(number) ? number : value[key],
              });
            }}
          />
        </label>
      ))}
    </>
  );
}
