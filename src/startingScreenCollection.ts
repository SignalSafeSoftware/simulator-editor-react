import { SimulatorApp } from "@signalsafe/simulator-core/simulatorApp";
import {
  SimulatorEmailScreenId,
  SimulatorMessagesScreenId,
  SimulatorPhoneScreenId,
} from "@signalsafe/simulator-core/devicePayload";

/** Detail routes remain valid saved values; authoring groups them under their collection. */
export function startingScreenCollection(app: string, screen: string): string {
  if (
    app === SimulatorApp.Phone &&
    (screen === SimulatorPhoneScreenId.IncomingCall || screen === SimulatorPhoneScreenId.Voicemail)
  )
    return SimulatorPhoneScreenId.History;
  if (app === SimulatorApp.Messages && screen === SimulatorMessagesScreenId.ThreadDetail)
    return SimulatorMessagesScreenId.Threads;
  if (app === SimulatorApp.Email && screen === SimulatorEmailScreenId.Detail)
    return SimulatorEmailScreenId.List;
  return screen;
}
