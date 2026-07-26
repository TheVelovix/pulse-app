import { sharedStyles } from "@/constants/commonStyles";
import { useRouter } from "expo-router";
import { ArrowLeftIcon } from "phosphor-react-native";
import { Pressable, StyleSheet, Text } from "react-native";

export default function BackButton() {
  const router = useRouter();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && { backgroundColor: "rgba(255,255,255,.5)" },
      ]}
      onPress={() => router.back()}
    >
      <ArrowLeftIcon color="white" />
      <Text style={sharedStyles.labels}>Back</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 15,
    width: 100,
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
});
