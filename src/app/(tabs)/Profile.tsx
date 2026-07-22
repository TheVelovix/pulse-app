import { StyleSheet, View, Text, Pressable, ScrollView, Linking } from "react-native";
import { colors } from "@/constants/theme";
import { useSession } from "@/context/SessionContext";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner-native";
import { capitalize, fetchWithAuth } from "@/lib/lib";
import NewEmailForm from "@/components/NewEmailForm";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import AccountDeletionModal from "@/components/AccountDeletionModal";
import { CrownIcon, LightningIcon } from "phosphor-react-native";

const store = process.env.EXPO_PUBLIC_STORE;
export default function Profile() {
  // const insets = useSafeAreaInsets();
  const session = useSession();
  const [reqPending, startTransition] = useTransition();
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
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
  const hidePasswordForm = useCallback(() => setShowPasswordChangeModal(false), []);
  const requestPasswordChange = useCallback(() => {
    startTransition(async () => {
      try {
        const res = await fetchWithAuth(
          `${process.env.EXPO_PUBLIC_BACKEND}/api/auth/reset-password?email=${session.user?.email}`,
          {
            method: "POST",
          },
        );
        if (!res.ok) {
          toast.error("Failed to initiate password reset.");
        } else {
          toast.success("Password reset code sent to Email.");
          setShowPasswordChangeModal(true);
        }
      } catch {
        toast.error("Failed to initiate password reset.");
      }
    });
  }, [session.user]);
  const [showAccountDeletionModal, setShowAccountDeletionModal] = useState(false);
  const hideAccountDeletionModal = useCallback(() => setShowAccountDeletionModal(false), []);
  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <ScrollView
        style={{
          flex: 1,
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
                onPress={requestPasswordChange}
              >
                <Text style={[styles.labelsMuted]}>Change Password</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/*Subscription Info*/}
        <View style={styles.cards}>
          <Text style={styles.subTitles}>Plan</Text>

          <View style={{ marginTop: 10, flexDirection: "row" }}>
            <View style={{ flexDirection: "row" }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor:
                    session.user?.subscriptionPlan === "pro"
                      ? colors.accentTransparent
                      : colors.textMutedTransparent,
                  marginRight: 10,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 10,
                }}
              >
                {session.user && session.user.subscriptionPlan === "free" ? (
                  <LightningIcon color={colors.textMuted} />
                ) : (
                  <CrownIcon color={colors.accent} />
                )}
              </View>
              <View>
                <Text style={styles.labels}>
                  {capitalize(session.user?.subscriptionPlan ?? "")}
                </Text>
                {session.user && (
                  <Text style={styles.labelsMuted}>
                    {session.user.subscriptionPlan === "free"
                      ? "5 projects · 30 days retention"
                      : "Unlimited projects · 24 months retention"}
                  </Text>
                )}
              </View>
            </View>
          </View>
          {session.user && session?.user?.subscriptionPlan === "pro" && (
            <Pressable
              style={({ pressed }) => [
                styles.buttons,
                { borderColor: colors.textMuted, marginHorizontal: "auto", marginTop: 20 },
                pressed && { backgroundColor: colors.textMutedTransparent },
              ]}
            >
              <Text style={[styles.labels, { color: colors.textMuted }]}>Cancel Subscription</Text>
            </Pressable>
          )}
          {session.user && session?.user?.subscriptionPlan === "free" && store !== "f-droid" ? (
            <>
              <Pressable
                style={({ pressed }) => [
                  styles.buttons,
                  {
                    borderWidth: 0,
                    marginHorizontal: "auto",
                    marginTop: 20,
                    backgroundColor: colors.accent,
                  },
                  pressed && { backgroundColor: colors.accentHover },
                ]}
              >
                <Text style={[styles.labels, { fontFamily: "Poppins-Medium" }]}>
                  Upgrade to Pro
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.buttons,
                  {
                    borderWidth: 0,
                    marginHorizontal: "auto",
                    marginTop: 20,
                    backgroundColor: "black",
                  },
                  pressed && { backgroundColor: "rgba(0,0,0,.2)" },
                ]}
                // onPress={() => setShowAccountDeletionModal(true)}
              >
                <Text style={[styles.labels, { fontFamily: "Poppins-Medium" }]}>
                  Activate Promo Code
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.buttons,
                {
                  borderWidth: 0,
                  marginHorizontal: "auto",
                  marginTop: 20,
                  backgroundColor: colors.accent,
                },
                pressed && { backgroundColor: colors.accentHover },
              ]}
              onPress={() => Linking.openURL("https://pulse.velovix.com/dashboard/account")}
            >
              <Text style={[styles.labels, { fontFamily: "Poppins-Medium" }]}>
                Manage your subscription
              </Text>
            </Pressable>
          )}
        </View>

        <View style={[styles.cards, { borderColor: colors.destructive }]}>
          <Text style={[styles.subTitles, { color: colors.destructive }]}>Danger Zone</Text>

          <View style={{ marginTop: 10 }}>
            <Text style={styles.labels}>Delete account</Text>
            <Text style={styles.labelsMuted}>
              Permanently remove your account and all data. This cannot be undone.
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.buttons,
              { borderColor: colors.destructive, marginRight: "auto", marginTop: 20 },
              pressed && { backgroundColor: colors.destructiveTransparent },
            ]}
            onPress={() => setShowAccountDeletionModal(true)}
          >
            <Text style={[styles.labels, { color: colors.destructive }]}>Delete account</Text>
          </Pressable>
        </View>

        <NewEmailForm isVisible={showEmailChangeModal} close={hideEmailForm} />
        <ChangePasswordForm isVisible={showPasswordChangeModal} close={hidePasswordForm} />
        <AccountDeletionModal
          isVisible={showAccountDeletionModal}
          close={hideAccountDeletionModal}
        />
      </ScrollView>
    </View>
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
