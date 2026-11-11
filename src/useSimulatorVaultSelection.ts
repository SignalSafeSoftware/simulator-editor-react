import type { VaultNavigation } from "@signalsafe/simulator-react/apps/vault/Vault";
import type { Secret } from "@signalsafe/simulator-core/apps/contracts";
import { changeVaultFolder, homeContentSchema } from "./simulatorHomeContent.js";
import type { SimulatorEditorProps } from "./editorTypes.js";
import { useCallback, useState } from "react";
interface VaultSelection {
  id?: string;
  folder?: string | null;
  revision: number;
}
/** Report each preview navigation event, including reopening the same item. */
export function useSimulatorVaultSelection(
  activate: (section: "vault") => void,
  highlight: (section: "vault") => void,
  sections: SimulatorEditorProps["sections"],
  onChange: SimulatorEditorProps["onChange"],
) {
  const [vaultNavigation, setVaultNavigation] = useState<VaultNavigation>();
  const navigateVault = (target: Omit<VaultNavigation, "revision">) => {
    activate("vault");
    highlight("vault");
    setVaultNavigation((previous) => ({ ...target, revision: (previous?.revision ?? 0) + 1 }));
  };
  const [vaultDraft, setVaultDraft] = useState<Secret | null>(null);
  const [vaultSelection, setVaultSelection] = useState<VaultSelection>();
  const select = useCallback(
    (target: { id?: string; folder?: string | null }) => {
      activate("vault");
      highlight("vault");
      setVaultSelection((previous) => ({ ...target, revision: (previous?.revision ?? 0) + 1 }));
    },
    [activate, highlight],
  );
  const followVaultSecret = useCallback((id: string) => select({ id }), [select]);
  const followVaultFolder = useCallback((folder: string | null) => select({ folder }), [select]);
  const followVaultDraft = useCallback(
    (draft: Secret | null) => {
      setVaultDraft(draft);
      if (draft && draft.id !== vaultDraft?.id) followVaultSecret(draft.id);
    },
    [vaultDraft?.id, followVaultSecret],
  );
  const readVault = () =>
    homeContentSchema.safeParse({ vault: sections.find((item) => item.key === "vault")?.value });
  const vaultPreview = {
    vaultNavigation,
    vaultSecretDraft: vaultDraft,
    onVaultSecretDraftChange: followVaultDraft,
    onVaultSecretSelect: followVaultSecret,
    onVaultFolderSelect: followVaultFolder,
    onVaultFolderChange: (from: string | null, to: string | null, destination: string) => {
      const parsed = readVault();
      if (parsed.success)
        onChange("vault", changeVaultFolder(parsed.data.vault, from, to, destination));
    },
    onVaultSecretSave: (secret: Secret) => {
      const parsed = readVault();
      if (!parsed.success) return;
      const value = parsed.data.vault;
      onChange("vault", {
        ...value,
        folders: [...new Set([...value.folders, secret.folder])],
        items: [...value.items.filter((item) => item.id !== secret.id), secret],
      });
    },
    onVaultSecretRemove: (id: string) => {
      const parsed = readVault();
      if (parsed.success)
        onChange("vault", {
          ...parsed.data.vault,
          items: parsed.data.vault.items.filter((item) => item.id !== id),
        });
    },
  };
  return { vaultSelection, vaultDraft, followVaultDraft, vaultPreview, navigateVault };
}
