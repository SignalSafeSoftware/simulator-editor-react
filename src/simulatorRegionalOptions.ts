import { countryCodes, currencyCodes, timeZoneIds } from "./regionalOptionCodes.js";
import type { SimulatorSelectOption } from "./SimulatorSingleSelect.js";
const regions = new Intl.DisplayNames(["en"], { type: "region" });
const currencies = new Intl.DisplayNames(["en"], { type: "currency" });
const unique = (values: readonly string[]) => [...new Set(values)].sort();
export const regionalCountryOptions: readonly SimulatorSelectOption[] = countryCodes.map(
  (value) => ({ value, label: `${value} — ${regions.of(value) ?? value}` }),
);
export const regionalCurrencyOptions: readonly SimulatorSelectOption[] = unique([
  ...currencyCodes,
  ...Intl.supportedValuesOf("currency"),
]).map((value) => ({ value, label: `${value} — ${currencies.of(value) ?? value}` }));
export const regionalTimeZoneOptions: readonly SimulatorSelectOption[] = unique([
  "UTC",
  ...timeZoneIds,
  ...Intl.supportedValuesOf("timeZone"),
])
  .filter((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  })
  .map((value) => ({ value, label: value }));
/** Retain authored historical codes/aliases even when a runtime's catalog is older. */
export function includeRegionalSelection(
  options: readonly SimulatorSelectOption[],
  value: string,
): readonly SimulatorSelectOption[] {
  return options.some((option) => option.value === value)
    ? options
    : [{ value, label: value }, ...options];
}
