import { useCallback, useRef, useState } from "react";
import { photoSchema, type Photo } from "@signalsafe/simulator-core/apps/contracts";
import type { PhotoNavigation } from "@signalsafe/simulator-react/apps/photos/Photos";
import { homeContentSchema } from "./simulatorHomeContent.js";
import type { SimulatorEditorProps } from "./editorTypes.js";
export interface PhotoEditorSelection {
  selection?: { id?: string; revision: number };
  navigate: (id: string | undefined) => void;
}
/** Keep preview selection and photo mutations attached to the authored collection. */
export function useSimulatorPhotoSelection(
  activate: (section: "photos") => void,
  highlight: (section: "photos") => void,
  sections: SimulatorEditorProps["sections"],
  onChange: SimulatorEditorProps["onChange"],
) {
  const revision = useRef(0);
  const [selection, setSelection] = useState<PhotoEditorSelection["selection"]>();
  const [navigation, setNavigation] = useState<PhotoNavigation>();
  const follow = useCallback(
    (id: string | undefined) => {
      activate("photos");
      highlight("photos");
      setNavigation(undefined);
      setSelection((previous) => ({ id, revision: (previous?.revision ?? 0) + 1 }));
    },
    [activate, highlight],
  );
  const readPhotos = () =>
    homeContentSchema.safeParse({ photos: sections.find((item) => item.key === "photos")?.value });
  const navigate = (id: string | undefined) => {
    const parsed = readPhotos();
    const photo =
      id === undefined
        ? null
        : photoSchema.safeParse(
            parsed.success ? parsed.data.photos.items.find((item) => item.id === id) : undefined,
          );
    if (photo !== null && !photo.success) return;
    activate("photos");
    highlight("photos");
    setNavigation({ photo: photo === null ? null : photo.data, revision: ++revision.current });
  };
  const preview = {
    photoNavigation: navigation,
    onPhotoSelect: follow,
    onPhotoSave: (photo: Photo) => {
      const parsed = readPhotos();
      if (parsed.success)
        onChange("photos", {
          items: [...parsed.data.photos.items.filter((item) => item.id !== photo.id), photo],
        });
    },
    onPhotoRemove: (id: string) => {
      const parsed = readPhotos();
      if (parsed.success)
        onChange("photos", {
          ...parsed.data.photos,
          items: parsed.data.photos.items.filter((item) => item.id !== id),
        });
      follow(undefined);
    },
  };
  return { editor: { selection, navigate }, preview };
}
