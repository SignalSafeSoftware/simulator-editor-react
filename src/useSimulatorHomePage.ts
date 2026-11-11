import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import type { SimulatorEditorNavigation, SimulatorEditorSection } from "./editorTypes.js";
import type { HomePageId } from "./simulatorHomeContent.js";
export function useSimulatorHomePage(
  followSelection: (section: SimulatorEditorSection) => void,
  navigate: Dispatch<SetStateAction<SimulatorEditorNavigation | undefined>>,
) {
  const [homePage, setHomePage] = useState<HomePageId>("settings");
  const followHomePage = useCallback(
    (page: HomePageId) => {
      followSelection(page);
      setHomePage(page);
    },
    [followSelection],
  );
  const selectHomePage = useCallback(
    (page: HomePageId) => {
      setHomePage(page);
      navigate((previous) => ({
        section: `home.${page}`,
        revision: (previous?.revision ?? 0) + 1,
      }));
    },
    [navigate],
  );
  return { homePage, followHomePage, selectHomePage };
}
