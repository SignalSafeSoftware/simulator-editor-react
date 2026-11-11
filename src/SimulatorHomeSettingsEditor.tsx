import { SimulatorHomeLockEditor } from "./SimulatorHomeLockEditor.js";
import { SimulatorSingleSelect } from "./SimulatorSingleSelect.js";
import {
  regionalCountryOptions,
  regionalCurrencyOptions,
  regionalTimeZoneOptions,
  includeRegionalSelection,
} from "./simulatorRegionalOptions.js";
import {
  appearancePresets,
  defaultAppearance,
} from "@signalsafe/simulator-theme-bootstrap/appearance";
import {
  regionalLanguages,
  RegionalDateFormat,
  RegionalTimeFormat,
} from "@signalsafe/simulator-react/apps/settings/regionalFormats";
import { SimulatorEditorPanel } from "./SimulatorEditorPanel.js";
import { homeSettingsSchema, type HomeContent } from "./simulatorHomeContent.js";
export function SimulatorHomeSettingsEditor({
  value,
  onChange,
}: Readonly<{
  value: HomeContent["settings"];
  onChange: (value: HomeContent["settings"]) => void;
}>) {
  const appearance = value.appearance ?? defaultAppearance;
  const regional = value.regional ?? {
    country: "US",
    language: "en",
    currency: "USD",
    dateFormat: RegionalDateFormat.Locale,
    timeFormat: RegionalTimeFormat.TwelveHour,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  function updateRegional(key: string, next: string) {
    const parsed = homeSettingsSchema.safeParse({
      ...value,
      regional: { ...regional, [key]: next },
    });
    if (parsed.success) onChange(parsed.data);
    return parsed.success;
  }
  return (
    <SimulatorEditorPanel title="Settings">
      <div className="graph-editor-card__body">
        <label className="form-label d-block mb-3">
          Appearance preset
          <select
            className="form-select"
            value={
              appearancePresets.find(
                (p) => p.background === appearance.background && p.accent === appearance.accent,
              )?.id ?? "custom"
            }
            onChange={(e) => {
              const p = appearancePresets.find((p) => p.id === e.target.value);
              if (p)
                onChange({ ...value, appearance: { background: p.background, accent: p.accent } });
            }}
          >
            <option value="custom" disabled>
              Custom
            </option>
            {appearancePresets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id}
              </option>
            ))}
          </select>
        </label>
        <div className="row g-3">
          {(["background", "accent"] as const).map((key) => (
            <label key={key} className="form-label d-flex flex-column align-items-start mb-3 col-6">
              {key === "background" ? "Background color" : "Accent color"}
              <input
                type="color"
                className="form-control form-control-color mt-auto"
                value={appearance[key]}
                onChange={(e) =>
                  onChange({ ...value, appearance: { ...appearance, [key]: e.target.value } })
                }
              />
            </label>
          ))}
        </div>
        <div className="row g-3">
          <div className="col-12 col-sm-6">
            <SimulatorSingleSelect
              optionsLabel="Country codes"
              options={includeRegionalSelection(regionalCountryOptions, regional.country)}
              label="Country code"
              value={regional.country}
              onChange={(v) => updateRegional("country", v.toUpperCase())}
            />
          </div>
          <div className="col-12 col-sm-6">
            <SimulatorSingleSelect
              optionsLabel="Currency codes"
              options={includeRegionalSelection(regionalCurrencyOptions, regional.currency)}
              label="Currency code"
              value={regional.currency}
              onChange={(v) => updateRegional("currency", v.toUpperCase())}
            />
          </div>
        </div>
        <label className="form-label d-block mb-3">
          Language
          <select
            className="form-select"
            value={regional.language}
            onChange={(e) => updateRegional("language", e.target.value)}
          >
            {Object.entries(regionalLanguages).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <div className="row g-3">
          <label className="form-label d-flex flex-column mb-3 col-12 col-sm-6">
            Date format
            <select
              className="form-select mt-auto"
              value={regional.dateFormat}
              onChange={(e) => updateRegional("dateFormat", e.target.value)}
            >
              {Object.values(RegionalDateFormat).map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
          <label className="form-label d-flex flex-column mb-3 col-12 col-sm-6">
            Time format
            <select
              className="form-select mt-auto"
              value={regional.timeFormat}
              onChange={(e) => updateRegional("timeFormat", e.target.value)}
            >
              <option value="12">12 hour</option>
              <option value="24">24 hour</option>
            </select>
          </label>
        </div>
        <SimulatorSingleSelect
          optionsLabel="Time zones"
          options={includeRegionalSelection(regionalTimeZoneOptions, regional.timeZone)}
          label="Time zone"
          value={regional.timeZone}
          onChange={(v) => updateRegional("timeZone", v)}
        />
        <SimulatorHomeLockEditor
          value={value.lock}
          onChange={(lock) => onChange({ ...value, lock })}
        />
      </div>
    </SimulatorEditorPanel>
  );
}
