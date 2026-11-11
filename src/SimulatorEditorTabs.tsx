import type { SimulatorEditorView } from "./editorTypes.js";
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
            const index = tabs.findIndex((item) => item === tab);
            const next =
              tabs[
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? tabs.length - 1
                    : (index + (event.key === "ArrowLeft" ? -1 : 1) + tabs.length) % tabs.length
              ]!;
            onChange(next);
            globalThis.document.getElementById(`${viewId}-${next}-tab`)?.focus();
          }}
          onClick={() => {
            onChange(item);
          }}
        >
          {item === "properties" ? "Properties" : item === "simulator" ? "Preview" : "JSON"}
        </button>
      ))}
    </div>
  );
}
