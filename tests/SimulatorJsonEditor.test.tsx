import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { SimulatorEditor } from "../src/SimulatorEditor";
it("retains invalid text in a host JSON editor and only applies valid section values", () => {
  const changed = vi.fn(),
    valid = vi.fn();
  render(
    <SimulatorEditor
      sections={[
        { key: "messages", label: "Messages", value: [] },
        { key: "email", label: "Email", value: { messages: [] } },
      ]}
      onChange={changed}
      onJsonValidityChange={valid}
      renderPreview={() => null}
      renderJsonEditor={(context) => (
        <textarea
          aria-label="Code JSON"
          value={context.value}
          disabled={context.disabled}
          onChange={(event) => context.onChange(event.target.value)}
        />
      )}
    />,
  );
  fireEvent.click(screen.getByRole("tab", { name: "JSON" }));
  fireEvent.change(screen.getByLabelText("Code JSON"), { target: { value: "[" } });
  expect(screen.getByLabelText("Code JSON")).toHaveValue("[");
  expect(changed).not.toHaveBeenCalled();
  expect(valid).toHaveBeenLastCalledWith(false);
  expect(screen.getByRole("button", { name: "Email" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Code JSON"), { target: { value: '[{"id":"thread"}]' } });
  expect(changed).toHaveBeenLastCalledWith("messages", [{ id: "thread" }]);
  expect(valid).toHaveBeenLastCalledWith(true);
});
