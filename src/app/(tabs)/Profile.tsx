import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, View, Text, Pressable, ScrollView } from "react-native";
import { colors } from "@/constants/theme";
import { useSession } from "@/context/SessionContext";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner-native";
import { fetchWithAuth } from "@/lib/lib";
import NewEmailForm from "@/components/NewEmailForm";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const session = useSession();
  const [reqPending, startTransition] = useTransition();
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  // function requestEmailChange(){
  //   try{
  //     const res = await fetchWithAuth(`${process.env.EXPO_PUBLIC_BACKEND}/api/auth/requestEmailChange`, {
  //       method:"PATCH"
  //     })
  //   }
  //   catch{
  //     toast.error("Something went wrong.")
  //   }
  // }
  function logOutOtherDevices() {
    startTransition(async () => {
      try {
        const res = await fetchWithAuth(
          `${process.env.EXPO_PUBLIC_BACKEND}/api/auth/logOutOtherDevices`,
          {
            method: "DELETE",
          },
        );
        if (!res.ok) {
          toast.error("Something went wrong.");
          return;
        }
        toast.success("Successfully logged out other devices.");
      } catch {
        toast.error("Something went wrong.");
      }
    });
  }
  const hideEmailForm = useCallback(() => setShowEmailChangeModal(false), []);
  return (
    <ScrollView
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        backgroundColor: "black",
        paddingHorizontal: 15,
      }}
    >
      <Text style={styles.title}>Account</Text>
      <Text style={styles.labelsMuted}>Manage your account and subscription.</Text>
      <View style={styles.cards}>
        <Text style={[styles.subTitles, { marginBottom: 15 }]}>Profile</Text>
        <View>
          <View style={styles.userProps}>
            <Text style={styles.labels}>{session.user?.email}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.buttons,
                reqPending && { opacity: 0.5 },
                pressed && { backgroundColor: colors.background },
              ]}
              disabled={reqPending}
              onPress={() => setShowEmailChangeModal(true)}
            >
              <Text style={styles.labelsMuted}>Change Email</Text>
            </Pressable>
          </View>

          <View style={[styles.userProps, reqPending && { opacity: 0.5 }]}>
            <View>
              <Text style={[styles.labels, styles.centeredLabel]}>Other Devices</Text>
              <Text style={[styles.labelsMuted, styles.centeredLabel]}>
                Log out of all sessions except this one.
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.buttons,
                pressed && { backgroundColor: colors.background },
              ]}
              disabled={reqPending}
              onPress={logOutOtherDevices}
            >
              <Text style={[styles.labelsMuted]}>Log out other devices</Text>
            </Pressable>
          </View>

          <View style={styles.userProps}>
            <View>
              <Text style={[styles.labels, styles.centeredLabel]}>Password</Text>
              <Text style={[styles.labelsMuted, styles.centeredLabel]}>
                We&apos;ll email you a code to confirm before changin your password.
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.buttons,
                reqPending && { opacity: 0.5 },
                pressed && { backgroundColor: colors.background },
              ]}
              disabled={reqPending}
            >
              <Text style={[styles.labelsMuted]}>Change Password</Text>
            </Pressable>
          </View>
        </View>
      </View>
      <NewEmailForm isVisible={showEmailChangeModal} close={hideEmailForm} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    color: "white",
    fontSize: 22,
    fontFamily: "Poppins-Bold",
  },
  labels: {
    color: "white",
    fontFamily: "Poppins-Regular",
  },
  labelsMuted: {
    color: colors.textMuted,
    fontFamily: "Poppins-Regular",
  },
  subTitles: {
    color: "white",
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
  },
  cards: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 10,
    marginVertical: 10,
  },
  userProps: {
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 15,
    gap: 10,
  },
  buttons: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.2)",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  centeredLabel: {
    textAlign: "center",
  },
});
