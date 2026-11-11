import { expect, it } from "vitest";
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
