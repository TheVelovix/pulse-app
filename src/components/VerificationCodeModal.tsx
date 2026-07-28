import { colors } from "@/constants/theme";
import { sharedStyles } from "@/constants/commonStyles";
import { useSession } from "@/context/SessionContext";
import Turnstile, { TurnstileHandle } from "@/components/Turnstile";
import { EnvelopeIcon } from "phosphor-react-native";
import { useEffect, useRef, useState, useTransition } from "react";
import { Modal, StyleSheet, useWindowDimensions, View, Text, Pressable } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import Animated, { FadeIn, FadeOut, FlipInXUp, FlipOutXUp } from "react-native-reanimated";
import { toast, Toaster } from "sonner-native";
import { useTablet } from "@/context/TabletContext";

interface VerificationCodeModalProps {
  isVisible: boolean;
  close: () => void;
  email: string;
  password: string;
  confirmPassword: string;
  promotionalCode: string;
}

export default function VerificationCodeModal({
  isVisible,
  close,
  email,
  password,
  confirmPassword,
  promotionalCode,
}: VerificationCodeModalProps) {
  const dimensions = useWindowDimensions();
  const session = useSession();
  const [reqPending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileHandle>(null);

  function confirmSignup() {
    startTransition(async () => {
      try {
        if (!code) {
          toast.error("Please enter the verification code.");
          return;
        }
        if (!turnstileToken) {
          toast.error("Please complete the verification challenge.");
          return;
        }
        await session.signup(
          {
            email,
            password,
            confirmPassword,
            promotionalCode,
            verificationCode: code,
          },
          turnstileToken,
        );
        close();
      } catch (e) {
        if (e instanceof Error) {
          toast.error(e.message);
        } else {
          toast.error("Something went wrong.");
        }
        setTurnstileToken("");
        turnstileRef.current?.reset();
      }
    });
  }

  useEffect(() => {
    if (!isVisible) {
      // Cleanup
      setCode("");
      setTurnstileToken("");
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
        style={[styles.codeModal, { width: dimensions.width, height: dimensions.height }]}
      >
        <Animated.View
          entering={FlipInXUp}
          exiting={FlipOutXUp}
          style={[
            styles.codeForm,
            isTablet && isLandscape && { marginTop: "5%", width: "50%" },
            isTablet && !isLandscape && { marginTop: "15%", width: "70%" },
          ]}
        >
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
              <Text style={styles.title}>Confirm your email</Text>
              <Text style={[sharedStyles.labels]}>
                We just sent a code to {email}, enter it below to finish creating your account.
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 20 }}>
            <Text style={sharedStyles.labelsMuted}>Verification Code</Text>
            <TextInput
              style={styles.input}
              placeholder="000000"
              value={code}
              onChangeText={setCode}
              autoCapitalize="none"
              editable={!reqPending}
              keyboardType="numeric"
              placeholderTextColor="#ffffff45"
            />
          </View>

          <View style={{ marginTop: 20 }}>
            <Turnstile
              ref={turnstileRef}
              onVerify={setTurnstileToken}
              onError={() => setTurnstileToken("")}
            />
          </View>

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
              onPress={confirmSignup}
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
  codeModal: {
    position: "absolute",
    zIndex: 5,
    backgroundColor: "rgba(0,0,0,.7)",
    alignItems: "center",
  },
  codeForm: {
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
