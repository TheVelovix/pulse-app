import { colors } from "@/constants/theme";
import { useSession } from "@/context/SessionContext";
import { fetchWithAuth } from "@/lib/lib";
import { ProfileFormProps } from "@/types/Profile";
import { TrashIcon, WarningDiamondIcon } from "phosphor-react-native";
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

const dvh = Dimensions.get("window").height;
const dvw = Dimensions.get("window").width;

export default function AccountDeletionModal({ isVisible, close }: ProfileFormProps) {
  const dimensions = useWindowDimensions();
  const [reqPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const session = useSession();
  function confirmDeletion() {
    if (email !== session.user?.email) {
      toast.error("Incorrect email.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetchWithAuth(
          `${process.env.EXPO_PUBLIC_BACKEND}/api/user/delete-account`,
          {
            method: "DELETE",
          },
        );
        if (!res.ok) {
          toast.error("Something went wrong.");
        } else {
          toast.success("Account deleted.");
          setTimeout(async () => {
            await session.logout();
          }, 700);
        }
      } catch {
        toast.error("Something went wrong.");
      }
    });
  }
  useEffect(() => {
    if (!isVisible) {
      // Cleanup
      setEmail("");
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
      <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.accountModal}>
        <Animated.View entering={FlipInXUp} exiting={FlipOutXUp} style={styles.deleteAccountForm}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {/*Danger*/}
            <View
              style={{
                backgroundColor: colors.destructiveTransparent,
                width: 40,
                height: 40,
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <WarningDiamondIcon color={colors.destructive} />
            </View>
            <View style={{ maxWidth: "80%" }}>
              <Text style={styles.title}>Delete Account</Text>
              <Text style={[styles.labels]}>
                There is no going back. This will permanently delete your account, all projects, and
                all analytics data.
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 20 }}>
            <Text style={styles.subLabel}>
              Type{" "}
              <Text style={{ color: "white", fontFamily: "Poppins-Medium" }}>
                {session.user?.email}
              </Text>{" "}
              to confirm
            </Text>
            <TextInput
              style={styles.input}
              placeholder={session.user?.email}
              value={email}
              onChangeText={newVal => {
                setEmail(newVal);
              }}
              autoCapitalize="none"
              editable={!reqPending}
              keyboardType="numeric"
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
              onPress={confirmDeletion}
              style={({ pressed }) => [
                styles.buttons,
                {
                  backgroundColor: colors.destructive,
                  width: "auto",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 10,
                },
                (reqPending || pressed) && { opacity: 0.7 },
              ]}
            >
              <TrashIcon color={"white"} />
              <Text style={[styles.labels]}>Delete my account</Text>
            </Pressable>
          </View>
        </Animated.View>
        <Toaster />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  accountModal: {
    position: "absolute",
    zIndex: 5,
    height: dvh,
    width: dvw,
    backgroundColor: "rgba(0,0,0,.7)",
    alignItems: "center",
  },
  deleteAccountForm: {
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
