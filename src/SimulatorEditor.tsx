import { SimulatorEditorTabs } from "./SimulatorEditorTabs.js";
import { useSimulatorHomePage } from "./useSimulatorHomePage.js";
import { useSimulatorCollectionSelection } from "./useSimulatorCollectionSelection.js";
import { useSimulatorRecordSelection } from "./useSimulatorRecordSelection.js";
import { useSimulatorEditorSection } from "./useSimulatorEditorSection.js";
import { useSimulatorStartingPosition } from "./useSimulatorStartingPosition.js";
import { SimulatorStartingPositionButton } from "./SimulatorStartingPositionButton.js";
import { SimulatorJsonPanel } from "./SimulatorJsonPanel.js";
import { useSimulatorPhotoSelection } from "./useSimulatorPhotoSelection.js";
import { useSimulatorVaultSelection } from "./useSimulatorVaultSelection.js";
import { simulatorSectionIcons } from "./simulatorSectionIcons.js";
import { useSimulatorEditorValidity } from "./useSimulatorEditorValidity.js";
import { SimulatorCollectionContext } from "./SimulatorCollectionOutlet.js";
import { useCallback, useId, useState } from "react";
import { SimulatorEditorPanel } from "./SimulatorEditorPanel.js";
import { SimulatorSectionEditor } from "./SimulatorSectionEditor.js";
import type {
  SimulatorEditorProps,
  SimulatorEditorNavigation,
  SimulatorEditorSection,
} from "./editorTypes.js";
/** Controlled authoring workspace; its host supplies preview composition and persistence. */
export function SimulatorEditor({
  sections,
  onChange,
  renderPreview,
  renderJsonEditor,
  properties,
  view,
  onViewChange,
  contacts = [],
  disabled = false,
  onValidityChange,
  onJsonValidityChange,
  validateJson,
}: Readonly<SimulatorEditorProps>) {
  const startingPosition = useSimulatorStartingPosition(sections, onChange);
  const viewId = useId();
  const [collectionTarget, setCollectionTarget] = useState<HTMLElement | null>(null);
  const [previewNavigation, setPreviewNavigation] = useState<SimulatorEditorNavigation>();
  const [conversationId, setConversationId, selectConversation] = useSimulatorRecordSelection(
    "messages.thread_detail",
    setPreviewNavigation,
  );
  const [, , selectContact] = useSimulatorRecordSelection("contacts", setPreviewNavigation);
  const [, , selectBrowserPage] = useSimulatorRecordSelection(
    "internet.page",
    setPreviewNavigation,
  );
  const [callId, setCallId] = useState<string>();
  const [emailId, setEmailId, selectEmail] = useSimulatorRecordSelection(
    "email.detail",
    setPreviewNavigation,
  );
  const selection = useSimulatorEditorSection(sections);
  const { section, activeShortcut, activate, highlight, followSelection } = selection;
  const vault = useSimulatorVaultSelection(activate, highlight, sections, onChange);
  const photos = useSimulatorPhotoSelection(activate, highlight, sections, onChange);
  const { homePage, followHomePage, selectHomePage } = useSimulatorHomePage(
    followSelection,
    setPreviewNavigation,
  );
  const { collectionSelection, selectCollectionGroup } = useSimulatorCollectionSelection(section);
  const followConversation = useCallback(
    (id: string | undefined) => {
      if (id !== undefined) followSelection("messages");
      setConversationId(id);
    },
    [followSelection, setConversationId],
  );
  const followCall = useCallback(
    (id: string | undefined) => {
      if (id !== undefined) followSelection("phone");
      setCallId(id);
    },
    [followSelection],
  );
  const followEmail = useCallback(
    (id: string | undefined) => {
      if (id !== undefined) followSelection("email");
      setEmailId(id);
    },
    [followSelection, setEmailId],
  );
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [localTab, setLocalTab] = useState<"properties" | "simulator" | "json">(
    properties ? "properties" : "simulator",
  );
  const tab = view ?? localTab;
  function setTab(next: typeof localTab) {
    setLocalTab(next);
    onViewChange?.(next);
  }
  const { missingEmailDate, missingActivityDate, invalidHome } = useSimulatorEditorValidity({
    pendingVaultDraft: vault.vaultDraft !== null,
    sections,
    jsonError,
    onValidityChange,
    onJsonValidityChange,
  });
  function updateFields(key: SimulatorEditorSection, value: unknown) {
    onChange(key, value);
    if (tab === "json") setJsonText(JSON.stringify(value, null, 2));
  }
  const tabs = properties
    ? (["properties", "simulator", "json"] as const)
    : (["simulator", "json"] as const);
  const selected = sections.find((item) => item.key === section) ?? sections[0];
  return (
    <SimulatorCollectionContext.Provider
      value={
        collectionTarget
          ? {
              target: collectionTarget,
              activeGroup:
                collectionSelection?.section === section ? collectionSelection.group : undefined,
              selectGroup: selectCollectionGroup,
              disabled: disabled || Boolean(jsonError),
            }
          : null
      }
    >
      <div className="row g-3">
        {vault.vaultDraft && (
          <p className="col-12 text-danger mb-0" role="alert">
            Save or discard the open Vault secret before saving the simulator.
          </p>
        )}
        {!jsonError && invalidHome && (
          <p className="col-12 text-danger mb-0" role="alert">
            Complete valid titles, values and image metadata in Home content before saving.
          </p>
        )}
        {!jsonError && missingEmailDate && (
          <p className="col-12 text-danger mb-0" role="alert">
            Enter a sent date and time for each email before saving.
          </p>
        )}
        {!jsonError && missingActivityDate && (
          <p className="col-12 text-danger mb-0" role="alert">
            Enter a date and time for every message and call. Each conversation needs at least one
            dated message.
          </p>
        )}
        <aside className="col-12 col-xl-3 graph-editor-root">
          <SimulatorEditorPanel title="Shortcuts">
            <nav className="list-group list-group-flush" aria-label="Simulator content sections">
              {sections.map((item) => {
                const Icon = simulatorSectionIcons[item.key];
                return (
                  <button
                    type="button"
                    key={item.key}
                    className={`list-group-item list-group-item-action d-flex align-items-center gap-2${activeShortcut === item.key ? " active" : ""}`}
                    aria-current={activeShortcut === item.key ? "true" : undefined}
                    disabled={Boolean(jsonError)}
                    onClick={() => {
                      selection.setSection(item.key);
                      selection.setActiveShortcut(item.key);
                      if (item.key !== "entry_point")
                        setPreviewNavigation((previous) => ({
                          section: item.key,
                          revision: (previous?.revision ?? 0) + 1,
                        }));
                      setTab("simulator");
                      setJsonText(JSON.stringify(item.value, null, 2));
                    }}
                  >
                    <span className="d-inline-flex flex-shrink-0" aria-hidden="true">
                      <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </SimulatorEditorPanel>
          <fieldset disabled={disabled || Boolean(jsonError)}>
            <section ref={setCollectionTarget} aria-label="Simulator collections" />
          </fieldset>
        </aside>
        <section className="col-12 col-xl-6" aria-label="Simulator workspace">
          <SimulatorEditorTabs
            tabs={tabs}
            tab={tab}
            viewId={viewId}
            disabled={Boolean(jsonError)}
            onChange={(next) => {
              setTab(next);
              if (next === "json") setJsonText(JSON.stringify(selected?.value, null, 2));
            }}
          />
          {properties && (
            <div
              role="tabpanel"
              id={`${viewId}-properties-panel`}
              aria-labelledby={`${viewId}-properties-tab`}
              hidden={tab !== "properties"}
            >
              {properties}
            </div>
          )}
          <div
            role="tabpanel"
            id={`${viewId}-simulator-panel`}
            aria-labelledby={`${viewId}-simulator-tab`}
            hidden={tab !== "simulator"}
          >
            <aside aria-label="Live simulator preview" className="d-flex justify-content-center">
              {renderPreview({
                onStartingPositionChange: startingPosition.followStartingPosition,
                homePage,
                onHomePageSelect: followHomePage,
                selectedId: conversationId,
                selectedCallId: callId,
                onCallSelect: followCall,
                navigation: previewNavigation,
                onShortcutChange: highlight,
                onSectionNavigate: selection.followPreviewSection,
                ...vault.vaultPreview,
                ...photos.preview,
                onEmailSelect: followEmail,
                onConversationSelect: followConversation,
              })}
            </aside>
          </div>
          <div
            role="tabpanel"
            id={`${viewId}-json-panel`}
            aria-labelledby={`${viewId}-json-tab`}
            hidden={tab !== "json"}
          >
            <SimulatorJsonPanel
              label={selected?.label ?? "Simulator"}
              value={jsonText}
              disabled={disabled}
              error={jsonError}
              errorId={`${viewId}-json-error`}
              renderEditor={tab === "json" ? renderJsonEditor : undefined}
              onChange={(next) => {
                setJsonText(next);
                try {
                  if (next.length > 4000000) throw new Error("JSON exceeds the editor size limit");
                  const value: unknown = JSON.parse(next);
                  if (validateJson && !validateJson(value)) throw new Error("Unsupported JSON");
                  if (selected) onChange(selected.key, value);
                  setJsonError("");
                } catch {
                  setJsonError("Enter valid JSON before saving or changing sections.");
                }
              }}
            />
          </div>
        </section>
        <section className="col-12 col-xl-3" aria-label="Simulator content editor">
          <fieldset disabled={disabled || Boolean(jsonError)}>
            <SimulatorSectionEditor
              startingPageAction={
                <SimulatorStartingPositionButton
                  {...startingPosition.buttonProps}
                  disabled={disabled || Boolean(jsonError)}
                />
              }
              homePage={homePage}
              onHomePageSelect={selectHomePage}
              selected={selected}
              contacts={contacts}
              sections={sections}
              internet={sections.find((item) => item.key === "internet")?.value}
              onChange={updateFields}
              onSelectConversation={selectConversation}
              photos={photos.editor}
              onVaultNavigate={vault.navigateVault}
              vaultDraft={vault.vaultDraft}
              onVaultDraftChange={vault.followVaultDraft}
              vaultSelection={vault.vaultSelection}
              selectedEmailId={emailId}
              onSelectEmail={selectEmail}
              onSelectContact={selectContact}
              onSelectBrowserPage={selectBrowserPage}
              selectedConversationId={conversationId}
              selectedCallId={callId}
              onSelectCall={followCall}
            />
          </fieldset>
        </section>
      </div>
    </SimulatorCollectionContext.Provider>
  );
}
