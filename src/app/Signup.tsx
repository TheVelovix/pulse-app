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
import { toast } from "sonner-native";

export default function SignUp() {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    confirmPassword:"",
    promotionalCode:"",
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
      if (!credentials.email || !credentials.password || !credentials.confirmPassword) {
        setError("Please fill out the form.");
        return;
      }
      if(credentials.password !== credentials.confirmPassword){
        setError("Passwords do not match.");
        return;
      }
      if(error) setError("");
      try{
        const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND}/api/auth/signup`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Device-Type":"mobile" },
              body: JSON.stringify({ ...credentials, turnstileToken:"" }),
            });
        if (!res.ok) {
          const contentType = res.headers.get("Content-Type") ?? "";
          if (contentType.includes("text/plain")) {
            const responseText = await res.text();
            switch (responseText) {
              case "invalid-email":
                setError("Invalid email address.");
                break;
              case "user-already-exists":
                setError("Email already in use.");
                break;
              case "captcha-failed":
                setError("CAPTCHA verification failed. Please try again.");
                break;
              case "invalid-promotional-code":
                setError("Invalid Promotional Code");
                break;
              default:
                setError("Unknown error occurred.");
            }
          } else if (contentType.includes("application/problem+json")) {
            const problem = await res.json();
            const messages: string[] = problem.errors
              ? Object.values(problem.errors as Record<string, string[]>).flat()
              : [];
            setError(messages[0] ?? problem.title ?? "Unknown error occurred.");
          } else {
            setError("Unknown error occurred.");
          }
        } else {
          toast("Account created successfully!");
          await session.refetch();
          router.replace("/Dashboard")
          }
      }catch(e){
        console.log(e)
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
                onChangeText={(newVal) => updateCredentials("confirmPassword", newVal)}
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
                onChangeText={(newVal) => updateCredentials("promotionalCode", newVal)}
                placeholderTextColor="#ffffff67"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>
          <View style={styles.tosWrapper}>
            <Text style={styles.tosMain}>By continuing you agree to our {" "}
              <Text style={styles.underlined} onPress={() => router.push("/Tos")}>Terms of Service</Text>, {" "}
              <Text style={styles.underlined} onPress={() => router.push("/PrivacyPolicy")}>Privacy Policy</Text> and {" "}
              <Text style={styles.underlined} onPress={() => router.push("/RefundPolicy")}>Refund Policy</Text>
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
  tosWrapper:{
    marginTop:10,
  },
  tosMain:{
    color:'rgba(120, 120, 120)',
    textAlign:'center',
    lineHeight:20
  },
  underlined:{
    textDecorationLine:"underline"
  },
})
