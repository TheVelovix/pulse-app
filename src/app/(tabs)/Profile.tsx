import { StyleSheet, View, Text, Pressable, ScrollView, Linking } from "react-native";
import { colors } from "@/constants/theme";
import { sharedStyles } from "@/constants/commonStyles";
import { useSession } from "@/context/SessionContext";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner-native";
import { capitalize, fetchWithAuth } from "@/lib/lib";
import NewEmailForm from "@/components/NewEmailForm";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import AccountDeletionModal from "@/components/AccountDeletionModal";
import { CrownIcon, KeyIcon, LightningIcon, PlusIcon, TrashIcon } from "phosphor-react-native";
import { RefreshControl } from "react-native-gesture-handler";
import { ApiKey } from "@/types/Profile";
import ApiKeysModal from "@/components/ApiKeysModal";
import { useTablet } from "@/context/TabletContext";
import BackButton from "@/components/BackButton";

const store = process.env.EXPO_PUBLIC_STORE;
export default function Profile() {
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
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await session.refetch();
    setRefreshing(false);
  }, []);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const fetchApiKeys = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${process.env.EXPO_PUBLIC_BACKEND}/api/user/apiKeys`);
      if (!res.ok) {
        toast.error("API Keys request failed.");
        return;
      }
      const keys: { name: string; createdAt: string }[] = await res.json();
      setApiKeys(keys.map(key => ({ name: key.name, createdAt: new Date(key.createdAt) })));
    } catch {
      toast.error("Could not fetch API Keys.");
    }
  }, [session]);
  useEffect(() => {
    fetchApiKeys();
  }, []);
  const [showApiKeysModal, setShowApiKeysModal] = useState(false);
  const hideApiKeysModal = useCallback(async () => {
    setShowApiKeysModal(false);
    await fetchApiKeys();
  }, []);
  const deleteKey = useCallback(async (keyName: string) => {
    const keysBackup = [...apiKeys];
    setApiKeys(prev => prev.filter(item => item.name !== keyName));
    const res = await fetchWithAuth(
      `${process.env.EXPO_PUBLIC_BACKEND}/api/user/apiKeys?name=${keyName}`,
      {
        method: "DELETE",
      },
    );
    if (!res.ok) {
      toast.error("Failed to delete key.");
      setApiKeys(keysBackup);
    } else {
      toast.success("Key Deleted.");
    }
  }, []);
  const { isTablet, isLandscape } = useTablet();
  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: "black",
          paddingHorizontal: 15,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <BackButton />
        <Text style={sharedStyles.title}>Account</Text>
        <Text style={sharedStyles.labelsMuted}>Manage your account and subscription.</Text>
        <View style={sharedStyles.cards}>
          <Text style={[sharedStyles.subTitles, { marginBottom: 15 }]}>Profile</Text>
          <View>
            <View style={styles.userProps}>
              <Text style={sharedStyles.labels}>{session.user?.email}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.buttons,
                  reqPending && { opacity: 0.5 },
                  pressed && { backgroundColor: colors.background },
                ]}
                disabled={reqPending}
                onPress={() => setShowEmailChangeModal(true)}
              >
                <Text style={sharedStyles.labelsMuted}>Change Email</Text>
              </Pressable>
            </View>

            <View style={[styles.userProps, reqPending && { opacity: 0.5 }]}>
              <View>
                <Text style={[sharedStyles.labels, styles.centeredLabel]}>Other Devices</Text>
                <Text style={[sharedStyles.labelsMuted, styles.centeredLabel]}>
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
                <Text style={[sharedStyles.labelsMuted]}>Log out other devices</Text>
              </Pressable>
            </View>

            <View style={styles.userProps}>
              <View>
                <Text style={[sharedStyles.labels, styles.centeredLabel]}>Password</Text>
                <Text style={[sharedStyles.labelsMuted, styles.centeredLabel]}>
                  We&apos;ll email you a code to confirm before changing your password.
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
                <Text style={[sharedStyles.labelsMuted]}>Change Password</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/*Subscription Info*/}
        <View style={sharedStyles.cards}>
          <Text style={sharedStyles.subTitles}>Plan</Text>

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
                <Text style={sharedStyles.labels}>
                  {capitalize(session.user?.subscriptionPlan ?? "")}
                </Text>
                {session.user && (
                  <Text style={sharedStyles.labelsMuted}>
                    {session.user.subscriptionPlan === "free"
                      ? "5 projects · 30 days retention"
                      : "Unlimited projects · 24 months retention"}
                  </Text>
                )}
              </View>
            </View>
          </View>
          {session.user && session?.user?.subscriptionPlan === "pro" && store !== "f-droid" && (
            <Pressable
              style={({ pressed }) => [
                styles.buttons,
                { borderColor: colors.textMuted, marginHorizontal: "auto", marginTop: 20 },
                pressed && { backgroundColor: colors.textMutedTransparent },
              ]}
            >
              <Text style={[sharedStyles.labels, { color: colors.textMuted }]}>
                Cancel Subscription
              </Text>
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
                <Text style={[sharedStyles.labels, { fontFamily: "Poppins-Medium" }]}>
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
              >
                <Text style={[sharedStyles.labels, { fontFamily: "Poppins-Medium" }]}>
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
              <Text style={[sharedStyles.labels, { fontFamily: "Poppins-Medium" }]}>
                Manage your subscription
              </Text>
            </Pressable>
          )}
        </View>

        {session.user && session.user.subscriptionPlan === "pro" && (
          <View style={[sharedStyles.cards, { height: 350 }]}>
            <Text style={[sharedStyles.subTitles, { marginBottom: 15 }]}>API Keys</Text>
            {apiKeys.length > 0 && (
              <ScrollView style={{ flex: 1 }} nestedScrollEnabled>
                {apiKeys.map((item, index) => {
                  return (
                    <View
                      key={`${item.name}-${index}`}
                      style={[
                        sharedStyles.cards,
                        {
                          backgroundColor: colors.background,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        },
                      ]}
                    >
                      <View style={{ maxWidth: "85%" }}>
                        <Text style={sharedStyles.labels}>{item.name}</Text>
                        <Text style={sharedStyles.labelsMuted}>
                          Created {item.createdAt.getDate()}/{item.createdAt.getMonth() + 1}/
                          {item.createdAt.getFullYear()}
                        </Text>
                      </View>
                      <Pressable
                        style={({ pressed }) => [styles.buttons, pressed && { opacity: 0.7 }]}
                        onPress={() => deleteKey(item.name)}
                      >
                        <TrashIcon color={colors.textMuted} />
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            )}
            {apiKeys.length === 0 && (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <KeyIcon color={colors.textMuted} />
                  <Text style={sharedStyles.labelsMuted}>No API keys yet.</Text>
                </View>
              </View>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.buttons,
                pressed && { backgroundColor: colors.background },
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 40,
                },
              ]}
              onPress={() => setShowApiKeysModal(true)}
            >
              <PlusIcon color="white" />
              <Text style={[sharedStyles.labels]}>New Key</Text>
            </Pressable>
          </View>
        )}

        <View style={[sharedStyles.cards, { borderColor: colors.destructive }]}>
          <Text style={[sharedStyles.subTitles, { color: colors.destructive }]}>Danger Zone</Text>

          <View style={{ marginTop: 10 }}>
            <Text style={sharedStyles.labels}>Delete account</Text>
            <Text style={sharedStyles.labelsMuted}>
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
            <Text style={[sharedStyles.labels, { color: colors.destructive }]}>Delete account</Text>
          </Pressable>
        </View>

        <NewEmailForm isVisible={showEmailChangeModal} close={hideEmailForm} />
        <ChangePasswordForm isVisible={showPasswordChangeModal} close={hidePasswordForm} />
        <AccountDeletionModal
          isVisible={showAccountDeletionModal}
          close={hideAccountDeletionModal}
        />
        {session.user && session.user.subscriptionPlan === "pro" && (
          <ApiKeysModal isVisible={showApiKeysModal} close={hideApiKeysModal} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
