import { useMemo, useState, useEffect } from "react";
import SimulatorPhoneDevice from "@signalsafe/simulator-device/phone/SimulatorPhoneDevice";
import { fullDeviceToPayload } from "@signalsafe/simulator-react/adapters/deviceToSession";
import { getInitialSessionState } from "@signalsafe/simulator-react/state/simulatorSessionInitialState";
import { simulatorSessionReducer } from "@signalsafe/simulator-react/state/simulatorSessionReducer";
import { getCurrentScreenForApp } from "@signalsafe/simulator-react/types/session";
import type { SimulatorDispatchAction } from "@signalsafe/simulator-react/state/simulatorDispatchActions";
import type {
  SimulatorEditorPreviewContext,
  SimulatorEditorSectionValue,
} from "@signalsafe/simulator-editor-react/editorTypes";
import type {
  SimulatorDevicePayload,
  SimulatorEntryPoint,
} from "@signalsafe/simulator-core/devicePayload";
import { writeSimulatorConversation } from "@signalsafe/simulator-editor-react/simulatorConversationAdapter";
import { parseConversations } from "@signalsafe/simulator-editor-react/parseConversations";
import { validateDeviceJson } from "@signalsafe/simulator-core/validateDeviceJson";

function navigationEntry(
  nav: SimulatorEditorPreviewContext["navigation"],
): SimulatorEntryPoint | undefined {
  if (nav?.section === "messages.thread_detail")
    return {
      app: "messages",
      screen: "thread_detail",
      ...(nav.itemId ? { target: { kind: "conversation", id: nav.itemId } } : {}),
    };
  if (nav?.section === "email.detail")
    return {
      app: "email",
      screen: "detail",
      ...(nav.itemId ? { target: { kind: "email", id: nav.itemId } } : {}),
    };
  if (nav?.section === "contacts")
    return {
      app: "phone",
      screen: "contacts",
      ...(nav.itemId ? { target: { kind: "contact", id: nav.itemId } } : {}),
    };
  if (nav?.section === "internet.page") return { app: "internet", screen: nav.itemId ?? "welcome" };
  if (nav?.section === "phone") return { app: "phone", screen: "history" };
  if (nav?.section === "messages") return { app: "messages", screen: "threads" };
  if (nav?.section === "email") return { app: "email", screen: "list" };
  if (nav?.section === "internet") return { app: "internet", screen: "welcome" };
  return undefined;
}
function previewDocument(
  sections: readonly SimulatorEditorSectionValue[],
  navigation: SimulatorEditorPreviewContext["navigation"],
): SimulatorDevicePayload {
  const doc: Record<string, unknown> = Object.fromEntries(
    sections.map((section) => [section.key, section.value]),
  );
  const conversations = parseConversations(doc.messages);
  const selected = conversations.find((item) => item.id === navigation?.itemId) ?? conversations[0];
  if (selected) {
    const { id, ...edited } = selected;
    doc.messages = writeSimulatorConversation(
      {
        threads: conversations.map((item) => ({
          id: item.id,
          contact_name: item.contact_name,
          contact_number: item.contact_number,
          last_at: item.last_at,
        })),
        thread_detail: { id },
      },
      edited,
    );
  } else doc.messages = { threads: [] };
  const entry = navigationEntry(navigation);
  if (entry) doc.entry_point = entry;
  validateDeviceJson(doc);
  return doc;
}
export function Preview({
  sections,
  context,
}: Readonly<{
  sections: readonly SimulatorEditorSectionValue[];
  context: SimulatorEditorPreviewContext;
}>) {
  const result = useMemo(() => {
    try {
      return { ok: true as const, value: previewDocument(sections, context.navigation) };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Repair the section JSON.",
      };
    }
  }, [sections, context.navigation]);
  return result.ok ? (
    <SessionPreview value={result.value} context={context} />
  ) : (
    <p role="alert">{result.error}</p>
  );
}
function SessionPreview({
  value,
  context,
}: Readonly<{ value: SimulatorDevicePayload; context: SimulatorEditorPreviewContext }>) {
  const payload = useMemo(() => fullDeviceToPayload(value), [value]);
  const [state, setState] = useState(() => getInitialSessionState(payload));
  const [contactId, setContactId] = useState<string>();
  useEffect(() => {
    setState(getInitialSessionState(payload));
    setContactId(undefined);
  }, [payload]);
  const dispatch = (action: SimulatorDispatchAction) =>
    setState((previous) => simulatorSessionReducer(previous, action));
  useEffect(() => {
    const app = state.view.activeApp;
    const screen = getCurrentScreenForApp(state.view);
    let target: SimulatorEntryPoint["target"];
    if (app === "phone" && screen === "contacts" && contactId)
      target = { kind: "contact", id: contactId };
    else if (value.entry_point?.app === app && value.entry_point?.screen === screen)
      target = value.entry_point.target;
    context.onStartingPositionChange?.({ app, screen, ...(target ? { target } : {}) });
  }, [state.view, contactId, context.onStartingPositionChange, value.entry_point]);
  return (
    <div className="example-device">
      <div className="simulator-root simulator-host-device">
        <SimulatorPhoneDevice
          state={state}
          dispatch={dispatch}
          onSelectedContactChange={setContactId}
        />
      </div>
    </div>
  );
}
