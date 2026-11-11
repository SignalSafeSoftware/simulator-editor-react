import { expect, it } from "vitest";
import {
  applyContactDetails,
  contactDetails,
  parseContactDetails,
  parseContactValue,
} from "../src/contactModel";
import { parseConversations } from "../src/parseConversations";
import { migrateEmailLinks } from "../src/emailBody";
it("projects preferred rich contact values without depending on a host document envelope", () => {
  const source = {
    id: "person",
    display_name: "Taylor Example",
    number: "111",
    email: "old@example.test",
  };
  const details = contactDetails(source);
  details.identity = { firstName: "Updated", lastName: "Person", company: "Example" };
  details.phones.push({ id: "preferred", label: "Work", value: "222" });
  details.preferredPhone = "preferred";
  const projected = applyContactDetails(source, parseContactDetails(details));
  expect(projected.number).toBe("222");
  expect(projected.display_name).toBe("Updated Person");
  expect(source.number).toBe("111");
  expect(() =>
    parseContactValue({ id: "bad", label: "Home", value: "222", unknown: true }),
  ).toThrow();
});
it("rejects malformed conversations and duplicate identities", () => {
  const row = {
    id: "one",
    contact_name: "Taylor",
    contact_number: "111",
    last_at: "",
    messages: [],
  };
  expect(parseConversations([row])).toEqual([row]);
  expect(() => parseConversations([row, row])).toThrow();
  expect(() => parseConversations({})).toThrow();
  expect(() => parseConversations([{ ...row, last_at: undefined }])).toThrow();
});
it("moves supported email links into body text once while preserving unrelated content", () => {
  const source = {
    messages: [
      { id: "mail", body: "Hello", links: [{ href: "https://example.test", text: "Visit" }] },
    ],
  };
  const migrated = migrateEmailLinks(source);
  expect(migrateEmailLinks(migrated)).toEqual(migrated);
  expect(migrated).toEqual({
    messages: [{ id: "mail", body: "Hello\n\nVisit\nhttps://example.test" }],
  });
  expect(source.messages[0]?.links).toHaveLength(1);
});
