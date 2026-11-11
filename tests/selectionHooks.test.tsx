import { useState } from "react";
import { act, renderHook, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { photoSchema, secretSchema } from "@signalsafe/simulator-core/apps/contracts";
import { useSimulatorPhotoSelection } from "../src/useSimulatorPhotoSelection";
import { useSimulatorVaultSelection } from "../src/useSimulatorVaultSelection";
import { useSimulatorHomePage } from "../src/useSimulatorHomePage";
import { useSimulatorEditorValidity } from "../src/useSimulatorEditorValidity";
import { contactNumberOptions } from "../src/simulatorContactNumberOptions";
import type { SimulatorEditorSectionValue, SimulatorEditorNavigation } from "../src/editorTypes";
afterEach(cleanup);
const timestamp = "2026-11-11T00:00:00Z";
const secret = secretSchema.parse({
  id: "one",
  title: "Example",
  username: "",
  value: "fictional",
  site: "",
  notes: "",
  createdAt: timestamp,
  updatedAt: timestamp,
});
const metadata = { capturedAt: "", timeZone: "", latitude: null, longitude: null };
const photo = photoSchema.parse({
  id: "one",
  title: "Example",
  caption: "",
  asset: { name: "Example", mime: "image/png", data: "data:image/png;base64,AA==" },
  original: metadata,
  metadata,
  createdAt: timestamp,
  updatedAt: timestamp,
});
it("keeps photo mutations attached to authored records and ignores invalid JSON shapes", () => {
  const changed = vi.fn(),
    activate = vi.fn(),
    highlight = vi.fn();
  const sections: SimulatorEditorSectionValue[] = [
    { key: "photos", label: "Photos", value: { items: [photo, { ...photo, id: "two" }] } },
  ];
  const hook = renderHook(
    ({ sections }) => useSimulatorPhotoSelection(activate, highlight, sections, changed),
    { initialProps: { sections } },
  );
  act(() => hook.result.current.preview.onPhotoSave({ ...photo, title: "Updated" }));
  expect(changed).toHaveBeenCalledWith(
    "photos",
    expect.objectContaining({
      items: expect.arrayContaining([
        expect.objectContaining({ id: "one", title: "Updated" }),
        expect.objectContaining({ id: "two" }),
      ]),
    }),
  );
  act(() => hook.result.current.preview.onPhotoRemove("one"));
  expect(changed).toHaveBeenLastCalledWith("photos", { items: [{ ...photo, id: "two" }] });
  act(() => hook.result.current.editor.navigate("missing"));
  expect(hook.result.current.preview.photoNavigation).toBeUndefined();
  hook.rerender({ sections: [{ key: "photos", label: "Photos", value: { items: false } }] });
  changed.mockClear();
  act(() => {
    hook.result.current.editor.navigate("one");
    hook.result.current.preview.onPhotoSave(photo);
    hook.result.current.preview.onPhotoRemove("one");
  });
  expect(changed).not.toHaveBeenCalled();
});
it("keeps Vault save/remove/folder callbacks within the authored collection", () => {
  const changed = vi.fn(),
    activate = vi.fn(),
    highlight = vi.fn();
  const sections: SimulatorEditorSectionValue[] = [
    {
      key: "vault",
      label: "Vault",
      value: { folders: ["Unfiled"], items: [secret, { ...secret, id: "two" }] },
    },
  ];
  const hook = renderHook(
    ({ sections }) => useSimulatorVaultSelection(activate, highlight, sections, changed),
    { initialProps: { sections } },
  );
  act(() => hook.result.current.vaultPreview.onVaultSecretSave({ ...secret, folder: "Work" }));
  expect(changed).toHaveBeenLastCalledWith(
    "vault",
    expect.objectContaining({ folders: ["Unfiled", "Work"] }),
  );
  act(() => hook.result.current.vaultPreview.onVaultSecretRemove("one"));
  expect(changed).toHaveBeenLastCalledWith("vault", {
    folders: ["Unfiled"],
    items: [{ ...secret, id: "two" }],
  });
  act(() => hook.result.current.vaultPreview.onVaultFolderChange("Unfiled", "Work", "Archive"));
  expect(changed).toHaveBeenLastCalledWith("vault", expect.objectContaining({ folders: ["Work"] }));
  hook.rerender({ sections: [{ key: "vault", label: "Vault", value: { folders: null } }] });
  changed.mockClear();
  act(() => {
    hook.result.current.vaultPreview.onVaultSecretSave(secret);
    hook.result.current.vaultPreview.onVaultSecretRemove("one");
    hook.result.current.vaultPreview.onVaultFolderChange(null, null, "Archive");
  });
  expect(changed).not.toHaveBeenCalled();
});
it("distinguishes host Home navigation events even when reopening the same page", () => {
  const follow = vi.fn();
  const hook = renderHook(() => {
    const [navigation, setNavigation] = useState<SimulatorEditorNavigation>();
    return { ...useSimulatorHomePage(follow, setNavigation), navigation };
  });
  act(() => hook.result.current.selectHomePage("vault"));
  expect(hook.result.current.navigation).toEqual({ section: "home.vault", revision: 1 });
  act(() => hook.result.current.selectHomePage("vault"));
  expect(hook.result.current.navigation?.revision).toBe(2);
  act(() => hook.result.current.followHomePage("photos"));
  expect(follow).toHaveBeenCalledWith("photos");
  expect(hook.result.current.homePage).toBe("photos");
});
it("reports malformed Home data as invalid instead of allowing a save", () => {
  const validity = vi.fn();
  const sections: SimulatorEditorSectionValue[] = [
    { key: "home", label: "Home", value: { vault: { items: false } } },
  ];
  const hook = renderHook(() =>
    useSimulatorEditorValidity({ sections, jsonError: "", onValidityChange: validity }),
  );
  expect(hook.result.current.invalidHome).toBe(true);
  expect(validity).toHaveBeenCalledWith(false);
});
it("includes labeled and unlabeled contact endpoints without inventing identities", () => {
  expect(
    contactNumberOptions(
      [{ id: "a", display_name: "", phone_numbers: [{ label: "", value: "111", number: "" }] }],
      [{ contact_name: "", contact_number: "222", last_at: "", messages: [] }],
    ),
  ).toEqual([
    { number: "111", label: "111" },
    { number: "222", label: "222" },
  ]);
});
it("repeats equivalent selection reports without losing revisions or starting positions", () => {
  const changed = vi.fn(),
    activate = vi.fn(),
    highlight = vi.fn();
  const hook = renderHook(() =>
    useSimulatorPhotoSelection(
      activate,
      highlight,
      [{ key: "photos", label: "Photos", value: { items: [photo] } }],
      changed,
    ),
  );
  act(() => hook.result.current.editor.navigate(undefined));
  expect(hook.result.current.preview.photoNavigation?.photo).toBeNull();
  act(() => hook.result.current.editor.navigate("one"));
  expect(hook.result.current.preview.photoNavigation?.photo?.id).toBe("one");
});
