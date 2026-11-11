import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { SimulatorEmailFolderSelect } from "../src/SimulatorEmailFolderSelect";
import { simulatorEmailFolders } from "../src/simulatorEmailFolders";

it("supports keyboard folder selection, cancelling typed changes and ignoring blank input", () => {
  function Picker() {
    const [value, setValue] = useState("inbox");
    return (
      <SimulatorEmailFolderSelect
        value={value}
        options={simulatorEmailFolders}
        onChange={setValue}
      />
    );
  }
  render(<Picker />);
  const input = screen.getByRole("combobox", { name: "Folder" });
  fireEvent.focus(input);
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "ArrowUp" });
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(input).toHaveValue("Draft");
  fireEvent.change(input, { target: { value: "Temporary" } });
  fireEvent.keyDown(input, { key: "Escape" });
  expect(input).toHaveValue("Draft");
  fireEvent.change(input, { target: { value: "   " } });
  fireEvent.blur(input);
  expect(input).toHaveValue("Draft");
  fireEvent.change(input, { target: { value: "Personal" } });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(input).toHaveValue("Personal");
});
