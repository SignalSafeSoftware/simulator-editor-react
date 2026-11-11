import { SimulatorCallType, unifyPhoneCalls } from "@signalsafe/simulator-core/phoneCalls";
import { validateDeviceJson } from "@signalsafe/simulator-core/validateDeviceJson";
import { phoneCallGroups } from "@signalsafe/simulator-react/utils/payload/phoneCallGroups";
import { createSimulatorId } from "@signalsafe/simulator-core/apps/id";
import { useEffect, useRef, useState } from "react";
import { contentObject, contentLabel } from "./SimulatorContentFields.js";
import { SimulatorPhoneCallFields } from "./SimulatorPhoneCallFields.js";
import { SimulatorCollectionTree } from "./SimulatorCollectionTree.js";
import { SimulatorEditorPanel } from "./SimulatorEditorPanel.js";
const createCall = () => ({
  id: createSimulatorId(),
  type: SimulatorCallType.Received,
  name: "",
  number: "",
  timestamp: "",
});
export function SimulatorPhoneCallsEditor({
  value,
  onChange,
  selectedId,
  onSelect,
}: Readonly<{
  value: unknown;
  onChange: (next: unknown) => void;
  selectedId?: string;
  onSelect?: (id: string | undefined) => void;
}>) {
  const phone = contentObject(value) ? value : {};
  const device = { entry_point: { app: "phone", screen: "history" }, phone };
  validateDeviceJson(device);
  const calls = unifyPhoneCalls(device.phone);
  const groups = phoneCallGroups(calls);
  const [selected, setSelected] = useState<string | undefined>(
    selectedId ? `call:${selectedId}` : undefined,
  );
  const requested = useRef(selectedId);
  useEffect(() => {
    if (selectedId !== requested.current) {
      requested.current = selectedId;
      setSelected(selectedId ? `call:${selectedId}` : undefined);
    }
  }, [selectedId]);
  const nodes = groups.flatMap((entries, index) => {
    const first = entries[0];
    return first
      ? [
          {
            id: `group:${first.id}`,
            label: first.name || first.number || `Call group ${index + 1}`,
            children: entries.map((call) => ({
              id: `call:${call.id}`,
              label: `${contentLabel(call.type)}${call.timestamp ? ` — ${call.timestamp}` : ""}`,
            })),
          },
        ]
      : [];
  });
  const group = groups.find(
    (entries) =>
      entries.some((call) => `call:${call.id}` === selected) ||
      `group:${entries[0]?.id}` === selected,
  );
  const active = calls.find((call) => `call:${call.id}` === selected);
  function select(id: string) {
    setSelected(id);
    const entry = id.startsWith("call:")
      ? calls.find((call) => `call:${call.id}` === id)
      : groups.find((entries) => `group:${entries[0]?.id}` === id)?.[0];
    requested.current = entry?.id;
    onSelect?.(entry?.id);
  }
  function update(next: typeof calls) {
    const updated: Record<string, unknown> = { ...phone, calls: next };
    delete updated.history;
    delete updated.incoming_call;
    delete updated.voicemail;
    onChange(updated);
  }
  function add(parent?: string) {
    const first = groups.find((entries) => `group:${entries[0]?.id}` === parent)?.[0];
    const call = { ...createCall(), name: first?.name ?? "", number: first?.number ?? "" };
    update([...calls, call]);
    setSelected(`call:${call.id}`);
    requested.current = call.id;
    onSelect?.(call.id);
  }
  return (
    <div className="graph-editor-root">
      <SimulatorCollectionTree
        title="Calls"
        nodes={nodes}
        selectedId={selected}
        onSelect={select}
        onAdd={() => add()}
        onAddChild={add}
        onRemove={(id) => {
          const members = groups.find((entries) => `group:${entries[0]?.id}` === id);
          const removed = new Set(members?.map((call) => call.id) ?? [id.slice(5)]);
          update(calls.filter((call) => !removed.has(call.id)));
          if (members || id === selected) {
            setSelected(undefined);
            requested.current = undefined;
            onSelect?.(undefined);
          }
        }}
      />
      {active ? (
        <SimulatorEditorPanel title="Call">
          <div className="graph-editor-card__body">
            <SimulatorPhoneCallFields
              item={{ ...active }}
              change={(next) =>
                update(calls.map((call) => (call.id === active.id ? { ...call, ...next } : call)))
              }
            />
          </div>
        </SimulatorEditorPanel>
      ) : group?.[0] ? (
        <SimulatorEditorPanel title="Call group">
          <div className="graph-editor-card__body">
            <p>{group[0].name || group[0].number}</p>
            <p>{group[0].number}</p>
            <p>{group.length} calls. Select a call to edit its details.</p>
          </div>
        </SimulatorEditorPanel>
      ) : null}
    </div>
  );
}
