import { colors } from "@/constants/theme";
import SessionProvider, { useSession } from "@/context/SessionContext";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import TabletProvider from "@/context/TabletContext";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const insets = useSafeAreaInsets();
  const { loading } = useSession();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          backgroundColor: colors.background,
        },
      }}
    ></Stack>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    "Poppins-Regular": require("../fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("../fonts/Poppins-Bold.ttf"),
  });
  if (!loaded) return null;
  return (
    <GestureHandlerRootView>
      <SessionProvider>
        <TabletProvider>
          <RootLayoutNav />
          <Toaster theme="dark" />
        </TabletProvider>
      </SessionProvider>
    </GestureHandlerRootView>
  );
}
