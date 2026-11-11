import type { ReactNode } from "react";
import type { PhotoEditorSelection } from "./useSimulatorPhotoSelection.js";
import type { VaultNavigation } from "@signalsafe/simulator-react/apps/vault/Vault";
import type { Secret } from "@signalsafe/simulator-core/apps/contracts";
import { SimulatorHomeSectionEditor } from "./SimulatorHomeSectionEditor.js";
import type { HomePageId } from "./simulatorHomeContent.js";
import { SimulatorHomeContentEditor } from "./SimulatorHomeContentEditor.js";
import { SimulatorEmailContentEditor } from "./SimulatorEmailContentEditor.js";
import { SimulatorAdditionalContentEditor } from "./SimulatorAdditionalContentEditor.js";
import { SimulatorConversationsEditor } from "./SimulatorConversationsEditor.js";
import { SimulatorStartingScreen } from "./SimulatorStartingScreen.js";
import { parseConversations } from "./parseConversations.js";
import type { SimulatorContact } from "@signalsafe/simulator-core/devicePayload";
import type { SimulatorEditorSection, SimulatorEditorSectionValue } from "./editorTypes.js";
export function SimulatorSectionEditor({
  selected,
  startingPageAction,
  sections = [],
  contacts,
  internet,
  onChange,
  onSelectConversation,
  photos,
  onVaultNavigate,
  vaultDraft,
  onVaultDraftChange,
  vaultSelection,
  selectedEmailId,
  onSelectEmail,
  selectedConversationId,
  selectedCallId,
  onSelectCall,
  onSelectContact,
  onSelectBrowserPage,
  homePage,
  onHomePageSelect,
}: Readonly<{
  selected?: SimulatorEditorSectionValue;
  startingPageAction?: ReactNode;
  sections?: readonly SimulatorEditorSectionValue[];
  homePage?: HomePageId;
  onHomePageSelect?: (page: HomePageId) => void;
  photos?: PhotoEditorSelection;
  onVaultNavigate?: (target: Omit<VaultNavigation, "revision">) => void;
  vaultDraft?: Secret | null;
  onVaultDraftChange?: (draft: Secret | null) => void;
  vaultSelection?: { id?: string; folder?: string | null; revision: number };
  selectedEmailId?: string;
  onSelectEmail?: (id: string | undefined) => void;
  selectedConversationId?: string;
  selectedCallId?: string;
  onSelectBrowserPage?: (id: string | undefined) => void;
  onSelectContact?: (id: string | undefined) => void;
  onSelectCall?: (id: string | undefined) => void;
  contacts: readonly SimulatorContact[];
  internet: unknown;
  onChange: (section: SimulatorEditorSection, value: unknown) => void;
  onSelectConversation: (id: string | undefined) => void;
}>) {
  return selected?.key === "messages" ? (
    <SimulatorConversationsEditor
      contacts={contacts}
      onSelect={onSelectConversation}
      selectedId={selectedConversationId}
      value={parseConversations(selected.value)}
      onChange={(value) => onChange("messages", value)}
    />
  ) : selected && ["contacts", "phone", "internet"].includes(selected.key) ? (
    <SimulatorAdditionalContentEditor
      key={selected.key}
      section={selected.key}
      selectedCallId={selectedCallId}
      onSelectCall={onSelectCall}
      onSelectContact={onSelectContact}
      onSelectBrowserPage={onSelectBrowserPage}
      value={selected.value}
      onChange={(value) => onChange(selected.key, value)}
    />
  ) : selected?.key === "email" ? (
    <SimulatorEmailContentEditor
      selectedId={selectedEmailId}
      onSelect={onSelectEmail}
      value={selected.value}
      onChange={(value) => onChange(selected.key, value)}
    />
  ) : selected?.key === "settings" || selected?.key === "vault" || selected?.key === "photos" ? (
    <SimulatorHomeSectionEditor
      key={
        selected.key === "vault"
          ? `${selected.key}:${vaultSelection?.revision ?? 0}`
          : selected.key === "photos"
            ? `${selected.key}:${photos?.selection?.revision ?? 0}`
            : selected.key
      }
      photos={photos}
      onVaultNavigate={onVaultNavigate}
      vaultDraft={vaultDraft}
      onVaultDraftChange={onVaultDraftChange}
      selectedVaultFolder={vaultSelection?.folder}
      selectedVaultId={vaultSelection?.id}
      page={selected.key}
      value={selected.value}
      onChange={(value) => onChange(selected.key, value)}
    />
  ) : selected?.key === "home" ? (
    <SimulatorHomeContentEditor
      selectedPage={homePage}
      onPageSelect={onHomePageSelect}
      value={selected.value}
      onChange={(value) => onChange("home", value)}
    />
  ) : selected?.key === "entry_point" ? (
    <SimulatorStartingScreen
      startingPageAction={startingPageAction}
      value={selected.value}
      sections={sections}
      internet={internet}
      onChange={(value) => onChange(selected.key, value)}
    />
  ) : null;
}
