import { useCallback, useState } from "react";
/** Remember the open collection group within its authoring section. */
export function useSimulatorCollectionSelection(section: string) {
  const [collectionSelection, setCollectionSelection] = useState<{
    section: string;
    group: string;
  }>();
  const selectCollectionGroup = useCallback(
    (group: string) =>
      setCollectionSelection((previous) =>
        previous?.section === section && previous.group === group ? previous : { section, group },
      ),
    [section],
  );
  return { collectionSelection, selectCollectionGroup };
}
