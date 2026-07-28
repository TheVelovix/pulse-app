import { colors } from "@/constants/theme";
import { sharedStyles } from "@/constants/commonStyles";
import { ProfileFormProps } from "@/types/Profile";
import { LockIcon } from "phosphor-react-native";
import { useEffect, useState, useTransition } from "react";
import { Modal, StyleSheet, useWindowDimensions, View, Text, Pressable } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import Animated, { FadeIn, FadeOut, FlipInXUp, FlipOutXUp } from "react-native-reanimated";
import { toast, Toaster } from "sonner-native";
import * as z from "zod";
import { useTablet } from "@/context/TabletContext";

const emailSchema = z.email("Invalid Email Address.");
const passwordSchema = z
  .string()
  .min(8, { error: "Password must be at least 8 characters long" })
  .refine(val => /[A-Z]/.test(val), {
    error: "Password must contain at least one uppercase letter",
  })
  .refine(val => /[^a-zA-Z0-9]/.test(val), {
    error: "Password must contain at least one special character",
  });

export default function ResetPasswordModal({ isVisible, close }: ProfileFormProps) {
  const dimensions = useWindowDimensions();
  const [reqPending, startTransition] = useTransition();
  const [codeSent, setCodeSent] = useState(false);
  const [email, setEmail] = useState("");
  const [body, setBody] = useState({
    code: "",
    password: "",
    confirmPassword: "",
  });

  function requestReset() {
    startTransition(async () => {
      try {
        emailSchema.parse(email);
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND}/api/auth/reset-password?email=${encodeURIComponent(email)}`,
          { method: "POST" },
        );
        if (!res.ok) {
          toast.error("Failed to initiate password reset.");
        } else {
          toast.success("If an account exists for that email, a code was sent.");
          setCodeSent(true);
        }
      } catch (e) {
        if (e instanceof z.ZodError) {
          toast.error(e.issues[0].message);
        } else {
          toast.error("Something went wrong.");
        }
      }
    });
  }

  function confirmReset() {
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
        const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND}/api/auth/reset-password`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: body.code,
            newPassword: body.password,
          }),
        });
        if (!res.ok) {
          if (res.headers.get("Content-Type")?.includes("text/plain")) {
            const text = await res.text();
            if (text === "invalid-code") {
              toast.error("Invalid or expired code.");
            } else {
              toast.error("Something went wrong.");
            }
          } else {
            toast.error("Something went wrong.");
          }
        } else {
          toast.success("Password reset successfully.");
          setTimeout(close, 700);
        }
      } catch (e) {
        if (e instanceof z.ZodError) {
          toast.error(e.issues[0].message);
        } else {
          toast.error("Something went wrong.");
        }
      }
    });
  }

  useEffect(() => {
    if (!isVisible) {
      // Cleanup
      setCodeSent(false);
      setEmail("");
      setBody({ code: "", password: "", confirmPassword: "" });
    }
  }, [isVisible]);
  const { isTablet, isLandscape } = useTablet();
  return (
    <Modal
      visible={isVisible}
      supportedOrientations={["portrait", "landscape"]}
      style={{
        height: dimensions.height,
        width: dimensions.width,
        backgroundColor: "rgba(0,0,0,.7)",
      }}
    >
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={[styles.resetModal, { width: dimensions.width, height: dimensions.height }]}
      >
        <Animated.View
          entering={FlipInXUp}
          exiting={FlipOutXUp}
          style={[
            styles.resetForm,
            isTablet && isLandscape && { marginTop: "5%", width: "50%" },
            isTablet && !isLandscape && { marginTop: "15%", width: "70%" },
          ]}
        >
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
              <Text style={styles.title}>Reset Password</Text>
              <Text style={[sharedStyles.labels]}>
                {!codeSent
                  ? "Enter your email address. \nWe'll send you a code to reset your password."
                  : `We just sent a code to ${email}, enter it below along with your new password.`}
              </Text>
            </View>
          </View>

          {!codeSent ? (
            <View style={{ marginTop: 20 }}>
              <Text style={sharedStyles.labelsMuted}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Email address here..."
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={requestReset}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!reqPending}
                placeholderTextColor="#ffffff45"
              />
            </View>
          ) : (
            <>
              <View style={{ marginTop: 20 }}>
                <Text style={sharedStyles.labelsMuted}>Verification Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="000000"
                  value={body.code}
                  onChangeText={newVal => setBody(prev => ({ ...prev, code: newVal }))}
                  autoCapitalize="none"
                  editable={!reqPending}
                  keyboardType="numeric"
                  placeholderTextColor="#ffffff45"
                />
              </View>
              <View style={{ marginTop: 20 }}>
                <Text style={sharedStyles.labelsMuted}>New password</Text>
                <TextInput
                  style={styles.input}
                  value={body.password}
                  onChangeText={newVal => setBody(prev => ({ ...prev, password: newVal }))}
                  autoCapitalize="none"
                  editable={!reqPending}
                  secureTextEntry
                  placeholderTextColor="#ffffff45"
                />
              </View>
              <View style={{ marginTop: 20 }}>
                <Text style={sharedStyles.labelsMuted}>Confirm new password</Text>
                <TextInput
                  style={styles.input}
                  value={body.confirmPassword}
                  onChangeText={newVal => setBody(prev => ({ ...prev, confirmPassword: newVal }))}
                  onSubmitEditing={confirmReset}
                  autoCapitalize="none"
                  editable={!reqPending}
                  secureTextEntry
                  placeholderTextColor="#ffffff45"
                />
              </View>
            </>
          )}
          <View style={[styles.buttonsWrapper, reqPending && { opacity: 0.5 }]}>
            <Pressable
              disabled={reqPending}
              style={({ pressed }) => [styles.buttons, (reqPending || pressed) && { opacity: 0.7 }]}
              onPress={close}
            >
              <Text style={[sharedStyles.labels, { color: colors.textMuted }]}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={reqPending}
              onPress={!codeSent ? requestReset : confirmReset}
              style={({ pressed }) => [
                styles.buttons,
                {
                  backgroundColor: pressed ? colors.accentHover : colors.accent,
                },
                reqPending && { opacity: 0.7 },
              ]}
            >
              <Text style={[sharedStyles.labels]}>Submit</Text>
            </Pressable>
          </View>
        </Animated.View>
        <Toaster theme="dark" />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  resetModal: {
    position: "absolute",
    zIndex: 5,
    backgroundColor: "rgba(0,0,0,.7)",
    alignItems: "center",
  },
  resetForm: {
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
