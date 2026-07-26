import { sharedStyles } from "@/constants/commonStyles";
import { GoogleSearchConsoleData } from "@/types/Analytics";
import { StyleSheet, Text, View, ScrollView } from "react-native";

export default function SearchConsoleList({ data }: { data: GoogleSearchConsoleData[] }) {
  return (
    <View style={sharedStyles.cards}>
      <Text style={[sharedStyles.labelsMuted, styles.title]}>
        Search Queries (Google Search Console)
      </Text>
      {data.length === 0 ? (
        <Text style={[sharedStyles.labelsMuted, styles.emptyLabel]}>No data</Text>
      ) : (
        <View style={styles.list}>
          <ScrollView style={{ flex: 1 }} nestedScrollEnabled>
            {data.map((item, i) => (
              <View key={i} style={styles.row}>
                <Text style={[sharedStyles.labels, styles.query]} numberOfLines={2}>
                  {item.query}
                </Text>
                <View style={styles.stats}>
                  <Text style={[sharedStyles.labelsMuted, styles.statLabel]}>
                    {item.clicks} clicks
                  </Text>
                  <Text style={[sharedStyles.labelsMuted, styles.statLabel]}>
                    {item.impressions} impressions
                  </Text>
                  <Text style={[sharedStyles.labelsMuted, styles.statLabel]}>{item.ctr}% CTR</Text>
                  <Text style={[sharedStyles.labelsMuted, styles.statLabel]}>
                    #{item.position} pos
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 13,
    marginBottom: 16,
  },
  emptyLabel: {
    fontSize: 12,
  },
  list: {
    gap: 12,
    height: 350,
  },
  row: {
    gap: 4,
  },
  query: {
    fontSize: 14,
  },
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 4,
    columnGap: 12,
  },
  statLabel: {
    fontSize: 12,
  },
});
