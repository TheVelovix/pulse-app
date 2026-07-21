import { colors } from "@/constants/theme";
import { View, StyleSheet } from "react-native";

export default function Dragger() {
  return <View style={styles.dragger} />;
}

const styles = StyleSheet.create({
  dragger: {
    width: 50,
    height: 8,
    backgroundColor: colors.textMuted,
    borderRadius: 50,
    marginHorizontal: "auto",
  },
});
