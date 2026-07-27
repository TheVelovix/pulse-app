import { colors } from "@/constants/theme";
import { sharedStyles } from "@/constants/commonStyles";
import { fetchWithAuth } from "@/lib/lib";
import { ProfileFormProps } from "@/types/Profile";
import { CopyIcon, KeyIcon } from "phosphor-react-native";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Modal, StyleSheet, useWindowDimensions, View, Text, Pressable } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import Animated, { FadeIn, FadeOut, FlipInXUp, FlipOutXUp } from "react-native-reanimated";
import { toast, Toaster } from "sonner-native";
import * as Clipboard from "expo-clipboard";
import { useTablet } from "@/context/TabletContext";

export default function ApiKeysModal({ isVisible, close }: ProfileFormProps) {
  const dimensions = useWindowDimensions();
  const [reqPending, startTransition] = useTransition();
  const [keyName, setKeyName] = useState("");
  const [keyCreated, setKeyCreated] = useState(false);
  const [key, setKey] = useState("");
  function createKey() {
    if (!keyName) {
      toast.error("Key name cannot be empty.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetchWithAuth(
          `${process.env.EXPO_PUBLIC_BACKEND}/api/user/apiKeys?name=${keyName}`,
          {
            method: "POST",
          },
        );
        if (!res.ok) {
          toast.error("Something went wrong.");
        } else {
          toast.success("API Key Created.");
          const data = await res.json();
          setKey(data.key);
          setKeyCreated(true);
        }
      } catch {
        toast.error("Something went wrong.");
      }
    });
  }
  useEffect(() => {
    if (!isVisible) {
      // Cleanup
      setKeyName("");
      setKey("");
      setKeyCreated(false);
    }
  }, [isVisible]);
  const copyKey = useCallback(async () => {
    await Clipboard.setStringAsync(key);
    toast.success("Key Copied.");
  }, [key]);
  const { isTablet, isLandscape } = useTablet();
  return (
    <Modal
      visible={isVisible}
      style={{
        height: dimensions.height,
        width: dimensions.width,
        backgroundColor: "rgba(0,0,0,.7)",
      }}
    >
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={[styles.apiKeysModal, { height: dimensions.height, width: dimensions.width }]}
      >
        <Animated.View
          entering={FlipInXUp}
          exiting={FlipOutXUp}
          style={[
            styles.keyForm,
            isTablet && isLandscape && { marginTop: "5%", width: "50%" },
            isTablet && !isLandscape && { marginTop: "15%", width: "70%" },
          ]}
        >
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
              <KeyIcon color={colors.accent} />
            </View>
            <View style={{ maxWidth: "80%" }}>
              <Text style={styles.title}>
                {!keyCreated ? "Create New API Key" : "API Key Created"}
              </Text>
              {keyCreated && (
                <Text style={[sharedStyles.labels, { color: colors.textMuted }]}>
                  Copy
                  <Text style={sharedStyles.labels}> {keyName} </Text> now. It won&apos;t be shown
                  again.
                </Text>
              )}
            </View>
          </View>

          <View style={{ marginTop: 20 }}>
            {!keyCreated ? (
              <>
                <Text style={sharedStyles.labelsMuted}>Enter Key Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Key name (e.g. Production)"
                  value={keyName}
                  onChangeText={newVal => {
                    setKeyName(newVal);
                  }}
                  autoCapitalize="none"
                  editable={!reqPending}
                  placeholderTextColor="#ffffff45"
                  onSubmitEditing={createKey}
                />
              </>
            ) : (
              <View style={[sharedStyles.cards, { backgroundColor: colors.background }]}>
                <Text selectable={true} style={sharedStyles.labels}>
                  {key}
                </Text>
                <Pressable
                  onPress={copyKey}
                  style={({ pressed }) => [
                    styles.buttons,
                    {
                      backgroundColor: colors.accent,
                      flexDirection: "row",
                      justifyContent: "center",
                      width: "100%",
                      marginTop: 20,
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <CopyIcon color="white" />
                  <Text style={sharedStyles.labels}>Copy</Text>
                </Pressable>
              </View>
            )}
          </View>
          <View style={[styles.buttonsWrapper, reqPending && { opacity: 0.5 }]}>
            {!keyCreated ? (
              <>
                <Pressable
                  disabled={reqPending}
                  style={({ pressed }) => [
                    styles.buttons,
                    (reqPending || pressed) && { opacity: 0.7 },
                  ]}
                  onPress={close}
                >
                  <Text style={[sharedStyles.labels, { color: colors.textMuted }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  disabled={reqPending || keyCreated}
                  onPress={createKey}
                  style={({ pressed }) => [
                    styles.buttons,
                    { backgroundColor: colors.accent },
                    (reqPending || pressed || keyCreated) && { opacity: 0.7 },
                  ]}
                >
                  <Text style={[sharedStyles.labels]}>Create</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={close}
                style={({ pressed }) => [
                  styles.buttons,
                  { backgroundColor: colors.accent },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[sharedStyles.labels]}>Close</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
        <Toaster theme="dark" />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  apiKeysModal: {
    position: "absolute",
    zIndex: 5,
    backgroundColor: "rgba(0,0,0,.7)",
    alignItems: "center",
  },
  keyForm: {
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
    flexDirection: "row",
    marginTop: 25,
    marginHorizontal: "auto",
    gap: 20,
    justifyContent: "flex-end",
    width: "100%",
    paddingHorizontal: 10,
  },
  buttons: {
    width: 90,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 50,
  },
});
