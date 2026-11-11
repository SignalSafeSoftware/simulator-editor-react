import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { SimulatorEditor } from "../src/SimulatorEditor";
import type {
  SimulatorEditorPreviewContext,
  SimulatorEditorSectionValue,
} from "../src/editorTypes";
const sections: SimulatorEditorSectionValue[] = [
  { key: "entry_point", label: "Starting screen", value: { app: "home", screen: "home" } },
  { key: "messages", label: "Messages", value: [] },
  { key: "email", label: "Email", value: {} },
  { key: "phone", label: "Phone", value: {} },
  { key: "vault", label: "Vault", value: { folders: ["Unfiled"], items: [] } },
  { key: "photos", label: "Photos", value: { items: [] } },
];
const reports: Array<[string, (context: SimulatorEditorPreviewContext) => void]> = [
  ["email", (context) => context.onEmailSelect("email")],
  ["conversation", (context) => context.onConversationSelect?.("thread")],
  ["call", (context) => context.onCallSelect?.("call")],
  ["Vault folder", (context) => context.onVaultFolderSelect?.("Unfiled")],
  ["Vault entry", (context) => context.onVaultSecretSelect?.("secret")],
  ["photo", (context) => context.onPhotoSelect?.("photo")],
  ["home page", (context) => context.onHomePageSelect?.("vault")],
  ["shortcut", (context) => context.onShortcutChange("email")],
];
it.each(reports)(
  "does not replace starting settings when the preview reports %s",
  (_name, report) => {
    const change = vi.fn();
    render(
      <SimulatorEditor
        sections={sections}
        onChange={change}
        renderPreview={(context) => (
          <button onClick={() => report(context)}>Restore selection</button>
        )}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Starting screen" }));
    fireEvent.click(screen.getByRole("button", { name: "Restore selection" }));
    expect(screen.getByLabelText("Starting app")).toBeVisible();
    expect(screen.getByRole("button", { name: "Starting screen" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(change).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Email" }));
    expect(screen.queryByLabelText("Starting app")).toBeNull();
  },
);
