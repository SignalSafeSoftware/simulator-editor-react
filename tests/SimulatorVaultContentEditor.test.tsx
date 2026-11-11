import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { SimulatorVaultContentEditor } from "../src/SimulatorVaultContentEditor";
import { readHomeContent } from "../src/simulatorHomeContent";
function setup() {
  let saved = readHomeContent({}).vault;
  function Editor() {
    const [value, setValue] = useState(saved);
    saved = value;
    return <SimulatorVaultContentEditor value={value} onChange={setValue} />;
  }
  render(<Editor />);
  return () => saved;
}
it("groups entries by folder, follows folder moves, renames folders and preserves entries on folder removal", () => {
  const data = setup();
  expect(screen.getByRole("tree", { name: "Vault" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Remove Unfiled" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Add vault folder" }));
  fireEvent.change(screen.getByLabelText("Folder name"), { target: { value: "Finance" } });
  fireEvent.blur(screen.getByLabelText("Folder name"));
  expect(data().folders).toContain("Finance");
  fireEvent.click(screen.getByRole("button", { name: "Add item to Finance" }));
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Bank note" } });
  expect(data().items[0]?.folder).toBe("Finance");
  fireEvent.change(screen.getByLabelText("Vault folder"), { target: { value: "Archive" } });
  fireEvent.blur(screen.getByLabelText("Vault folder"));
  expect(data().folders).toContain("Archive");
  expect(screen.getByRole("treeitem", { name: "Bank note" }).getAttribute("aria-selected")).toBe(
    "true",
  );
  fireEvent.click(screen.getByRole("treeitem", { name: "Archive" }));
  fireEvent.change(screen.getByLabelText("Folder name"), { target: { value: "Records" } });
  fireEvent.blur(screen.getByLabelText("Folder name"));
  expect(data().items[0]?.folder).toBe("Records");
  fireEvent.click(screen.getByRole("button", { name: "Remove Records" }));
  expect(data().items[0]?.folder).toBe("Unfiled");
  expect(data().folders).not.toContain("Records");
  fireEvent.click(screen.getByRole("button", { name: "Remove Bank note" }));
  expect(data().items).toEqual([]);
});
it("adds empty folders with unique names and rejects empty or duplicate names", () => {
  const data = setup();
  fireEvent.click(screen.getByRole("button", { name: "Add vault folder" }));
  fireEvent.click(screen.getByRole("button", { name: "Add vault folder" }));
  expect(data().folders).toContain("New folder 2");
  fireEvent.change(screen.getByLabelText("Folder name"), { target: { value: "Unfiled" } });
  fireEvent.blur(screen.getByLabelText("Folder name"));
  expect(screen.getByRole("alert").textContent).toContain("already exists");
  fireEvent.change(screen.getByLabelText("Folder name"), { target: { value: " " } });
  fireEvent.blur(screen.getByLabelText("Folder name"));
  expect(screen.getByRole("alert").textContent).toContain("between 1 and 200");
  fireEvent.click(screen.getByRole("button", { name: "Remove New folder 2" }));
  expect(data().folders).not.toContain("New folder 2");
});

it("renames Unfiled without recreating it and preserves entries when deleting it", () => {
  const data = setup();
  fireEvent.click(screen.getByRole("button", { name: "Add item to Unfiled" }));
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Saved note" } });
  fireEvent.click(screen.getByRole("treeitem", { name: "Unfiled" }));
  fireEvent.change(screen.getByLabelText("Folder name"), { target: { value: "Personal" } });
  fireEvent.blur(screen.getByLabelText("Folder name"));
  expect(data().folders).toEqual(["Personal"]);
  expect(data().items[0]?.folder).toBe("Personal");
  expect(screen.queryByRole("treeitem", { name: "Unfiled" })).toBeNull();
  fireEvent.change(screen.getByLabelText("Folder name"), { target: { value: "Unfiled" } });
  fireEvent.blur(screen.getByLabelText("Folder name"));
  fireEvent.click(screen.getByRole("button", { name: "Remove Unfiled" }));
  expect(data().folders).toEqual(["Recovered secrets"]);
  expect(data().items[0]?.folder).toBe("Recovered secrets");
  expect(data().items[0]?.title).toBe("Saved note");
  expect(screen.queryByRole("treeitem", { name: "Unfiled" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Remove Recovered secrets" }));
  expect(data().folders).toEqual(["Unfiled"]);
  expect(data().items[0]?.folder).toBe("Unfiled");
});
it("allows removal of an empty Unfiled folder", () => {
  const data = setup();
  fireEvent.click(screen.getByRole("button", { name: "Remove Unfiled" }));
  expect(data().folders).toEqual([]);
  expect(data().items).toEqual([]);
  expect(screen.queryByRole("treeitem", { name: "Unfiled" })).toBeNull();
});
