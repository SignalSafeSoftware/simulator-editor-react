const MAX_ROW_LABEL_LENGTH = 40;

/** Shorten only the authoring list label; stored content remains unchanged. */
export function simulatorRowLabel(value: string): string {
  const characters = Array.from(value.replace(/\s+/gu, " ").trim());
  return characters.length > MAX_ROW_LABEL_LENGTH
    ? `${characters
        .slice(0, MAX_ROW_LABEL_LENGTH - 1)
        .join("")
        .trimEnd()}…`
    : characters.join("");
}
