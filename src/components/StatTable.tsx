import { sharedStyles } from "@/constants/commonStyles";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { normalizeOsKey, osIcons } from "@/lib/lib";
import { Globe, GlobeIcon } from "phosphor-react-native";
import { normalize } from "zod";

export default function StatTable<T extends Record<string, string | number | boolean | null>>({
  title,
  items,
  columns,
}: {
  title: string;
  items: T[];
  columns: { key: keyof T; label: string }[];
}) {
  return (
    <View style={[sharedStyles.cards, styles.container]}>
      <Text style={[sharedStyles.labelsMuted, styles.title]}>{title}</Text>
      {items.length === 0 ? (
        <Text style={[sharedStyles.labelsMuted, styles.emptyLabel]}>No data</Text>
      ) : (
        <ScrollView horizontal>
          <View style={{ minWidth: "100%" }}>
            <View style={[styles.row, styles.headerRow]}>
              {columns.map(col => (
                <Text key={String(col.key)} style={[sharedStyles.labelsMuted, styles.headerCell]}>
                  {col.label}
                </Text>
              ))}
            </View>
            <ScrollView style={styles.body}>
              {items.map((item, i) => (
                <View key={i} style={[styles.row, i !== items.length - 1 && styles.bodyRow]}>
                  {columns.map(col => {
                    const Icon =
                      col.key === "os"
                        ? (osIcons[normalizeOsKey(String(item[col.key]))] ?? GlobeIcon)
                        : null;
                    return (
                      <View
                        key={String(col.key)}
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        {Icon && <Icon color="white" />}
                        <Text style={[sharedStyles.labels, styles.cell]}>
                          {col.key === "isSpider"
                            ? item[col.key]
                              ? "Yes"
                              : "No"
                            : String(item[col.key] ?? "-")}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 500,
  },
  title: {
    fontSize: 13,
    marginBottom: 16,
  },
  emptyLabel: {
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
  },
  headerRow: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    paddingBottom: 8,
  },
  bodyRow: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  body: {
    flexGrow: 0,
  },
  headerCell: {
    fontSize: 12,
    minWidth: 150,
    paddingRight: 16,
  },
  cell: {
    fontSize: 14,
    minWidth: 150,
    maxWidth: 150,
    paddingRight: 16,
    paddingVertical: 8,
  },
});
