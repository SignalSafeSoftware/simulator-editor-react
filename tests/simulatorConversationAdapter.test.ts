import { expect, it } from "vitest";
import { parseConversations } from "../src/parseConversations";
import {
  readSimulatorConversation,
  writeSimulatorConversation,
} from "../src/simulatorConversationAdapter";

it("authors one conversation and derives compatible summary and detail data", () => {
  const other = { id: "other", contact_name: "Other", snippet: "Unchanged" };
  const source = {
    custom: "preserved",
    threads: [{ id: "one", contact_name: "Old", snippet: "Stale", unread: true }, other],
    thread_detail: {
      id: "one",
      sender_display_name: "Old",
      sender_number: "+12025550110",
      messages: [{ from: "them", text: "Old" }],
      unread: true,
    },
  };
  const conversation = readSimulatorConversation(source);
  const result = writeSimulatorConversation(source, {
    ...conversation,
    contact_name: "Amazon",
    contact_number: "+12025550111",
    messages: [{ from: "me", text: "Latest 👩🏽‍💻\nmessage", delay_seconds: 0 }],
  });
  expect(result).toMatchObject({
    custom: "preserved",
    threads: [
      {
        id: "one",
        contact_name: "Amazon",
        contact_number: "+12025550111",
        snippet: "Latest 👩🏽‍💻 message",
        unread: true,
      },
      other,
    ],
    thread_detail: {
      id: "one",
      sender_display_name: "Amazon",
      sender_number: "+12025550111",
      unread: true,
      messages: [{ text: "Latest 👩🏽‍💻\nmessage" }],
    },
  });
  expect(source.thread_detail.sender_display_name).toBe("Old");
  expect(readSimulatorConversation(result).contact_name).toBe("Amazon");
});
it("retains the existing summary identity for a legacy detail without an id", () => {
  const source = {
    threads: [{ id: "retained", contact_name: "Saved", contact_number: "123" }],
    thread_detail: { sender_number: "123", messages: [] },
  };
  expect(writeSimulatorConversation(source, readSimulatorConversation(source))).toMatchObject({
    threads: [{ id: "retained", snippet: "" }],
    thread_detail: { id: "retained", sender_display_name: "Saved" },
  });
});
it("rejects runtime thread structures in the authoring JSON", () => {
  expect(() => writeSimulatorConversation({}, { threads: [], thread_detail: {} })).toThrow(
    "Enter a conversation",
  );
});

it("moves a legacy conversation time onto its final message without replacing an authored timestamp", () => {
  const legacy = readSimulatorConversation({
    thread_detail: {
      id: "one",
      last_at: "2:30 PM",
      messages: [
        { from: "them", text: "First" },
        { from: "me", text: "Last" },
      ],
    },
  });
  expect(legacy.messages[1]).toMatchObject({ timestamp: "2:30 PM" });
  const changed = writeSimulatorConversation(
    {},
    {
      ...legacy,
      last_at: "Wrong conversation time",
      messages: [{ from: "them", text: "Latest", timestamp: "4:15 PM" }],
    },
  );
  expect(changed).toMatchObject({
    threads: [{ last_at: "4:15 PM" }],
    thread_detail: { last_at: "4:15 PM" },
  });
  const cleared = writeSimulatorConversation(changed, {
    ...legacy,
    messages: [{ from: "them", text: "Latest", timestamp: "" }],
  });
  expect(cleared).toMatchObject({ thread_detail: { last_at: "" } });
});

it("orders dated messages chronologically and derives the latest conversation date", () => {
  const edited = readSimulatorConversation({
    thread_detail: {
      messages: [
        { text: "Later", timestamp: "2026-11-07T16:00:00Z" },
        { text: "Earlier", timestamp: "2026-11-07T15:00:00Z" },
      ],
    },
  });
  expect(edited.messages).toEqual([
    { text: "Earlier", timestamp: "2026-11-07T15:00:00Z" },
    { text: "Later", timestamp: "2026-11-07T16:00:00Z" },
  ]);
  expect(edited.last_at).toBe("2026-11-07T16:00:00Z");
});

it("does not move a reply timestamp onto undated scripted messages during repeated normalization", () => {
  const authored = [
    { id: "zero", from: "them", text: "Immediate", delay_seconds: 0 },
    { id: "half", from: "them", text: "After half a second", delay_seconds: 0.5 },
    { id: "one", from: "them", text: "After one second", delay_seconds: 0.5 },
  ];
  const reply = {
    id: "local-reply",
    from: "me",
    text: "Runtime reply",
    timestamp: "2026-11-15T12:00:00.000Z",
  };
  const original = {
    id: "thread-A",
    contact_name: "Example",
    contact_number: "+12025550110",
    last_at: "",
    messages: [...authored, reply],
  };
  const before = JSON.stringify(original);
  const [initial] = parseConversations([original]);
  if (!initial) throw new Error("Missing normalized conversation");
  let conversation = initial;
  for (let pass = 0; pass < 3; pass += 1) {
    const { id, ...fields } = conversation;
    const projected = writeSimulatorConversation({ thread_detail: { id } }, fields);
    const read = readSimulatorConversation(projected);
    const [next] = parseConversations([{ id, ...read }]);
    if (!next) throw new Error("Missing round-trip conversation");
    expect(next.messages).toEqual([reply, ...authored]);
    expect(next.last_at).toBe(reply.timestamp);
    conversation = next;
  }
  expect(JSON.stringify(original)).toBe(before);
});

it("migrates a genuine missing legacy timestamp once while preserving dated messages", () => {
  const earlier = { from: "them", text: "Earlier", timestamp: "2026-11-15T11:00:00.000Z" };
  const source = {
    thread_detail: {
      id: "legacy-mixed",
      last_at: "2026-11-15T12:00:00.000Z",
      messages: [earlier, { from: "me", text: "Latest" }],
    },
  };
  const migrated = readSimulatorConversation(source);
  expect(migrated.messages).toEqual([
    earlier,
    { from: "me", text: "Latest", timestamp: source.thread_detail.last_at },
  ]);
  expect(readSimulatorConversation(writeSimulatorConversation(source, migrated))).toEqual(migrated);
});
