import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import WebView, { WebViewMessageEvent } from "react-native-webview";
import { colors } from "@/constants/theme";

const SITE_KEY = process.env.EXPO_PUBLIC_TUNRSTILE_KEY ?? "";
const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background-color: transparent;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    </style>
  </head>
  <body>
    <div
      class="cf-turnstile"
      data-sitekey="${SITE_KEY}"
      data-theme="dark"
      data-callback="onVerify"
      data-error-callback="onError"
      data-expired-callback="onExpire"
    ></div>
    <script>
      function onVerify(token) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ event: "verify", token }));
      }
      function onError() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ event: "error" }));
      }
      function onExpire() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ event: "expire" }));
      }
    </script>
  </body>
</html>
`;

export interface TurnstileHandle {
  reset: () => void;
}

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
}

const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(({ onVerify, onError }, ref) => {
  const webViewRef = useRef<WebView>(null);
  const [key, setKey] = useState(0);

  useImperativeHandle(ref, () => ({
    reset: () => setKey(prev => prev + 1),
  }));

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.event === "verify") {
        onVerify(data.token);
      } else if (data.event === "error" || data.event === "expire") {
        onError?.();
      }
    } catch {
      onError?.();
    }
  }

  return (
    <View style={styles.wrapper}>
      <WebView
        key={key}
        ref={webViewRef}
        source={{ html, baseUrl: "https://pulse.velovix.com" }}
        onMessage={handleMessage}
        style={styles.webview}
        scrollEnabled={false}
        originWhitelist={["*"]}
        domStorageEnabled
        thirdPartyCookiesEnabled
      />
    </View>
  );
});
Turnstile.displayName = "Turnstile";

export default Turnstile;

const styles = StyleSheet.create({
  wrapper: {
    height: 70,
    width: "100%",
    backgroundColor: colors.card,
  },
  webview: {
    backgroundColor: "transparent",
  },
});
