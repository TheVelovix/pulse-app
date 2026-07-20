import { authStyles } from "@/constants/commonStyles";
import { useSession } from "@/context/SessionContext";
import { useRouter } from "expo-router";
import { useState, useTransition } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import * as z from "zod";

const SignupBody = z.object({
  email: z.email({ error: "Invalid email" }),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters long" })
    .refine((val) => /[A-Z]/.test(val), {
      error: "Password must contain at least one uppercase letter",
    })
    .refine((val) => /[^a-zA-Z0-9]/.test(val), {
      error: "Password must contain at least one special character",
    }),
});
export default function SignUp() {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    promotionalCode: "",
  });
  function updateCredentials(key: string, value: string) {
    setCredentials((prev) => ({
      ...prev,
      [key]: value,
    }));
    if (error) setError("");
  }
  const router = useRouter();
  const session = useSession();
  const [requestPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  function handleSignUp() {
    startTransition(async () => {
      if (
        !credentials.email ||
        !credentials.password ||
        !credentials.confirmPassword
      ) {
        setError("Please fill out the form.");
        return;
      }
      if (credentials.password !== credentials.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (error) setError("");
      try {
        SignupBody.parse(credentials);
        await session.signup(credentials);
      } catch (e) {
        if (e instanceof z.ZodError) {
          setError(e.issues[0].message);
        } else if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }
  return (
    <KeyboardAvoidingView behavior="padding">
      <ScrollView>
        <View style={authStyles.form}>
          <Text style={authStyles.title}>Create Account</Text>
          <View style={authStyles.inputsWrapper}>
            <View>
              <Text style={authStyles.labels}>Email</Text>
              <TextInput
                value={credentials.email}
                style={authStyles.inputs}
                onChangeText={(newVal) => updateCredentials("email", newVal)}
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
                onChangeText={(newVal) => updateCredentials("password", newVal)}
                placeholderTextColor="#ffffff67"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            <View>
              <Text style={authStyles.labels}>Confirm Password</Text>
              <TextInput
                value={credentials.confirmPassword}
                style={authStyles.inputs}
                onChangeText={(newVal) =>
                  updateCredentials("confirmPassword", newVal)
                }
                placeholderTextColor="#ffffff67"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            <View>
              <Text style={authStyles.labels}>Promotional Code (Optional)</Text>
              <TextInput
                value={credentials.promotionalCode}
                style={authStyles.inputs}
                onChangeText={(newVal) =>
                  updateCredentials("promotionalCode", newVal)
                }
                placeholderTextColor="#ffffff67"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>
          <View style={styles.tosWrapper}>
            <Text style={styles.tosMain}>
              By continuing you agree to our{" "}
              <Text
                style={styles.underlined}
                onPress={() => router.push("/Tos")}
              >
                Terms of Service
              </Text>
              ,{" "}
              <Text
                style={styles.underlined}
                onPress={() => router.push("/PrivacyPolicy")}
              >
                Privacy Policy
              </Text>{" "}
              and{" "}
              <Text
                style={styles.underlined}
                onPress={() => router.push("/RefundPolicy")}
              >
                Refund Policy
              </Text>
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleSignUp}
            disabled={requestPending}
            style={[authStyles.authButton, requestPending && { opacity: 0.7 }]}
          >
            <Text style={[authStyles.buttonLabels, { fontSize: 18 }]}>
              {!requestPending ? "Sign Up" : "Signing up..."}
            </Text>
          </TouchableOpacity>
          {error && <Text style={authStyles.error}>{error}</Text>}

          <View style={authStyles.br} />
          <Text style={[authStyles.labels, { textAlign: "center" }]}>
            Already have an account?{" "}
            <Text
              disabled={requestPending}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.push("/Login");
                }
              }}
              style={authStyles.links}
            >
              Log in
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tosWrapper: {
    marginTop: 10,
  },
  tosMain: {
    color: "rgba(120, 120, 120)",
    textAlign: "center",
    lineHeight: 20,
  },
  underlined: {
    textDecorationLine: "underline",
  },
});
