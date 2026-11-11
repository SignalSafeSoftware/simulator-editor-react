import type { SimulatorEntryPoint } from "@signalsafe/simulator-core/devicePayload";
import type { PhotoNavigation } from "@signalsafe/simulator-react/apps/photos/Photos";
import type { Photo } from "@signalsafe/simulator-core/apps/contracts";
import type { VaultNavigation } from "@signalsafe/simulator-react/apps/vault/Vault";
import type { Secret } from "@signalsafe/simulator-core/apps/contracts";
import type { HomePageId } from "./simulatorHomeContent.js";
import type { ReactNode } from "react";
import type { SimulatorContact } from "@signalsafe/simulator-core/devicePayload";
export type SimulatorEditorSection =
  | "entry_point"
  | "messages"
  | "email"
  | "contacts"
  | "phone"
  | "internet"
  | "home"
  | "vault"
  | "settings"
  | "photos";
export interface SimulatorEditorSectionValue {
  key: SimulatorEditorSection;
  label: string;
  value: unknown;
}
export interface SimulatorEditorNavigation {
  itemId?: string;
  section: string;
  revision: number;
}
export interface SimulatorEditorPreviewContext {
  onStartingPositionChange?: (position: SimulatorEntryPoint) => void;
  homePage?: HomePageId;
  onHomePageSelect?: (page: HomePageId) => void;
  selectedId?: string;
  selectedCallId?: string;
  onCallSelect?: (id: string | undefined) => void;
  navigation?: SimulatorEditorNavigation;
  onShortcutChange: (section: string | undefined) => void;
  onSectionNavigate: (section: string | undefined) => void;
  photoNavigation?: PhotoNavigation;
  onPhotoSelect?: (id: string | undefined) => void;
  onPhotoSave?: (photo: Photo) => void;
  onPhotoRemove?: (id: string) => void;
  vaultNavigation?: VaultNavigation;
  vaultSecretDraft?: Secret | null;
  onVaultSecretDraftChange?: (draft: Secret | null) => void;
  onVaultSecretSave?: (secret: Secret) => void;
  onVaultSecretRemove?: (id: string) => void;
  onVaultFolderSelect?: (folder: string | null) => void;
  onVaultFolderChange?: (from: string | null, to: string | null, destination: string) => void;
  onVaultSecretSelect?: (id: string) => void;
  onEmailSelect: (id: string | undefined) => void;
  onConversationSelect?: (id: string | undefined) => void;
}
export interface SimulatorJsonEditorContext {
  value: string;
  onChange: (text: string) => void;
  disabled: boolean;
  ariaLabel: string;
  describedBy?: string;
  invalid: boolean;
}
export interface SimulatorEditorProps {
  sections: readonly SimulatorEditorSectionValue[];
  onChange: (section: SimulatorEditorSection, value: unknown) => void;
  renderJsonEditor?: (context: SimulatorJsonEditorContext) => ReactNode;
  renderPreview: (context: SimulatorEditorPreviewContext) => ReactNode;
  contacts?: readonly SimulatorContact[];
  disabled?: boolean;
  onValidityChange?: (valid: boolean) => void;
  onJsonValidityChange?: (valid: boolean) => void;
  validateJson?: (value: unknown) => boolean;
}
