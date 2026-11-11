import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { SimulatorHomeSettingsEditor } from "../src/SimulatorHomeSettingsEditor";
import { SimulatorVaultContentEditor } from "../src/SimulatorVaultContentEditor";
import { readHomeContent, type HomeContent } from "../src/simulatorHomeContent";
import {
  regionalCountryOptions,
  regionalCurrencyOptions,
  regionalTimeZoneOptions,
  includeRegionalSelection,
} from "../src/simulatorRegionalOptions";
it("includes complete ISO lists and supported IANA identifiers and aliases", () => {
  expect(regionalCountryOptions).toHaveLength(249);
  for (const code of ["AD", "AQ", "AX", "BQ", "SZ", "US"])
    expect(regionalCountryOptions.some((o) => o.value === code)).toBe(true);
  expect(regionalCurrencyOptions.length).toBeGreaterThanOrEqual(178);
  for (const code of ["USD", "XAU", "XAG", "USN", "XTS", "XCG", "ZWG"])
    expect(regionalCurrencyOptions.some((o) => o.value === code)).toBe(true);
  expect(regionalTimeZoneOptions.length).toBeGreaterThan(500);
  for (const zone of ["UTC", "America/Denver", "US/Mountain", "Asia/Kathmandu", "Pacific/Chatham"])
    expect(regionalTimeZoneOptions.some((o) => o.value === zone)).toBe(true);
  for (const options of [regionalCountryOptions, regionalCurrencyOptions, regionalTimeZoneOptions])
    expect(new Set(options.map((o) => o.value)).size).toBe(options.length);
  expect(includeRegionalSelection(regionalCurrencyOptions, "ZZZ")[0]).toEqual({
    value: "ZZZ",
    label: "ZZZ",
  });
});
it("searches regional names/codes and keeps exactly one saved value per field", () => {
  let saved: HomeContent["settings"] = {};
  function Editor() {
    const [value, setValue] = useState(saved);
    saved = value;
    return <SimulatorHomeSettingsEditor value={value} onChange={setValue} />;
  }
  render(<Editor />);
  const zone = screen.getByRole("combobox", { name: "Time zone" });
  fireEvent.focus(zone);
  const list = screen.getByRole("listbox", { name: "Time zones" });
  expect(list).toHaveProperty("multiple", false);
  fireEvent.change(zone, { target: { value: "Kathmandu" } });
  fireEvent.keyDown(zone, { key: "Enter" });
  expect(saved.regional?.timeZone).toBe("Asia/Kathmandu");
  fireEvent.focus(zone);
  expect(
    within(screen.getByRole("listbox", { name: "Time zones" })).getAllByRole("option", {
      selected: true,
    }),
  ).toHaveLength(1);
  fireEvent.keyDown(zone, { key: "Escape" });
  const country = screen.getByRole("combobox", { name: "Country code" });
  fireEvent.change(country, { target: { value: "AQ" } });
  fireEvent.keyDown(country, { key: "Enter" });
  expect(saved.regional?.country).toBe("AQ");
  const currency = screen.getByRole("combobox", { name: "Currency code" });
  fireEvent.change(currency, { target: { value: "XAU" } });
  fireEvent.keyDown(currency, { key: "Enter" });
  expect(saved.regional?.currency).toBe("XAU");
  fireEvent.change(zone, { target: { value: "Unknown/Nowhere" } });
  expect(screen.queryByRole("option", { name: /Add/ })).toBeNull();
  fireEvent.blur(zone);
  expect(saved.regional?.timeZone).toBe("Asia/Kathmandu");
  expect(zone).toHaveValue("Asia/Kathmandu");
});
it("selects or creates a single Vault folder without applying email system-folder aliases", () => {
  let saved = readHomeContent({}).vault;
  function Editor() {
    const [value, setValue] = useState(saved);
    saved = value;
    return <SimulatorVaultContentEditor value={value} onChange={setValue} />;
  }
  render(<Editor />);
  fireEvent.click(screen.getByRole("button", { name: "Add item to Unfiled" }));
  const input = screen.getByRole("combobox", { name: "Vault folder" });
  fireEvent.change(input, { target: { value: " draft " } });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(saved.items[0]?.folder).toBe("draft");
  expect(saved.folders).toContain("draft");
  expect(saved.folders).not.toContain("drafts");
  expect(screen.getByRole("treeitem", { name: "New note" }).getAttribute("aria-selected")).toBe(
    "true",
  );
  fireEvent.focus(input);
  const options = screen.getByRole("listbox", { name: "Vault folders" });
  expect(options).toHaveProperty("multiple", false);
  fireEvent.change(options, { target: { value: "Unfiled" } });
  expect(saved.items[0]?.folder).toBe("Unfiled");
  fireEvent.change(input, { target: { value: "Personal" } });
  fireEvent.blur(input);
  expect(saved.items[0]?.folder).toBe("Personal");
});
