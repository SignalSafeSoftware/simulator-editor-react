import { useCallback, useState } from "react";
import type { SimulatorEditorProps, SimulatorEditorSection } from "./editorTypes.js";
/** Restoring a selected record must not replace the starting-position controls. */
export function useSimulatorEditorSection(sections: SimulatorEditorProps["sections"]) {
  const [section, setSection] = useState<SimulatorEditorSection>("messages");
  const [activeShortcut, setActiveShortcut] = useState<string>();
  const activate = useCallback((next: SimulatorEditorSection) => {
    setSection((previous) => (previous === "entry_point" ? previous : next));
  }, []);
  const highlight = useCallback((next: string | undefined) => {
    setActiveShortcut((previous) => (previous === "entry_point" ? previous : next));
  }, []);
  const followSelection = useCallback(
    (next: SimulatorEditorSection) => {
      activate(next);
      highlight(next);
    },
    [activate, highlight],
  );
  const followPreviewSection = useCallback(
    (next: string | undefined) => {
      const selected = sections.find((item) => item.key === next);
      if (selected) {
        setSection(selected.key);
        setActiveShortcut(selected.key);
      }
    },
    [sections],
  );
  return {
    section,
    setSection,
    activeShortcut,
    setActiveShortcut,
    activate,
    highlight,
    followPreviewSection,
    followSelection,
  };
}
