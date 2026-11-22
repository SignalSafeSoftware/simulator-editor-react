import { expect, it } from "vitest";
import { migrateEmailLinks } from "../src/emailBody";

const HREF = "https://example.test/account";
function migrate(body: string, href = HREF): unknown {
  return migrateEmailLinks({ body, links: [{ href, text: "" }] });
}

it("recognizes every supported surrounding punctuation character without duplicating a URL", () => {
  const leading = ["", "<", "(", "[", "{", "'", '"', "“", "‘", '<([{"“‘'];
  const trailing = [
    "",
    ">",
    "]",
    ")",
    "}",
    "'",
    '"',
    "”",
    "’",
    ",",
    ".",
    ";",
    "!",
    ">])}'\"”’,.;!",
  ];
  for (const before of leading) {
    for (const after of trailing) {
      const body = before + HREF + after;
      expect(migrate(body)).toEqual({ body });
    }
  }
  expect(migrate(`Before\t(${HREF}).\nAfter`)).toEqual({ body: `Before\t(${HREF}).\nAfter` });
});

it("preserves asymmetric punctuation, exact token matching and legacy href trimming", () => {
  for (const body of [`!${HREF}`, `${HREF}(`, `before${HREF}`, `${HREF}after`])
    expect(migrate(body)).toEqual({ body: `${body}\n\n${HREF}` });
  expect(migrate(`!${HREF}`, `!${HREF}`)).toEqual({ body: `!${HREF}` });
  expect(migrate(HREF, ` ${HREF} `)).toEqual({ body: HREF });
  expect(migrate("")).toEqual({ body: HREF });
  for (const body of ["<([{'\"“‘", ">])}'\"”’,.;!"])
    expect(migrate(body)).toEqual({ body: `${body}\n\n${HREF}` });
});

it("handles long unmatched punctuation runs and remains idempotent without changing the source", () => {
  const body = "!".repeat(100_000) + "x";
  const source = { body, links: [{ href: HREF, text: "" }] };
  const migrated = migrateEmailLinks(source);
  expect(migrated).toEqual({ body: `${body}\n\n${HREF}` });
  expect(migrateEmailLinks(migrated)).toEqual(migrated);
  expect(source).toEqual({ body, links: [{ href: HREF, text: "" }] });
  const wrapped = "(".repeat(100_000) + HREF + ")".repeat(100_000);
  expect(migrate(wrapped)).toEqual({ body: wrapped });
});
