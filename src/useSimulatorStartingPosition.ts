import { useCallback, useState } from "react";
import type { SimulatorEditorProps } from "./editorTypes.js";
import type { SimulatorEntryPoint } from "@signalsafe/simulator-core/devicePayload";
/** Ignore equivalent reports so clock ticks and host renders do not rewrite navigation. */
export function useSimulatorStartingPosition(
  sections: SimulatorEditorProps["sections"],
  onChange: SimulatorEditorProps["onChange"],
) {
  const [previewPosition, setPreviewPosition] = useState<SimulatorEntryPoint>();
  const followStartingPosition = useCallback((position: SimulatorEntryPoint) => {
    setPreviewPosition((previous) =>
      JSON.stringify(previous) === JSON.stringify(position) ? previous : position,
    );
  }, []);
  return { buttonProps: { position: previewPosition, sections, onChange }, followStartingPosition };
}
