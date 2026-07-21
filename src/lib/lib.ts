import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { toast } from "sonner-native";

export async function getTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync("accessToken"),
    SecureStore.getItemAsync("refreshToken"),
  ]);
  return { accessToken, refreshToken };
}
export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync("accessToken", accessToken),
    SecureStore.setItemAsync("refreshToken", refreshToken),
  ]);
}

export async function fetchWithAuth(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const { accessToken, refreshToken } = await getTokens();
  if (!accessToken || !refreshToken) toast.error("You're not signed in to make this request.");
  const options = {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
      refreshToken: refreshToken!,
      "X-Device-Type": "mobile",
    },
  };
  let res = await fetch(input, options);
  if (res.status === 401) {
    const refreshRes = await fetch(`${process.env.EXPO_PUBLIC_BACKEND}/api/refresh`, {
      method: "POST",
      headers: options.headers,
    });
    if (!refreshRes.ok) {
      router.replace("/Login");
      return res;
    }
    res = await fetch(input, options);
  }
  return res;
}

export function parseMonth(month: number) {
  switch (month) {
    case 0:
      return "Jan";
    case 1:
      return "Feb";
    case 2:
      return "March";
    case 3:
      return "Apr";
    case 4:
      return "May";
    case 5:
      return "June";
    case 6:
      return "July";
    case 7:
      return "Aug";
    case 8:
      return "Sep";
    case 9:
      return "Oct";
    case 10:
      return "Nov";
    case 11:
      return "Dec";
  }
}
