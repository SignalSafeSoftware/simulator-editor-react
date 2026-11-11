import { useEffect, useState } from "react";
import { SimulatorCollectionOutlet } from "./SimulatorCollectionOutlet.js";
import { SimulatorEditorPanel } from "./SimulatorEditorPanel.js";
import { SimulatorHomeSettingsEditor } from "./SimulatorHomeSettingsEditor.js";
import { SimulatorVaultContentEditor } from "./SimulatorVaultContentEditor.js";
import { SimulatorPhotosContentEditor } from "./SimulatorPhotosContentEditor.js";
import { readHomeContent, homePageIds, type HomePageId } from "./simulatorHomeContent.js";
export function SimulatorHomeContentEditor({
  value,
  onChange,
  selectedPage,
  onPageSelect,
}: Readonly<{
  value: unknown;
  onChange: (next: unknown) => void;
  selectedPage?: HomePageId;
  onPageSelect?: (page: HomePageId) => void;
}>) {
  const [page, setPage] = useState<HomePageId>(selectedPage ?? "settings");
  useEffect(() => {
    if (selectedPage) setPage(selectedPage);
  }, [selectedPage]);
  let data;
  try {
    data = readHomeContent(value);
  } catch {
    return (
      <p role="alert">
        Repair invalid Home content in the JSON editor before editing Settings, Vault or Photos.
      </p>
    );
  }
  return (
    <div className="graph-editor-root">
      <SimulatorCollectionOutlet>
        <SimulatorEditorPanel title="Home content">
          <nav className="list-group list-group-flush" aria-label="Home content editors">
            {homePageIds.map((id) => (
              <button
                type="button"
                key={id}
                className={`list-group-item list-group-item-action${page === id ? " active" : ""}`}
                aria-current={page === id ? "true" : undefined}
                onClick={() => {
                  setPage(id);
                  onPageSelect?.(id);
                }}
              >
                {id[0]?.toUpperCase()}
                {id.slice(1)}
              </button>
            ))}
          </nav>
        </SimulatorEditorPanel>
      </SimulatorCollectionOutlet>
      {page === "settings" ? (
        <SimulatorHomeSettingsEditor
          value={data.settings}
          onChange={(settings) => onChange({ ...data, settings })}
        />
      ) : page === "vault" ? (
        <SimulatorVaultContentEditor
          value={data.vault}
          onChange={(vault) => onChange({ ...data, vault })}
        />
      ) : (
        <SimulatorPhotosContentEditor
          value={data.photos}
          onChange={(photos) => onChange({ ...data, photos })}
        />
      )}
    </div>
  );
}
