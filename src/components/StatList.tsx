import { sharedStyles } from "@/constants/commonStyles";
import { colors } from "@/constants/theme";
import { getFaviconUrl } from "@/lib/lib";
import { flag, name } from "country-emoji";
import { GlobeIcon, Icon } from "phosphor-react-native";
import { useCallback, useState } from "react";
import { Image, Platform, ScrollView, StyleSheet, Text, ToastAndroid, View } from "react-native";

function Favicon({ referrerUrl, size = 16 }: { referrerUrl: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const uri = getFaviconUrl(referrerUrl);

  if (!uri || failed) {
    return <GlobeIcon size={size} color={colors.textMuted} />;
  }

  return (
    <Image source={{ uri }} style={{ width: size, height: size }} onError={() => setFailed(true)} />
  );
}

export default function StatList({
  title,
  items,
}: {
  title: string;
  items: { label: string; count: number }[];
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const showAndroidToast = useCallback((label: string) => {
    if (Platform.OS !== "android") return;
    ToastAndroid.showWithGravity(label, ToastAndroid.SHORT, ToastAndroid.BOTTOM);
  }, []);
  return (
    <View style={[sharedStyles.cards, styles.container]}>
      <Text style={[sharedStyles.labelsMuted, styles.title]}>{title}</Text>
      {items.length === 0 ? (
        <Text style={[sharedStyles.labelsMuted, styles.emptyLabel]}>No data</Text>
      ) : (
        <ScrollView style={styles.list} nestedScrollEnabled>
          {items.map((item, i) => {
            const isReferrers = title.includes("Referrers");
            return (
              <View key={i} style={styles.row}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      { width: `${total > 0 ? (item.count / total) * 100 : 0}%` },
                    ]}
                  />
                  {!isReferrers ? (
                    <Text
                      onPress={() => showAndroidToast(item.label)}
                      style={[sharedStyles.labels, styles.label]}
                      numberOfLines={1}
                    >
                      {title === "Countries"
                        ? `${flag(item.label)} ${name(item.label)}`
                        : item.label}
                    </Text>
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center", paddingLeft: 5 }}>
                      <Favicon referrerUrl={item.label} />
                      <Text
                        onPress={() => showAndroidToast(item.label)}
                        style={[sharedStyles.labels, styles.label]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[sharedStyles.labelsMuted, styles.count]}>{item.count}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 350,
  },
  title: {
    fontSize: 13,
    marginBottom: 16,
  },
  emptyLabel: {
    fontSize: 12,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  barWrapper: {
    position: "relative",
    flex: 1,
    marginRight: 16,
    justifyContent: "center",
  },
  bar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.accentTransparent,
    borderRadius: 4,
  },
  label: {
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  count: {
    fontSize: 14,
  },
});
