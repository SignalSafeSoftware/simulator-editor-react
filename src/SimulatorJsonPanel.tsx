import type { ReactNode } from "react";
import type { SimulatorJsonEditorContext } from "./editorTypes.js";
export function SimulatorJsonPanel({
  label,
  value,
  onChange,
  disabled,
  error,
  errorId,
  renderEditor,
}: Readonly<{
  label: string;
  value: string;
  onChange: (text: string) => void;
  disabled: boolean;
  error: string;
  errorId: string;
  renderEditor?: (context: SimulatorJsonEditorContext) => ReactNode;
}>) {
  return (
    <fieldset disabled={disabled}>
      <div className="form-label">{label} JSON</div>
      {renderEditor ? (
        renderEditor({
          value,
          onChange,
          disabled,
          ariaLabel: "Simulator content JSON",
          describedBy: error ? errorId : undefined,
          invalid: Boolean(error),
        })
      ) : (
        <textarea
          aria-label="Simulator content JSON"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="form-control font-monospace"
          rows={24}
          maxLength={4000000}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {error && (
        <span id={errorId} role="alert">
          {error}
        </span>
      )}
    </fieldset>
  );
}
