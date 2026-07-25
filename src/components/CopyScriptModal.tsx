import { colors } from "@/constants/theme";
import { sharedStyles } from "@/constants/commonStyles";
import { CopyIcon, KeyIcon } from "phosphor-react-native";
import { useCallback, useMemo } from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  useWindowDimensions,
  View,
  Text,
  Pressable,
} from "react-native";
import { TextInput } from "react-native-gesture-handler";
import Animated, { FadeIn, FadeOut, FlipInXUp, FlipOutXUp } from "react-native-reanimated";
import { toast, Toaster } from "sonner-native";
import * as Clipboard from "expo-clipboard";
import { CopyScriptParams } from "@/types/Dashboard";

const dvh = Dimensions.get("window").height;
const dvw = Dimensions.get("window").width;

export default function CopyScriptModal({ isVisible, close, projectId }: CopyScriptParams) {
  const dimensions = useWindowDimensions();
  const script = useMemo(() => {
    return `<script src="https://api.pulse.velovix.com/viewsTracker.js" data-project-id="${projectId}"></script>`;
  }, [projectId]);
  const copyScript = useCallback(async () => {
    await Clipboard.setStringAsync(script);
    toast.success("Script Copied.");
  }, [projectId]);
  return (
    <Modal
      visible={isVisible}
      style={{
        height: dimensions.height,
        width: dimensions.width,
        backgroundColor: "rgba(0,0,0,.7)",
      }}
    >
      <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.scriptModal}>
        <Animated.View entering={FlipInXUp} exiting={FlipOutXUp} style={styles.scriptWrapper}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {/*Key Icon*/}
            <View
              style={{
                backgroundColor: colors.accentTransparent,
                width: 40,
                height: 40,
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CopyIcon color={colors.accent} />
            </View>
            <View style={{ maxWidth: "80%" }}>
              <Text style={styles.title}>Copy Script</Text>
              <Text style={sharedStyles.labels}>
                Paste this script inside the{" "}
                <Text style={[sharedStyles.labels, { color: colors.accent }]}>{"<head>"}</Text> of
                your site.
              </Text>
            </View>
          </View>

          <View style={[sharedStyles.cards, { marginTop: 20 }]}>
            <Text selectable={true} style={sharedStyles.labels}>
              {script}
            </Text>
          </View>
          <View style={[styles.buttonsWrapper]}>
            <Pressable
              style={({ pressed }) => [
                styles.buttons,
                { backgroundColor: colors.accent },
                pressed && { backgroundColor: colors.accentHover },
              ]}
              onPress={copyScript}
            >
              <Text style={sharedStyles.labels}>Copy to clipboard</Text>
            </Pressable>

            <Pressable
              onPress={close}
              style={({ pressed }) => [
                styles.buttons,
                pressed && { backgroundColor: colors.background },
              ]}
            >
              <Text style={sharedStyles.labels}>Close</Text>
            </Pressable>
          </View>
        </Animated.View>
        <Toaster theme="dark" />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scriptModal: {
    position: "absolute",
    zIndex: 5,
    height: dvh,
    width: dvw,
    backgroundColor: "rgba(0,0,0,.7)",
    alignItems: "center",
  },
  scriptWrapper: {
    width: "90%",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.2)",
    borderRadius: 10,
    padding: 15,
    marginTop: "30%",
  },
  title: {
    fontFamily: "Poppins-SemiBold",
    color: "white",
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.textMuted,
    borderRadius: 10,
    color: "white",
  },
  buttonsWrapper: {
    marginTop: 25,
    marginHorizontal: "auto",
    gap: 20,
    justifyContent: "flex-end",
    width: "100%",
    paddingHorizontal: 10,
  },
  buttons: {
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 50,
  },
});
