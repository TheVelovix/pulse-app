import { createContext, useContext, useEffect, useState } from "react";
import { useWindowDimensions } from "react-native";
import * as Orientation from "expo-screen-orientation";

interface TabletContextType {
  isTablet: boolean;
  isLandscape: boolean;
}

const TabletContext = createContext<TabletContextType>({
  isTablet: false,
  isLandscape: false,
});

export default function TabletProvider({ children }: { children: React.ReactNode }) {
  const [isTablet, setIsTablet] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const dimensions = useWindowDimensions();
  useEffect(() => {
    if (dimensions.width > 639) {
      setIsTablet(true);
    } else {
      setIsTablet(false);
      Orientation.lockAsync(Orientation.OrientationLock.PORTRAIT);
    }
    setIsLandscape(dimensions.width > dimensions.height);
  }, [dimensions]);
  return (
    <TabletContext.Provider value={{ isTablet, isLandscape }}>{children}</TabletContext.Provider>
  );
}

export function useTablet() {
  const context = useContext(TabletContext);
  if (!context) throw new Error("useTablet must be used within TabletProvider");
  return context;
}
