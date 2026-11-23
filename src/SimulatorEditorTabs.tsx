import type { SimulatorEditorView } from "./editorTypes.js";
const TAB_LABELS: Readonly<Record<SimulatorEditorView, string>> = {
  properties: "Properties",
  simulator: "Preview",
  json: "JSON",
};

export function SimulatorEditorTabs({
  tabs,
  tab,
  viewId,
  disabled,
  onChange,
}: Readonly<{
  tabs: readonly SimulatorEditorView[];
  tab: SimulatorEditorView;
  viewId: string;
  disabled: boolean;
  onChange: (tab: SimulatorEditorView) => void;
}>) {
  return (
    <div className="nav nav-tabs mb-3" role="tablist" aria-label="Simulator content views">
      {tabs.map((item) => (
        <button
          type="button"
          key={item}
          role="tab"
          id={`${viewId}-${item}-tab`}
          aria-controls={`${viewId}-${item}-panel`}
          aria-selected={tab === item}
          tabIndex={tab === item ? 0 : -1}
          className={`nav-link${tab === item ? " active" : ""}`}
          disabled={disabled && item !== "json"}
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) || disabled) return;
            event.preventDefault();
            const index = tabs.indexOf(tab);
            let nextIndex =
              (index + (event.key === "ArrowLeft" ? -1 : 1) + tabs.length) % tabs.length;
            if (event.key === "Home") nextIndex = 0;
            else if (event.key === "End") nextIndex = tabs.length - 1;
            const next = tabs[nextIndex]!;
            onChange(next);
            globalThis.document.getElementById(`${viewId}-${next}-tab`)?.focus();
          }}
          onClick={() => {
            onChange(item);
          }}
        >
          {TAB_LABELS[item]}
        </button>
      ))}
    </div>
  );
}
