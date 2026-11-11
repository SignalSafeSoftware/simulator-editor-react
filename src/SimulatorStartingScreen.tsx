import { SimulatorSingleSelect } from "./SimulatorSingleSelect.js";
import { startingScreenCollection } from "./startingScreenCollection.js";
import type { ReactNode } from "react";
import type { SimulatorEditorSectionValue } from "./editorTypes.js";
import { startingPositionOptions } from "./startingPositionOptions.js";
import { SimulatorApp } from "@signalsafe/simulator-core/simulatorApp";
import {
  SimulatorEmailScreenId,
  SimulatorHomeScreenId,
  SimulatorInternetScreenId,
  SimulatorMessagesScreenId,
  SimulatorPhoneScreenId,
} from "@signalsafe/simulator-core/devicePayload";
import { contentLabel, contentObject } from "./SimulatorContentFields.js";

const SCREENS: Readonly<Record<string, readonly string[]>> = {
  [SimulatorApp.Email]: Object.values(SimulatorEmailScreenId).filter(
    (screen) => screen !== SimulatorEmailScreenId.Detail,
  ),
  [SimulatorApp.Messages]: Object.values(SimulatorMessagesScreenId).filter(
    (screen) => screen !== SimulatorMessagesScreenId.ThreadDetail,
  ),
  [SimulatorApp.Phone]: Object.values(SimulatorPhoneScreenId).filter(
    (screen) =>
      screen !== SimulatorPhoneScreenId.Directory &&
      screen !== SimulatorPhoneScreenId.IncomingCall &&
      screen !== SimulatorPhoneScreenId.Voicemail,
  ),
  [SimulatorApp.Internet]: [SimulatorInternetScreenId.Pages],
  [SimulatorApp.Home]: Object.values(SimulatorHomeScreenId),
};
export function SimulatorStartingScreen({
  value,
  startingPageAction,
  sections = [],
  internet,
  onChange,
}: Readonly<{
  value: unknown;
  startingPageAction?: ReactNode;
  sections?: readonly SimulatorEditorSectionValue[];
  internet: unknown;
  onChange: (value: unknown) => void;
}>) {
  const entry = contentObject(value) ? value : {};
  const app = typeof entry.app === "string" ? entry.app : SimulatorApp.Home;
  const screen = startingScreenCollection(
    app,
    typeof entry.screen === "string" ? entry.screen : "",
  );
  const pageIds =
    contentObject(internet) && Array.isArray(internet.pages)
      ? internet.pages.flatMap((page: unknown) =>
          contentObject(page) && typeof page.id === "string" ? [page.id] : [],
        )
      : [];
  const options = startingPositionOptions(sections, app, screen);
  const target = entry.target === undefined ? "" : JSON.stringify(entry.target);
  const { target: _target, ...screenOnly } = entry;
  const apps: readonly string[] = Object.values(SimulatorApp);
  const screens = [
    ...new Set([
      ...(SCREENS[app] ?? []),
      ...(app === SimulatorApp.Internet ? pageIds : []),
      ...(screen ? [screen] : []),
    ]),
  ];
  return (
    <>
      <label className="form-label d-block mb-3">
        Starting app
        <select
          className="form-select"
          aria-label="Starting app"
          value={app}
          onChange={(event) =>
            onChange({
              ...screenOnly,
              app: event.target.value,
              screen: SCREENS[event.target.value]?.[0] ?? "",
            })
          }
        >
          {!apps.includes(app) && <option value={app}>{app}</option>}
          {apps.map((item) => (
            <option key={item} value={item}>
              {contentLabel(item)}
            </option>
          ))}
        </select>
      </label>
      <label className="form-label d-block mb-3">
        Starting screen
        <select
          className="form-select"
          aria-label="Starting screen"
          value={screen}
          onChange={(event) => onChange({ ...screenOnly, screen: event.target.value })}
        >
          {!screen && <option value="">Choose a screen</option>}
          {screens.map((item) => (
            <option key={item} value={item}>
              {contentLabel(item)}
            </option>
          ))}
        </select>
      </label>
      {(options.length > 0 || target) && (
        <SimulatorSingleSelect
          label="Starting item"
          optionsLabel="Starting items"
          value={target}
          options={[
            { value: "", label: "No selected item" },
            ...(target && !options.some((item) => JSON.stringify(item.target) === target)
              ? [{ value: target, label: "Unavailable starting item" }]
              : []),
            ...options.map((item) => ({ value: JSON.stringify(item.target), label: item.label })),
          ]}
          onChange={(next) => {
            const chosen = options.find((item) => JSON.stringify(item.target) === next);
            const selectedScreen =
              chosen?.target.kind === "conversation"
                ? SimulatorMessagesScreenId.ThreadDetail
                : chosen?.target.kind === "email"
                  ? SimulatorEmailScreenId.Detail
                  : screen;
            onChange(
              chosen
                ? { ...entry, screen: selectedScreen, target: chosen.target }
                : { ...screenOnly, screen },
            );
          }}
        />
      )}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {startingPageAction}
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() =>
            onChange({ ...screenOnly, app: SimulatorApp.Home, screen: SimulatorHomeScreenId.Home })
          }
        >
          Reset to Home
        </button>
      </div>
      <p className="text-muted">
        Navigate to a screen in the preview and choose “Starting Page”, or select a screen and item
        here.
      </p>
    </>
  );
}
