import { authStyles } from "@/constants/commonStyles";
import { useSession } from "@/context/SessionContext";
import { useTablet } from "@/context/TabletContext";
import { useRouter } from "expo-router";
import { useState, useTransition } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LogIn() {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  function updateCredentials(key: string, value: string) {
    setCredentials(prev => ({
      ...prev,
      [key]: value,
    }));
    if (error) setError("");
  }
  const router = useRouter();
  const session = useSession();
  const [requestPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  function handleLogin() {
    startTransition(async () => {
      if (!credentials.email || !credentials.password) {
        setError("Invalid credentials.");
        return;
      }
      try {
        await session.login({
          email: credentials.email,
          password: credentials.password,
        });
      } catch (e) {
        if (e instanceof Error) {
          if (e.message === "invalid-credentials") {
            setError("Invalid credentials.");
          }
        }
      }
    });
  }
  const { isTablet, isLandscape } = useTablet();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior="padding">
      <ScrollView>
        <View
          style={[
            authStyles.form,
            isTablet && isLandscape && { width: "50%", marginTop: insets.top },
          ]}
        >
          <Text style={authStyles.title}>Enter your credentials</Text>
          <View style={authStyles.inputsWrapper}>
            <View>
              <Text style={authStyles.labels}>Email</Text>
              <TextInput
                value={credentials.email}
                style={authStyles.inputs}
                onChangeText={newVal => updateCredentials("email", newVal)}
                placeholder="Email here..."
                placeholderTextColor="#ffffff67"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View>
              <Text style={authStyles.labels}>Password</Text>
              <TextInput
                value={credentials.password}
                style={authStyles.inputs}
                onChangeText={newVal => updateCredentials("password", newVal)}
                placeholder="Password here..."
                placeholderTextColor="#ffffff67"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={requestPending}
            style={[authStyles.authButton, requestPending && { opacity: 0.7 }]}
          >
            <Text style={[authStyles.buttonLabels, { fontSize: 18 }]}>
              {!requestPending ? "Log in" : "Logging in..."}
            </Text>
          </TouchableOpacity>
          {error && <Text style={authStyles.error}>{error}</Text>}

          <View style={authStyles.br} />
          <Text style={[authStyles.labels, { textAlign: "center" }]}>
            Don&apos;t have an account?{" "}
            <Text
              disabled={requestPending}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.push("/Signup");
                }
              }}
              style={authStyles.links}
            >
              Sign up
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
