import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { SimulatorContactNumbers } from "../src/SimulatorContactNumbers";

it("adds unique arbitrary tags with the keyboard or blur and removes individual numbers", () => {
  function Editor() {
    const [value, setValue] = useState(["111"]);
    return <SimulatorContactNumbers value={value} onChange={setValue} />;
  }
  render(<Editor />);
  const picker = screen.getByRole("combobox", { name: "Contact numbers" });
  fireEvent.change(picker, { target: { value: "222,111" } });
  fireEvent.keyDown(picker, { key: "Enter" });
  expect(screen.getAllByRole("button", { name: "Remove 111" })).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Remove 222" })).toBeInTheDocument();
  fireEvent.change(picker, { target: { value: "BANK sender" } });
  fireEvent.blur(picker);
  expect(screen.getByRole("button", { name: "Remove BANK sender" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Remove 111" }));
  expect(screen.queryByRole("button", { name: "Remove 111" })).not.toBeInTheDocument();
});

it("searches contacts and previous conversations in one multi-select, deduplicating suggestions", () => {
  function Editor() {
    const [value, setValue] = useState(["111"]);
    return (
      <SimulatorContactNumbers
        value={value}
        onChange={setValue}
        contacts={[
          {
            id: "bank",
            display_name: "Bank",
            number: "222",
            phone_numbers: [
              { label: "Mobile", value: "333" },
              { label: "Office", value: "Display number", number: "444" },
            ],
          },
        ]}
        conversations={[
          {
            contact_name: "Previous sender",
            contact_number: "555",
            contact_numbers: ["555", "666", "333"],
            last_at: "",
            messages: [],
          },
        ]}
      />
    );
  }
  render(<Editor />);
  const picker = screen.getByRole("combobox", { name: "Contact numbers" });
  fireEvent.focus(picker);
  expect(
    screen.getAllByRole("option").filter((option) => option.textContent?.includes("333")),
  ).toHaveLength(1);
  fireEvent.change(picker, { target: { value: "mobile" } });
  fireEvent.change(screen.getByRole("listbox", { name: "Contact number suggestions" }), {
    target: { value: "333" },
  });
  expect(screen.getByRole("button", { name: "Remove 333" })).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: "Bank — 333 (Mobile)" })).not.toBeInTheDocument();
  fireEvent.change(picker, { target: { value: "Previous" } });
  fireEvent.change(screen.getByRole("listbox", { name: "Contact number suggestions" }), {
    target: { value: "666" },
  });
  expect(screen.getByRole("button", { name: "Remove 666" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Remove 111" })).toBeInTheDocument();
  fireEvent.change(picker, { target: { value: "444" } });
  fireEvent.keyDown(picker, { key: "ArrowDown" });
  fireEvent.keyDown(picker, { key: "ArrowUp" });
  fireEvent.keyDown(picker, { key: "Enter" });
  expect(screen.getByRole("button", { name: "Remove 444" })).toBeInTheDocument();
  fireEvent.change(picker, { target: { value: "custom sender" } });
  fireEvent.change(screen.getByRole("listbox", { name: "Contact number suggestions" }), {
    target: { value: "custom sender" },
  });
  expect(screen.getByRole("button", { name: "Remove custom sender" })).toBeInTheDocument();
  fireEvent.keyDown(picker, { key: "Escape" });
  expect(picker).toHaveAttribute("aria-expanded", "false");
});
