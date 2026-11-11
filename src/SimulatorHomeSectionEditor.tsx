import type { PhotoEditorSelection } from "./useSimulatorPhotoSelection.js";
import type { VaultNavigation } from "@signalsafe/simulator-react/apps/vault/Vault";
import type { Secret } from "@signalsafe/simulator-core/apps/contracts";
import { SimulatorHomeSettingsEditor } from "./SimulatorHomeSettingsEditor.js";
import { SimulatorVaultContentEditor } from "./SimulatorVaultContentEditor.js";
import { SimulatorPhotosContentEditor } from "./SimulatorPhotosContentEditor.js";
import { homeContentSchema, type HomePageId } from "./simulatorHomeContent.js";
export function SimulatorHomeSectionEditor({
  photos,
  onVaultNavigate,
  vaultDraft,
  onVaultDraftChange,
  selectedVaultFolder,
  selectedVaultId,
  page,
  value,
  onChange,
}: Readonly<{
  photos?: PhotoEditorSelection;
  onVaultNavigate?: (target: Omit<VaultNavigation, "revision">) => void;
  vaultDraft?: Secret | null;
  onVaultDraftChange?: (draft: Secret | null) => void;
  selectedVaultFolder?: string | null;
  selectedVaultId?: string;
  page: HomePageId;
  value: unknown;
  onChange: (value: unknown) => void;
}>) {
  const parsed = homeContentSchema.safeParse({ [page]: value });
  if (!parsed.success)
    return <p role="alert">Repair invalid {page} content in the JSON editor before editing.</p>;
  return page === "settings" ? (
    <div className="graph-editor-root">
      <SimulatorHomeSettingsEditor value={parsed.data.settings} onChange={onChange} />
    </div>
  ) : page === "vault" ? (
    <SimulatorVaultContentEditor
      onNavigate={onVaultNavigate}
      previewDraft={vaultDraft}
      onPreviewDraftChange={onVaultDraftChange}
      selectedFolder={selectedVaultFolder}
      selectedId={selectedVaultId}
      value={parsed.data.vault}
      onChange={onChange}
    />
  ) : (
    <SimulatorPhotosContentEditor
      selectedId={photos?.selection?.id}
      onSelect={photos?.navigate}
      value={parsed.data.photos}
      onChange={onChange}
    />
  );
}
