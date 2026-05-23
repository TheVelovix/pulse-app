import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";

export async function getTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync("accessToken"),
    SecureStore.getItemAsync("refreshToken"),
  ]);
  return { accessToken, refreshToken };
}
export async function setTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync("accessToken", accessToken),
    SecureStore.setItemAsync("refreshToken", refreshToken),
  ]);
}

export async function fetchWithAuth(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const router = useRouter();
  const { accessToken, refreshToken } = await getTokens();
  const options = {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      RefreshToken: refreshToken!,
      "X-Device-Type": "mobile",
    },
  };

  let res = await fetch(input, options);

  if (res.status === 401) {
    const refreshRes = await fetch("/api/refresh", {
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
