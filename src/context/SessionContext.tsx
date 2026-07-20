"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "expo-router";
import { toast } from "sonner-native";
import { getTokens, setTokens } from "../lib/lib";

export enum SubscriptionPlan {
  FREE = "free",
  PRO = "pro",
}

interface User {
  id: string;
  email: string;
  subscriptionPlan: SubscriptionPlan;
}

interface LoginBody {
  email: string;
  password: string;
}

interface SignUpBody {
  confirmPassword: string;
  promotionalCode?: string;
}

interface SessionContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginBody) => Promise<void>;
  signup: (credentials: SignUpBody) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | null>(null);

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  async function fetchSession() {
    try {
      const { accessToken, refreshToken } = await getTokens();
      let res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Device-Type": "mobile",
        },
      });
      if (res.status === 401 && refreshToken) {
        const refreshRes = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND}/api/refresh`,
          {
            method: "POST",
            headers: {
              RefreshToken: refreshToken,
              "X-Device-Type": "mobile",
            },
          },
        );
        if (refreshRes.ok) {
          const data = await res.json();
          await setTokens(data.accessToken, data.refreshToken);
          res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${data.accessToken}`,
              "X-Device-Type": "mobile",
            },
          });
        } else {
          // If refresh token auth fails the user object can still have data on it so set it to null
          setUser(null);
          return;
        }
      }
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        if (
          pathname === "/Login" ||
          pathname === "/Signup" ||
          pathname === "/"
        ) {
          router.replace("/(tabs)/Dashboard");
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSession();
  }, []);

  async function login(credentials: LoginBody) {
    const res = await fetch(
      `${process.env.EXPO_PUBLIC_BACKEND}/api/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Type": "mobile",
        },
        body: JSON.stringify(credentials),
      },
    );
    if (!res.ok) {
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("text/plain")) {
        const message = await res.text();
        if (message === "invalid-credentials" || message === "captcha-failed")
          throw new Error(message);
      } else {
        toast.error("Unknown error occurred.");
      }
    } else {
      const data: { accessToken: string; refreshToken: string } =
        await res.json();
      await setTokens(data.accessToken, data.refreshToken);
      await fetchSession();
      toast.success("Login successful!");
      setTimeout(() => router.replace("/(tabs)/Dashboard"), 1000);
    }
  }
  async function signup(credentials: SignUpBody) {
    const res = await fetch(
      `${process.env.EXPO_PUBLIC_BACKEND}/api/auth/signup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Type": "mobile",
        },
        body: JSON.stringify({ ...credentials, turnstileToken: "" }),
      },
    );
    if (!res.ok) {
      const contentType = res.headers.get("Content-Type") ?? "";
      if (contentType.includes("text/plain")) {
        const responseText = await res.text();
        switch (responseText) {
          case "invalid-email":
            throw new Error("Invalid email address.");
          case "user-already-exists":
            throw new Error("Email already in use.");
          case "captcha-failed":
            throw new Error("CAPTCHA verification failed. Please try again.");
          case "invalid-promotional-code":
            throw new Error("Invalid Promotional Code");
          default:
            throw new Error("Unknown error occurred.");
        }
      } else if (contentType.includes("application/problem+json")) {
        const problem = await res.json();
        const messages: string[] = problem.errors
          ? Object.values(problem.errors as Record<string, string[]>).flat()
          : [];
        throw new Error(
          messages[0] ?? problem.title ?? "Unknown error occurred.",
        );
      } else {
        throw new Error("Unknown error occurred.");
      }
    } else {
      toast("Account created successfully!");
      const data = await res.json();
      await setTokens(data.accessToken, data.refreshToken);
      await fetchSession();
      router.replace("/Dashboard");
    }
  }
  async function logout() {
    const { accessToken, refreshToken } = await getTokens();

    await fetch(`${process.env.EXPO_PUBLIC_BACKEND}/api/auth/logout`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        RefreshToken: refreshToken!,
        "X-Device-Type": "mobile",
      },
    });
    setUser(null);
    router.replace("/Login");
  }

  return (
    <SessionContext.Provider
      value={{ user, loading, login, logout, refetch: fetchSession, signup }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context)
    throw new Error("useSession must be used within SessionProvider");
  return context;
}
