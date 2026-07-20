import { colors } from "@/constants/theme";
import SessionProvider from "@/context/SessionContext";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";
import { useFonts } from "expo-font";

export default function RootLayout() {
  const insets = useSafeAreaInsets();
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
        <Toaster />
      </SessionProvider>
    </GestureHandlerRootView>
  );
}
