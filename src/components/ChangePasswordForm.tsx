import { colors } from "@/constants/theme";
import { fetchWithAuth } from "@/lib/lib";
import { ProfileFormProps } from "@/types/Profile";
import { LockIcon } from "phosphor-react-native";
import { useEffect, useState, useTransition } from "react";
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
import * as z from "zod";

const dvh = Dimensions.get("window").height;
const dvw = Dimensions.get("window").width;
const passwordSchema = z
  .string()
  .min(8, { error: "Password must be at least 8 characters long" })
  .refine(val => /[A-Z]/.test(val), {
    error: "Password must contain at least one uppercase letter",
  })
  .refine(val => /[^a-zA-Z0-9]/.test(val), {
    error: "Password must contain at least one special character",
  });

export default function ChangePasswordForm({ isVisible, close }: ProfileFormProps) {
  const dimensions = useWindowDimensions();
  const [reqPending, startTransition] = useTransition();
  const [body, setBody] = useState({
    code: "",
    password: "",
    confirmPassword: "",
  });

  function confirmPasswordChange() {
    startTransition(async () => {
      try {
        if (!body.code || !body.password || !body.confirmPassword) {
          toast.error("Incomplete form.");
          return;
        }
        if (body.password !== body.confirmPassword) {
          toast.error("Passwords do not match.");
          return;
        }
        passwordSchema.parse(body.password);
        const res = await fetchWithAuth(
          `${process.env.EXPO_PUBLIC_BACKEND}/api/auth/reset-password`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: body.code,
              newPassword: body.password,
            }),
          },
        );
        if (!res.ok) {
          if (res.headers.get("Content-Type")?.includes("text/plain")) {
            const text = await res.text();
            if (text === "invalid-code") {
              toast.error("Invalid code.");
            }
          }
        } else {
          toast.success("Password changed successfully.");
          setTimeout(close, 700);
        }
      } catch {
        toast.error("Something went wrong.");
      }
    });
  }
  useEffect(() => {
    if (!isVisible) {
      // Cleanup
      setBody({
        code: "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [isVisible]);
  return (
    <Modal
      visible={isVisible}
      style={{
        height: dimensions.height,
        width: dimensions.width,
        backgroundColor: "rgba(0,0,0,.7)",
      }}
    >
      <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.passwordModal}>
        <Animated.View entering={FlipInXUp} exiting={FlipOutXUp} style={styles.newPasswordForm}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {/*Lock*/}
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
              <LockIcon color={colors.accent} />
            </View>
            <View style={{ maxWidth: "80%" }}>
              <Text style={styles.title}>Change Password</Text>
              <Text style={[styles.labels]}>
                We just sent a code to your email, enter it below.
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 20 }}>
            <Text style={styles.subLabel}>Verification Code</Text>
            <TextInput
              style={styles.input}
              placeholder="000000"
              value={body.code}
              onChangeText={newVal => {
                setBody(prev => ({ ...prev, code: newVal }));
              }}
              autoCapitalize="none"
              editable={!reqPending}
              keyboardType="numeric"
            />
          </View>
          <View style={{ marginTop: 20 }}>
            <Text style={styles.subLabel}>New password</Text>
            <TextInput
              style={styles.input}
              value={body.password}
              onChangeText={newVal => {
                setBody(prev => ({ ...prev, password: newVal }));
              }}
              autoCapitalize="none"
              editable={!reqPending}
              secureTextEntry={true}
            />
          </View>
          <View style={{ marginTop: 20 }}>
            <Text style={styles.subLabel}>Confirm new password</Text>
            <TextInput
              style={styles.input}
              value={body.confirmPassword}
              onChangeText={newVal => {
                setBody(prev => ({ ...prev, confirmPassword: newVal }));
              }}
              onSubmitEditing={confirmPasswordChange}
              autoCapitalize="none"
              editable={!reqPending}
              secureTextEntry={true}
            />
          </View>
          <View style={[styles.buttonsWrapper, reqPending && { opacity: 0.5 }]}>
            <Pressable
              disabled={reqPending}
              style={({ pressed }) => [styles.buttons, (reqPending || pressed) && { opacity: 0.7 }]}
              onPress={close}
            >
              <Text style={[styles.labels, { color: colors.textMuted }]}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={reqPending}
              onPress={confirmPasswordChange}
              style={({ pressed }) => [
                styles.buttons,
                {
                  backgroundColor: pressed ? colors.accentHover : colors.accent,
                },
                reqPending && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.labels]}>Submit</Text>
            </Pressable>
          </View>
        </Animated.View>
        <Toaster />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  passwordModal: {
    position: "absolute",
    zIndex: 5,
    height: dvh,
    width: dvw,
    backgroundColor: "rgba(0,0,0,.7)",
    alignItems: "center",
  },
  newPasswordForm: {
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
  labels: {
    fontFamily: "Poppins-Regular",
    color: "white",
  },
  subLabel: {
    fontFamily: "Poppins-Regular",
    color: colors.textMuted,
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
