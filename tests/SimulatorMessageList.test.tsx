import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { SimulatorMessageList } from "../src/SimulatorMessageList";

it("edits and removes messages through collapsible list rows", () => {
  function Editor() {
    const [value, setValue] = useState<unknown[]>([
      { text: "First message", from: "them", delay_seconds: 0 },
      { text: "Second message", from: "me", delay_seconds: 2 },
    ]);
    return (
      <SimulatorMessageList contactNumbers={["111", "222"]} value={value} onChange={setValue} />
    );
  }
  render(<Editor />);
  const list = screen.getByRole("region", { name: "Message list" });
  expect(within(list).queryByRole("textbox", { name: "Text" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "First message" }));
  expect(
    screen.queryByRole("combobox", { name: "Delay seconds value type" }),
  ).not.toBeInTheDocument();
  expect(within(list).getByRole("combobox", { name: "Sender" })).toHaveValue("111");
  fireEvent.change(within(list).getByRole("combobox", { name: "Sender" }), {
    target: { value: "222" },
  });
  expect(screen.queryByLabelText("Text value type")).not.toBeInTheDocument();
  expect(within(list).getByRole("combobox", { name: "Sender" })).toHaveValue("222");
  expect(within(list).getByRole("combobox", { name: "Sender" })).not.toHaveAttribute("multiple");
  expect(screen.queryByRole("option", { name: "Other person" })).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Delay seconds")).not.toBeInTheDocument();
  for (const time of screen.getAllByLabelText("Time")) expect(time).toHaveAttribute("type", "time");
  fireEvent.change(within(list).getByRole("textbox", { name: "Text" }), {
    target: { value: "Changed message" },
  });
  expect(within(list).getByRole("combobox", { name: "Sender" })).toHaveValue("222");
  expect(screen.queryByRole("button", { name: /Move message/ })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Changed message" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  expect(screen.getByRole("group", { name: "Message 1 actions" })).toContainElement(
    screen.getByRole("button", { name: "Remove message 1" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Remove message 1" }));
  expect(screen.queryByRole("button", { name: "Changed message" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Add message" }));
  expect(within(list).getByRole("textbox", { name: "Text" })).toHaveValue("");
});
