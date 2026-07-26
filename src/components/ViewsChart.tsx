import { sharedStyles } from "@/constants/commonStyles";
import { colors } from "@/constants/theme";
import { useFont } from "@shopify/react-native-skia";
import { StyleSheet, Text, View } from "react-native";
import { CartesianChart, Line } from "victory-native";

export default function ViewsChart({ data }: { data: { date: string; count: number }[] }) {
  const font = useFont(require("../fonts/Poppins-Regular.ttf"), 11);

  return (
    <View style={sharedStyles.cards}>
      <Text style={[sharedStyles.labelsMuted, styles.title]}>Views per day</Text>
      {data.length === 0 ? (
        <Text style={[sharedStyles.labelsMuted, styles.emptyLabel]}>No data</Text>
      ) : (
        <View style={styles.chart}>
          <CartesianChart
            data={data}
            xKey="date"
            yKeys={["count"]}
            domainPadding={{ left: 16, right: 16, top: 16 }}
            axisOptions={{
              font,
              labelColor: colors.textMuted,
              lineColor: {
                grid: colors.textMutedTransparent,
                frame: "transparent",
              },
              formatXLabel: value =>
                new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            }}
          >
            {({ points }) => (
              <Line
                points={points.count}
                color={colors.accent}
                strokeWidth={2}
                curveType="monotoneX"
                animate={{ type: "timing", duration: 300 }}
              />
            )}
          </CartesianChart>
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
  chart: {
    height: 250,
  },
});
