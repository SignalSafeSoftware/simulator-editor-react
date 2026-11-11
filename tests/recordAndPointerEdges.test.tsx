import { SimulatorCollectionContext } from "../src/SimulatorCollectionOutlet";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SimulatorRecordList } from "../src/SimulatorRecordList";
import { SimulatorSingleSelect } from "../src/SimulatorSingleSelect";
afterEach(cleanup);
it("edits generic records while preserving identity and supports unlabelled index records", () => {
  const changed = vi.fn();
  render(
    <SimulatorRecordList
      title="Examples"
      value={[{ id: "one", name: "First" }]}
      selectedId="one"
      onChange={changed}
      create={() => ({ name: "" })}
      label={() => ""}
      fields={{ name: "", enabled: false }}
    />,
  );
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Updated" } });
  expect(changed).toHaveBeenLastCalledWith([{ id: "one", name: "Updated", enabled: false }]);
  fireEvent.click(screen.getByRole("button", { name: "Examples 1" }));
  fireEvent.click(screen.getByRole("button", { name: "Examples 1" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove examples item 1" }));
  expect(changed).toHaveBeenLastCalledWith([]);
  cleanup();
  render(
    <SimulatorRecordList
      title="Examples"
      value={[{ name: "Index" }]}
      identified={false}
      onChange={changed}
      create={() => ({ name: "New" })}
      label={(item) => String(item.name)}
      fields={{ name: "" }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Index" }));
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Updated index" } });
  expect(changed).toHaveBeenLastCalledWith([{ name: "Updated index" }]);
  fireEvent.click(screen.getByRole("button", { name: "Add examples item" }));
  expect(changed).toHaveBeenLastCalledWith([{ name: "Index" }, { name: "New" }]);
});
it("opens and commits searchable choices using pointer input, including empty search results", () => {
  const changed = vi.fn();
  render(
    <SimulatorSingleSelect
      label="Item"
      optionsLabel="Items"
      value="one"
      options={[
        { value: "one", label: "One" },
        { value: "two", label: "Two" },
      ]}
      onChange={changed}
    />,
  );
  const input = screen.getByRole("combobox");
  fireEvent.click(input);
  fireEvent.click(screen.getByRole("listbox", { name: "Items" }), { target: { value: "two" } });
  expect(changed).toHaveBeenCalledWith("two");
  fireEvent.change(input, { target: { value: "missing" } });
  fireEvent.click(input);
  fireEvent.click(screen.getByRole("listbox", { name: "Items" }));
  expect(screen.getByText("No matches")).toBeTruthy();
  fireEvent.keyDown(input, { key: "Escape" });
});
it("closes a custom record inspector and adds stable identified records", () => {
  const changed = vi.fn();
  render(
    <SimulatorRecordList
      title="Examples"
      value={[{ id: "one", name: "Example" }]}
      selectedId="one"
      onChange={changed}
      create={() => ({ name: "New" })}
      label={(item) => String(item.name)}
      fields={{}}
      renderEditor={(_item, _update, close) => <button onClick={close}>Close inspector</button>}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Close inspector" }));
  expect(screen.queryByRole("button", { name: "Close inspector" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Add examples item" }));
  expect(changed).toHaveBeenCalledWith([
    { id: "one", name: "Example" },
    { id: expect.any(String), name: "New" },
  ]);
});
it("renders generic collection titles in a host layout and supports stable created IDs", () => {
  const target = render(<div data-testid="collection-target" />).getByTestId("collection-target");
  const changed = vi.fn();
  render(
    <SimulatorCollectionContext.Provider value={{ target, selectGroup: () => {} }}>
      <SimulatorRecordList
        title="Examples"
        value={[{ id: "one", name: "Example" }]}
        selectedId="one"
        onChange={changed}
        create={() => ({ name: "New" })}
        label={(item) => String(item.name)}
        fields={{ name: "" }}
      />
    </SimulatorCollectionContext.Provider>,
  );
  expect(screen.getByLabelText("Name")).toHaveValue("Example");
});
it("updates one generic row without replacing its siblings and creates records in portal layouts", () => {
  const target = render(<div data-testid="target" />).getByTestId("target"),
    changed = vi.fn(),
    group = vi.fn();
  render(
    <SimulatorCollectionContext.Provider value={{ target, selectGroup: group }}>
      <SimulatorRecordList
        title="Emails"
        value={[
          { id: "one", name: "First" },
          { id: "two", name: "Second" },
        ]}
        selectedId="one"
        onChange={changed}
        create={() => ({ name: "New" })}
        label={(item) => String(item.name)}
        fields={{ name: "" }}
      />
    </SimulatorCollectionContext.Provider>,
  );
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Updated" } });
  expect(changed).toHaveBeenCalledWith([
    { id: "one", name: "Updated" },
    { id: "two", name: "Second" },
  ]);
  fireEvent.click(screen.getByRole("button", { name: "Add emails item" }));
  expect(group).toHaveBeenCalled();
});
