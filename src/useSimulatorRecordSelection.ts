import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import type { SimulatorEditorNavigation } from "./editorTypes.js";
/** Authored row clicks navigate even when the record id is unchanged. */
export function useSimulatorRecordSelection(
  section: string,
  navigate: Dispatch<SetStateAction<SimulatorEditorNavigation | undefined>>,
) {
  const [recordId, setRecordId] = useState<string>();
  const selectRecord = useCallback(
    (id: string | undefined) => {
      setRecordId(id);
      if (id !== undefined)
        navigate((previous) => ({
          section,
          itemId: id,
          revision: (previous?.revision ?? 0) + 1,
        }));
    },
    [navigate, section],
  );
  return [recordId, setRecordId, selectRecord] as const;
}
