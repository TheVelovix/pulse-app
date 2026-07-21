import { colors } from "@/constants/theme";
import { Tabs } from "expo-router";
import { HouseIcon, UserIcon } from "phosphor-react-native";
import { Text } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "black",
          borderTopColor: colors.accent,
        },
      }}
    >
      <Tabs.Screen
        name="Dashboard"
        options={{
          tabBarIcon: ({ focused }) => <HouseIcon color={focused ? colors.accent : "white"} />,
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                color: focused ? colors.accent : "white",
                fontFamily: "Poppins-Regular",
                fontSize: 12,
              }}
            >
              Dashboard
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ focused }) => <UserIcon color={focused ? colors.accent : "white"} />,
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                color: focused ? colors.accent : "white",
                fontFamily: "Poppins-Regular",
                fontSize: 12,
              }}
            >
              Profile
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}
