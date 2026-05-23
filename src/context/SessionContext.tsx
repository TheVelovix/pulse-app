"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "expo-router";
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

interface SessionContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
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

  async function fetchSession() {
    try {
      const { accessToken, refreshToken } = await getTokens();
      let res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Device-Type": "mobile",
        },
      });

      if (res.status === 401) {
        const refreshRes = await fetch("/api/refresh", {
          method: "POST",
          headers: {
            RefreshToken: refreshToken!,
            "X-Device-Type": "mobile",
          },
        });
        if (refreshRes.ok) {
          const data = await res.json();
          await setTokens(data.accessToken, data.refreshToken);
          res = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${data.accessToken}`,
              "X-Device-Type": "mobile",
            },
          });
        } else {
          setUser(null);
          return;
        }
      }

      if (res.ok) {
        const data = await res.json();
        setUser(data);
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

  async function login(credentials: { email: string; password: string }) {
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
    console.log(res);
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
      await fetchSession();
      toast("Login successful!");
      setTimeout(() => router.replace("/(tabs)/Dashboard"), 1000);
    }
  }

  async function logout() {
    const { accessToken, refreshToken } = await getTokens();

    await fetch("/api/auth/logout", {
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
      value={{ user, loading, login, logout, refetch: fetchSession }}
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
