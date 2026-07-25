import { fetchWithAuth, parseMonth, useTypedParams } from "@/lib/lib";
import { AnalyticsResult } from "@/types/Analytics";
import { ProjectDetailsParams } from "@/types/NavParams";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { toast } from "sonner-native";
import { Skeleton } from "boneyard-js/native";
import { sharedStyles } from "@/constants/commonStyles";
import { CalendarIcon, CopyIcon } from "phosphor-react-native";
import { colors } from "@/constants/theme";
import * as Clipboard from "expo-clipboard";
import { SubscriptionPlan, useSession } from "@/context/SessionContext";
import DateRangePicker from "@/components/DateRangePicker";
import CopyScriptModal from "@/components/CopyScriptModal";

async function getProjectAnalytics(
  id: string,
  days?: number,
  from?: Date,
  to?: Date,
): Promise<AnalyticsResult | null> {
  try {
    const res = await fetchWithAuth(`${process.env.EXPO_PUBLIC_BACKEND}/api/analytics/${id}`);
    if (!res.ok) {
      if (res.status === 404) toast.error("Project not found.");
      else toast.error("Project details request failed.");
      return null;
    } else {
      const data: AnalyticsResult = await res.json();
      return data;
    }
  } catch {
    toast.error("Failed to fetch project details.");
    return null;
  }
}
const DATE_RANGES = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "All time", value: undefined },
];
export default function ProjectDetails() {
  const params = useTypedParams<ProjectDetailsParams>();
  const [days, setDays] = useState<number | undefined>(30);
  const [from, setFrom] = useState<Date | undefined>(undefined);
  const [to, setTo] = useState<Date | undefined>(undefined);
  const [analytics, setAnalytics] = useState<AnalyticsResult>();
  const loading = true;
  // const [loading, startTransition] = useTransition();
  const session = useSession();
  // useEffect(() => {
  //   startTransition(async () => {
  //     const data = await getProjectAnalytics(params.id, days, from, to);
  //     if (data) {
  //       setAnalytics(data);
  //     }
  //   });
  //   if (days && (from || to)) {
  //     setFrom(undefined);
  //     setTo(undefined);
  //   }
  // }, [days, from, to]);
  async function copyPublicLink() {
    if (Platform.OS === "ios") {
      await Clipboard.setUrlAsync(
        `https://pulse.velovix.com/public-dashboard/${params.publicSlug}`,
      );
    } else {
      await Clipboard.setStringAsync(
        `https://pulse.velovix.com/public-dashboard/${params.publicSlug}`,
      );
    }
    toast.success("Public link copied.");
  }
  const [showDatePicker, setShowDatePicker] = useState(false);
  const fetchAnalyticsFromRange = useCallback(async (startDate: Date, endDate: Date) => {
    setFrom(startDate);
    setTo(endDate);
    setDays(undefined);
    setShowDatePicker(false);
  }, []);
  const [showCopyScript, setShowCopyScript] = useState(false);
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 15 }}>
      <Skeleton name="project-details" loading={loading}>
        <Text style={sharedStyles.title}>{params.name} Analyitcs</Text>
        {params.isPublic === "true" && (
          <>
            <Text style={sharedStyles.title}>Public slug: {params.publicSlug}</Text>
            <Pressable
              onPress={copyPublicLink}
              style={({ pressed }) => [
                sharedStyles.cards,
                { flexDirection: "row", alignItems: "center", gap: 10, marginRight: "auto" },
                pressed && { backgroundColor: colors.background },
              ]}
            >
              <CopyIcon color="white" />
              <Text style={sharedStyles.labels}>Copy Public Link</Text>
            </Pressable>
          </>
        )}
      </Skeleton>

      {/*Date Filters*/}
      <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
        {DATE_RANGES.map((range, index) => {
          if (range.label === "All time" && session.user?.subscriptionPlan !== SubscriptionPlan.PRO)
            return;
          return (
            <Pressable
              key={index}
              style={({ pressed }) => [
                sharedStyles.cards,
                pressed && { backgroundColor: colors.background },
                days === range.value && !from && { backgroundColor: colors.accent },
              ]}
              onPress={() => {
                setDays(range.value);
                if (range.label === "All time") {
                  setFrom(undefined);
                  setTo(undefined);
                }
              }}
            >
              <Text style={sharedStyles.labels}>{range.label}</Text>
            </Pressable>
          );
        })}

        <Pressable
          style={({ pressed }) => [
            sharedStyles.cards,
            pressed && { backgroundColor: colors.background },
            { flexDirection: "row", alignItems: "center", gap: 5 },
            from && { backgroundColor: colors.accent },
          ]}
          onPress={() => setShowDatePicker(true)}
        >
          <CalendarIcon color="white" />
          {!from && <Text style={sharedStyles.labels}>Custom range</Text>}
          {from && (
            <Text style={sharedStyles.labels}>
              {parseMonth(from.getMonth())} {from.getDate()} - {parseMonth(to!.getMonth())}{" "}
              {to!.getDate()}
            </Text>
          )}
        </Pressable>
      </View>
      <DateRangePicker
        isVisible={showDatePicker}
        minimumDate={new Date(params.createdAt)}
        maximumDate={new Date()}
        submitDate={fetchAnalyticsFromRange}
        close={() => setShowDatePicker(false)}
      />
      <CopyScriptModal
        isVisible={showCopyScript}
        close={() => setShowCopyScript(false)}
        projectId={params.id}
      />
    </ScrollView>
  );
}
