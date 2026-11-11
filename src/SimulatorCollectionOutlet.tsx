import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";
export interface CollectionLayout {
  target: HTMLElement;
  disabled?: boolean;
  activeGroup?: string;
  selectGroup: (group: string) => void;
}
export const SimulatorCollectionContext = createContext<CollectionLayout | null>(null);
/** Keep collection state with its editor while placing its controls beside Shortcuts. */
export function SimulatorCollectionOutlet({ children }: Readonly<{ children: ReactNode }>) {
  const layout = useContext(SimulatorCollectionContext);
  return layout ? createPortal(children, layout.target) : children;
}
