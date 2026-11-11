import { SimulatorPhotoMetadataFields } from "./SimulatorPhotoMetadataFields.js";
import { useEffect, useId, useRef, useState } from "react";
import {
  MAX_PHOTO_BYTES,
  emptyMetadata,
  photoAssetSchema,
} from "@signalsafe/simulator-core/apps/contracts";
import { SimulatorRecordList } from "./SimulatorRecordList.js";
import { SimulatorContentFields, contentObject } from "./SimulatorContentFields.js";
import { homeContentSchema, type HomeContent } from "./simulatorHomeContent.js";
export function SimulatorPhotosContentEditor({
  selectedId,
  onSelect,
  value,
  onChange,
}: Readonly<{
  selectedId?: string;
  onSelect?: (id: string | undefined) => void;
  value: HomeContent["photos"];
  onChange: (value: HomeContent["photos"]) => void;
}>) {
  const latest = useRef({ value, onChange });
  const upload = useRef(0);
  useEffect(() => {
    latest.current = { value, onChange };
  }, [value, onChange]);
  useEffect(
    () => () => {
      upload.current += 1;
    },
    [],
  );
  const [error, setError] = useState("");
  const id = useId();
  return (
    <>
      <SimulatorRecordList
        title="Photos"
        selectedId={selectedId}
        onSelect={onSelect}
        value={value.items}
        fields={{}}
        create={() => {
          const now = new Date().toISOString();
          return {
            title: "New photo",
            caption: "",
            asset: { name: "", mime: "image/png", data: "" },
            original: { ...emptyMetadata },
            metadata: { ...emptyMetadata },
            createdAt: now,
            updatedAt: now,
          };
        }}
        label={(item) => (typeof item.title === "string" ? item.title : "")}
        onChange={(items) => {
          const parsed = homeContentSchema.shape.photos.safeParse({ items });
          if (parsed.success) onChange(parsed.data);
        }}
        renderEditor={(item, change) => (
          <>
            <label className="form-label d-block mb-3">
              Image file
              <input
                type="file"
                className="form-control"
                accept="image/png,image/jpeg,image/webp"
                aria-describedby={error ? id : undefined}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > MAX_PHOTO_BYTES) {
                    setError("Photos must be at most 25 MiB.");
                    return;
                  }
                  const operation = ++upload.current;
                  const reader = new FileReader();
                  reader.onerror = () => setError("Could not read this image.");
                  reader.onload = () => {
                    if (operation !== upload.current) return;
                    const asset = photoAssetSchema.safeParse({
                      name: file.name,
                      mime: file.type,
                      data: reader.result,
                    });
                    if (!asset.success) {
                      setError("Choose a PNG, JPEG or WebP image.");
                      return;
                    }
                    setError("");
                    const current = latest.current;
                    if (!current.value.items.some((row) => row.id === item.id)) return;
                    current.onChange({
                      ...current.value,
                      items: current.value.items.map((row) =>
                        row.id === item.id
                          ? { ...row, asset: asset.data, updatedAt: new Date().toISOString() }
                          : row,
                      ),
                    });
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            {contentObject(item.asset) &&
              typeof item.asset.data === "string" &&
              item.asset.data !== "" && (
                <img
                  src={item.asset.data}
                  alt={typeof item.title === "string" ? item.title : "Photo"}
                  className="img-fluid rounded mb-3"
                />
              )}
            <SimulatorContentFields
              plain
              label="Photo"
              value={{ title: item.title, caption: item.caption }}
              onChange={(next) => {
                if (contentObject(next))
                  change({ ...item, ...next, updatedAt: new Date().toISOString() });
              }}
            />
            {contentObject(item.metadata) && (
              <SimulatorPhotoMetadataFields
                value={
                  homeContentSchema.shape.photos.unwrap().shape.items.element.parse(item).metadata
                }
                onChange={(metadata) =>
                  change({ ...item, metadata, updatedAt: new Date().toISOString() })
                }
              />
            )}
          </>
        )}
      />
      {error && (
        <p id={id} role="alert" className="text-danger">
          {error}
        </p>
      )}
    </>
  );
}
