import { colors } from "@/constants/theme";
import { fetchWithAuth } from "@/lib/lib";
import { NewEmailFormProps } from "@/types/Profile";
import { EnvelopeIcon } from "phosphor-react-native";
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
const emailSchema = z.email("Invalid Email Address.");
export default function NewEmailForm({ isVisible, close }: NewEmailFormProps) {
  const dimensions = useWindowDimensions();
  const [newEmail, setNewEmail] = useState("");
  const [reqPending, startTransition] = useTransition();
  const [codeSent, setCodeSent] = useState(false);
  function requestEmailChange() {
    startTransition(async () => {
      try {
        emailSchema.parse(newEmail);
        const res = await fetchWithAuth(
          `${process.env.EXPO_PUBLIC_BACKEND}/api/auth/requestEmailChange`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: newEmail,
            }),
          },
        );
        if (!res.ok) {
          if (res.headers.get("Content-Type")?.includes("text/plain")) {
            const text = await res.text();
            if (text === "email-in-use") {
              toast.error("Email in use.");
            }
          }
        } else {
          toast.success("Code sent to new email.");
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
  const [verificationCode, setVerificationCode] = useState("");
  function confirmEmailChange() {
    startTransition(async () => {
      try {
        const res = await fetchWithAuth(
          `${process.env.EXPO_PUBLIC_BACKEND}/api/auth/confirmEmailChange?code=${verificationCode}`,
          {
            method: "PATCH",
          },
        );
        if (!res.ok) {
          if (res.headers.get("Content-Type")?.includes("text/plain")) {
            const text = await res.text();
            if (text === "invalid-code") {
              toast.error("Invalid code.");
            } else if (text === "code-expired") {
              toast.error("This code has expired.");
            }
          }
        } else {
          toast.success("Email changed successfully.");
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
      setCodeSent(false);
      setNewEmail("");
      setVerificationCode("");
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
      <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.emailModal}>
        <Animated.View entering={FlipInXUp} exiting={FlipOutXUp} style={styles.newEmailForm}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {/*Envelope*/}
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
              <EnvelopeIcon color={colors.accent} />
            </View>
            <View style={{ maxWidth: "80%" }}>
              <Text style={styles.title}> Change Email</Text>
              <Text style={[styles.labels, { textAlign: "center" }]}>
                {!codeSent
                  ? "Enter your new email address. We'll send you a verification code."
                  : `We just sent a code to ${newEmail}, enter it below to verify it.`}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 20 }}>
            {!codeSent ? (
              <>
                <Text style={styles.subLabel}>New email address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email address here..."
                  value={newEmail}
                  onChangeText={newVal => {
                    setNewEmail(newVal);
                  }}
                  onSubmitEditing={requestEmailChange}
                  autoCapitalize="none"
                  editable={!reqPending}
                />
              </>
            ) : (
              <>
                <Text style={styles.subLabel}>Verification code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Verification code here..."
                  value={verificationCode}
                  onChangeText={newVal => {
                    setVerificationCode(newVal);
                  }}
                  onSubmitEditing={confirmEmailChange}
                  editable={!reqPending}
                />
              </>
            )}
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
              onPress={!codeSent ? requestEmailChange : confirmEmailChange}
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
  emailModal: {
    position: "absolute",
    zIndex: 5,
    height: dvh,
    width: dvw,
    backgroundColor: "rgba(0,0,0,.7)",
    alignItems: "center",
  },
  newEmailForm: {
    width: "90%",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.2)",
    borderRadius: 10,
    padding: 15,
    marginTop: "35%",
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
