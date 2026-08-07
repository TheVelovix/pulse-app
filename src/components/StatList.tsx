import { sharedStyles } from "@/constants/commonStyles";
import { colors } from "@/constants/theme";
import { getFaviconUrl } from "@/lib/lib";
import { flag, name } from "country-emoji";
import { GlobeIcon, Icon } from "phosphor-react-native";
import { useCallback } from "react";
import { Image, Platform, ScrollView, StyleSheet, Text, ToastAndroid, View } from "react-native";

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
            let ReferrerIcon: string | Icon | undefined;
            if (title.includes("Referrers")) {
              ReferrerIcon = getFaviconUrl(item.label) ?? GlobeIcon;
            }
            return (
              <View key={i} style={styles.row}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      { width: `${total > 0 ? (item.count / total) * 100 : 0}%` },
                    ]}
                  />
                  {!title.includes("Referrers") ? (
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
                    <View style={{ flexDirection: "row", paddingLeft: 5 }}>
                      {ReferrerIcon ? (
                        typeof ReferrerIcon === "string" ? (
                          <Image
                            src={getFaviconUrl(item.label)}
                            style={{ width: 24, height: 24 }}
                          />
                        ) : (
                          <ReferrerIcon />
                        )
                      ) : (
                        <GlobeIcon />
                      )}
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
