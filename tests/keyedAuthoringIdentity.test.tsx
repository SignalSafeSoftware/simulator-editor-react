import { startTransition, Suspense, useState } from "react";
import { act, fireEvent, render, renderHook, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { SimulatorContentFields } from "../src/SimulatorContentFields";
import { SimulatorMessageList } from "../src/SimulatorMessageList";
import { reconcileSimulatorKeys, useSimulatorKeyedValues } from "../src/useSimulatorKeyedValues";

it("retains authored and occurrence identities through reordering without changing legacy values", () => {
  let serial = 0;
  const key = () => String(serial++);
  const object = { title: "Legacy" };
  const values = [{ id: "one", text: "One" }, object, "repeat", "repeat", null, 3, { id: "" }];
  const initial = reconcileSimulatorKeys(values, [], key);
  const reordered = reconcileSimulatorKeys(
    ["repeat", { id: "one", text: "Changed" }, object, "repeat", null, 3, values[6]],
    initial,
    key,
  );
  expect(reordered.map((item) => item.key)).toEqual(["2", "0", "1", "3", "4", "5", "6"]);
  expect(new Set(reordered.map((item) => item.key)).size).toBe(7);
  expect(reconcileSimulatorKeys([{ id: "new" }], reordered, key)[0]?.key).toBe("7");
  expect(object).toEqual({ title: "Legacy" });
});
it("keeps tentative edits separate from a controlled parent rejecting or delaying them", () => {
  const original = [{ text: "Legacy" }];
  const { result, rerender } = renderHook(({ values }) => useSimulatorKeyedValues(values), {
    initialProps: { values: original },
  });
  const first = result.current.entries[0];
  if (!first) throw new Error("Initial identity missing");
  const updated = [{ text: "Changed" }];
  act(() => result.current.remember(updated, [{ key: first.key, value: updated[0] }]));
  rerender({ values: original });
  expect(result.current.entries[0]).toEqual(first);
  rerender({ values: updated });
  expect(result.current.entries[0]?.key).toBe(first.key);
  expect(result.current.entries[0]?.value).toEqual({ text: "Changed" });
});
it("preserves array input DOM and focus when editing and removing an earlier row", () => {
  function Fields() {
    const [values, change] = useState<unknown[]>(["First", "Second", "Second"]);
    return (
      <SimulatorContentFields
        label="Items"
        value={values}
        onChange={(next) => {
          if (Array.isArray(next)) change(next);
        }}
      />
    );
  }
  render(<Fields />);
  const second = screen.getByLabelText("Items 2");
  second.focus();
  fireEvent.change(second, { target: { value: "Edited" } });
  expect(screen.getByLabelText("Items 2")).toBe(second);
  expect(second).toHaveFocus();
  fireEvent.click(screen.getByRole("button", { name: "Remove item 1" }));
  expect(screen.getByLabelText("Items 1")).toBe(second);
  expect(second).toHaveFocus();
  expect(second).toHaveValue("Edited");
  expect(screen.getByLabelText("Items 2")).toHaveValue("Second");
});
it("keeps a legacy message editor focused through chronological reordering and row deletion", () => {
  function Messages() {
    const [values, change] = useState<unknown[]>([
      { text: "First", timestamp: "2026-11-22T10:00:00Z" },
      { text: "Second", timestamp: "2026-11-22T11:00:00Z" },
    ]);
    return <SimulatorMessageList value={values} onChange={change} />;
  }
  render(<Messages />);
  fireEvent.click(screen.getByRole("button", { name: "Second" }));
  const text = screen.getByRole("textbox", { name: "Text" });
  text.focus();
  fireEvent.change(text, { target: { value: "Edited" } });
  expect(screen.getByRole("textbox", { name: "Text" })).toBe(text);
  expect(text).toHaveFocus();
  const editor = text.closest(".pt-3");
  if (!(editor instanceof HTMLElement)) throw new Error("Message editor missing");
  fireEvent.change(within(editor).getByLabelText("Time"), { target: { value: "01:00" } });
  expect(screen.getByRole("textbox", { name: "Text" })).toBe(text);
  expect(text).toHaveFocus();
  fireEvent.click(screen.getByRole("button", { name: "Remove message 2" }));
  expect(screen.getByRole("textbox", { name: "Text" })).toBe(text);
  expect(text).toHaveValue("Edited");
});

it("does not commit identity allocation from a suspended transition", async () => {
  const original = [{ text: "Original" }];
  const pending = new Promise<never>(() => {});
  function ConcurrentFields() {
    const [document, change] = useState({ values: original, suspended: false });
    const { entries, remember } = useSimulatorKeyedValues(document.values);
    if (document.suspended) throw pending;
    return (
      <>
        <button
          onClick={() =>
            startTransition(() => change({ values: [{ text: "Discarded" }], suspended: true }))
          }
        >
          Suspend replacement
        </button>
        <button onClick={() => change({ values: original, suspended: false })}>
          Cancel replacement
        </button>
        <button
          onClick={() => {
            const values = [...original, { text: "Added" }];
            remember(values);
            change({ values, suspended: false });
          }}
        >
          Add committed row
        </button>
        <output aria-label="Committed identities">
          {JSON.stringify(entries.map((entry) => entry.key))}
        </output>
      </>
    );
  }
  render(
    <Suspense fallback={<p>Loading replacement</p>}>
      <ConcurrentFields />
    </Suspense>,
  );
  const committed = screen.getByLabelText("Committed identities").textContent;
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Suspend replacement" })),
  );
  expect(screen.queryByText("Loading replacement")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Committed identities").textContent).toBe(committed);
  fireEvent.click(screen.getByRole("button", { name: "Cancel replacement" }));
  expect(screen.getByLabelText("Committed identities").textContent).toBe(committed);
  fireEvent.click(screen.getByRole("button", { name: "Add committed row" }));
  const identities: unknown = JSON.parse(
    screen.getByLabelText("Committed identities").textContent ?? "null",
  );
  if (!Array.isArray(identities) || identities.length !== 2 || typeof identities[1] !== "string")
    throw new Error("Committed identities missing");
  expect(identities[1].split(":").at(-1)).toBe("1");
});
