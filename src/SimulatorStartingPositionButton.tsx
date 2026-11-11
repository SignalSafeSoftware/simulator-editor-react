import type { SimulatorEntryPoint } from "@signalsafe/simulator-core/devicePayload";
import type { SimulatorEditorProps } from "./editorTypes.js";
import { startingPositionOptions } from "./startingPositionOptions.js";
export function SimulatorStartingPositionButton({
  sections,
  position,
  disabled,
  onChange,
}: Readonly<{
  sections: SimulatorEditorProps["sections"];
  position?: SimulatorEntryPoint;
  disabled: boolean;
  onChange: SimulatorEditorProps["onChange"];
}>) {
  const available =
    position &&
    (!position.target ||
      startingPositionOptions(sections, position.app, position.screen).some(
        (option) => JSON.stringify(option.target) === JSON.stringify(position.target),
      ));
  return (
    <button
      type="button"
      className="btn btn-outline-primary"
      disabled={disabled || !available}
      onClick={() => {
        if (position) onChange("entry_point", position);
      }}
    >
      Starting Page
    </button>
  );
}
