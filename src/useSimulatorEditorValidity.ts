import { useEffect } from "react";
import { homeContentComplete } from "./simulatorHomeContent.js";
import { missingConversationDates, missingCallDates } from "./activityDates.js";
import { contentObject } from "./SimulatorContentFields.js";
import { emailMessages } from "./simulatorEmailContent.js";
import { localDateTime } from "./SimulatorDateTimeField.js";
import type { SimulatorEditorSectionValue } from "./editorTypes.js";
export function useSimulatorEditorValidity({
  pendingVaultDraft = false,
  sections,
  jsonError,
  onValidityChange,
  onJsonValidityChange,
}: Readonly<{
  pendingVaultDraft?: boolean;
  sections: readonly SimulatorEditorSectionValue[];
  jsonError: string;
  onValidityChange?: (valid: boolean) => void;
  onJsonValidityChange?: (valid: boolean) => void;
}>) {
  const missingEmailDate = sections.some(
    (item) =>
      item.key === "email" &&
      contentObject(item.value) &&
      emailMessages(item.value).some(
        (message) => !localDateTime(typeof message.date_at === "string" ? message.date_at : ""),
      ),
  );
  const invalidHome = sections.some((item) =>
    item.key === "home"
      ? !homeContentComplete(item.value)
      : ["vault", "settings", "photos"].includes(item.key) &&
        !homeContentComplete({ [item.key]: item.value }),
  );
  const missingActivityDate = sections.some((item) =>
    item.key === "messages"
      ? missingConversationDates(item.value)
      : item.key === "phone" && missingCallDates(item.value),
  );
  useEffect(() => {
    onValidityChange?.(
      !jsonError && !missingEmailDate && !missingActivityDate && !invalidHome && !pendingVaultDraft,
    );
  }, [
    jsonError,
    missingEmailDate,
    missingActivityDate,
    invalidHome,
    pendingVaultDraft,
    onValidityChange,
  ]);
  useEffect(() => {
    onJsonValidityChange?.(!jsonError);
  }, [jsonError, onJsonValidityChange]);
  return { missingEmailDate, missingActivityDate, invalidHome };
}
