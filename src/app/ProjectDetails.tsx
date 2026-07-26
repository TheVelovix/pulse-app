import { fetchWithAuth, getTokens, parseMonth, useTypedParams } from "@/lib/lib";
import { AnalyticsResult, GoogleSearchConsoleData } from "@/types/Analytics";
import { ProjectDetailsParams } from "@/types/NavParams";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { toast } from "sonner-native";
import { Skeleton } from "boneyard-js/native";
import { sharedStyles } from "@/constants/commonStyles";
import { CalendarIcon, CopyIcon, ExportIcon } from "phosphor-react-native";
import { colors } from "@/constants/theme";
import * as Clipboard from "expo-clipboard";
import { SubscriptionPlan, useSession } from "@/context/SessionContext";
import DateRangePicker from "@/components/DateRangePicker";
import CopyScriptModal from "@/components/CopyScriptModal";
import BackButton from "@/components/BackButton";
import { Directory } from "expo-file-system";
import EventSource from "react-native-sse";
import StatList from "@/components/StatList";
import StatTable from "@/components/StatTable";
import SearchConsoleList from "@/components/SearchConsoleList";

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
async function getSearchConsoleData(
  projectId: string,
  days?: number,
): Promise<GoogleSearchConsoleData[]> {
  try {
    const params = new URLSearchParams();
    if (days) params.set("days", days.toString());
    const res = await fetchWithAuth(
      `${process.env.EXPO_PUBLIC_BACKEND}/api/search-console/${projectId}?${params.toString()}`,
    );
    if (res.ok) {
      const data = await res.json();
      return data;
    }
    return [];
  } catch (e) {
    console.log(e);
    toast.error("Failed to fetch Search Console Data.");
    return [];
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
  const [analytics, setAnalytics] = useState<AnalyticsResult>({
    totalViews: 0,
    viewsPerDay: [],
    topPages: [],
    outboundLinks: [],
    topReferrers: [],
    aiTraffic: [],
    devices: [],
    browsers: [],
    countries: [],
    operatingSystems: [],
    uniqueVisitors: 0,
    bounceRate: 0,
    entryPages: [],
    timeOnPage: [],
    utmStats: {
      topSources: [],
      topMediums: [],
      topCampaigns: [],
      topContents: [],
      topTerms: [],
    },
    customEvents: [],
  });
  const [loading, startTransition] = useTransition();
  const session = useSession();
  useEffect(() => {
    startTransition(async () => {
      const data = await getProjectAnalytics(params.id, days, from, to);
      if (data) {
        setAnalytics(data);
      }
    });
    if (days && (from || to)) {
      setFrom(undefined);
      setTo(undefined);
    }
  }, [days, from, to]);
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
  const exportCsv = useCallback(async () => {
    try {
      const reqParams = new URLSearchParams();
      if (from && to) {
        reqParams.set("from", from.toDateString());
        reqParams.set("to", to.toDateString());
      } else if (days) {
        reqParams.set("days", days.toString());
      }
      const query = reqParams.size > 0 ? reqParams.toString() : "";
      const res = await fetchWithAuth(
        `${process.env.EXPO_PUBLIC_BACKEND}/api/analytics/${params.id}/export?${query}`,
      );
      if (!res.ok) {
        const contentType = res.headers.get("Content-Type");
        if (contentType && contentType.includes("text/plain")) {
          const text = await res.text();
          toast.error(text);
        } else {
          toast.error("Export request failed.");
        }
        return;
      }
      const dir = await Directory.pickDirectoryAsync();
      const csvText = await res.text();
      const fileName = `${params.name}-analytics.csv`;
      const file = dir.createFile(fileName, "text/csv");
      file.write(csvText);
      toast.success("CSV Exported");
    } catch (e) {
      console.log(e);
      toast.error("Failed to export CSV.");
    }
  }, []);
  const [liveVisitors, setLiveVisitors] = useState<number>(0);
  const [searchConsoleData, setSearchConsoleData] = useState<GoogleSearchConsoleData[]>([]);
  useEffect(() => {
    if (session.user?.subscriptionPlan !== SubscriptionPlan.PRO) return;
    let eventSource: EventSource;
    (async () => {
      const { accessToken, refreshToken } = await getTokens();
      eventSource = new EventSource(
        `${process.env.EXPO_PUBLIC_BACKEND}/api/analytics/${params.id}/live`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            RefreshToken: refreshToken!,
            "X-Device-Type": "mobile",
          },
        },
      );

      eventSource.addEventListener("message", e => {
        setLiveVisitors(parseInt(e.data!));
      });

      eventSource.addEventListener("error", () => {
        eventSource.close();
      });
      const googleData = await getSearchConsoleData(params.id);
      setSearchConsoleData(googleData);
    })();

    return () => eventSource?.close();
  }, []);
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 15 }}>
      <BackButton />
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
      <Skeleton name="filter-buttons" loading={loading}>
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          {DATE_RANGES.map((range, index) => {
            if (
              range.label === "All time" &&
              session.user?.subscriptionPlan !== SubscriptionPlan.PRO
            )
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
      </Skeleton>

      {/*Buttons*/}
      <Skeleton name="project-buttons" loading={loading}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around" }}>
          <Pressable
            onPress={() => setShowCopyScript(true)}
            style={[styles.buttons, sharedStyles.cards]}
          >
            <CopyIcon color="white" />
            <Text style={sharedStyles.labels}>Copy Script</Text>
          </Pressable>

          {session.user?.subscriptionPlan === SubscriptionPlan.PRO && (
            <Pressable onPress={exportCsv} style={[styles.buttons, sharedStyles.cards]}>
              <ExportIcon color="white" />
              <Text style={sharedStyles.labels}>Export CSV</Text>
            </Pressable>
          )}
        </View>
      </Skeleton>

      <Skeleton name="main-stats" loading={loading}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around" }}>
          <View style={sharedStyles.cards}>
            <Text style={sharedStyles.labelsMuted}>Total Views</Text>
            <Text style={sharedStyles.title}>{analytics?.totalViews}</Text>
          </View>
          <View style={sharedStyles.cards}>
            <Text style={sharedStyles.labelsMuted}>Unique Visitors</Text>
            <Text style={sharedStyles.title}>{analytics?.uniqueVisitors}</Text>
          </View>
          <View style={sharedStyles.cards}>
            <Text style={sharedStyles.labelsMuted}>Bounce Rate</Text>
            <Text style={sharedStyles.title}>{(analytics?.bounceRate ?? 0 * 100).toFixed(1)}%</Text>
          </View>
          {session.user?.subscriptionPlan === SubscriptionPlan.PRO && (
            <View style={sharedStyles.cards}>
              <Text style={sharedStyles.labelsMuted}>Live Views</Text>
              <Text style={sharedStyles.title}>{liveVisitors}</Text>
            </View>
          )}
        </View>
      </Skeleton>

      <Skeleton name="analytics-cards" loading={loading}>
        <StatList
          title="Entry Pages"
          items={analytics.entryPages.map(p => ({
            label: p.url,
            count: p.count,
          }))}
        />
        <StatList
          title="Top Pages"
          items={analytics.topPages.map(p => ({
            label: p.url,
            count: p.count,
          }))}
        />
        {session.user?.subscriptionPlan === SubscriptionPlan.PRO && (
          <StatList
            title="Time on Page (avg. seconds)"
            items={analytics.timeOnPage.map(p => ({
              label: p.url,
              count: p.avgSeconds,
            }))}
          />
        )}
        <StatList
          title="Top Referrers"
          items={analytics.topReferrers.map(r => ({
            label: r.referrer ?? "Direct",
            count: r.count,
          }))}
        />
        <StatList
          title="AI Referrers"
          items={analytics.aiTraffic.map(r => ({
            label: r.referrer ?? "Direct",
            count: r.count,
          }))}
        />
        <StatList
          title="Outbound Links"
          items={analytics.outboundLinks.map(r => ({
            label: r.url,
            count: r.count,
          }))}
        />

        <StatTable
          title="Devices"
          items={analytics.devices}
          columns={[
            { key: "deviceFamily", label: "Family" },
            { key: "deviceBrand", label: "Brand" },
            { key: "deviceModel", label: "Model" },
            { key: "isSpider", label: "Is Spider" },
            { key: "count", label: "Views" },
          ]}
        />
        <StatTable
          title="Operating Systems"
          items={analytics.operatingSystems}
          columns={[
            { key: "os", label: "OS Family" },
            { key: "osMajor", label: "OS Major" },
            { key: "count", label: "Count" },
          ]}
        />
        <StatTable
          title="Browsers"
          items={analytics.browsers}
          columns={[
            { key: "browser", label: "Browser" },
            { key: "browserMajor", label: "Version" },
            { key: "count", label: "Views" },
          ]}
        />
        <StatList
          title="Countries"
          items={analytics.countries.map(c => ({
            label: c.country ?? "Unknown",
            count: c.count,
          }))}
        />
        {session.user?.subscriptionPlan === SubscriptionPlan.PRO && (
          <StatList
            title="Custom Events"
            items={analytics.customEvents.map(e => ({
              label: e.totalRevenue != null ? `${e.name} (€${e.totalRevenue.toFixed(2)})` : e.name,
              count: e.count,
            }))}
          />
        )}
        {session.user?.subscriptionPlan === SubscriptionPlan.PRO && (
          <SearchConsoleList data={searchConsoleData} />
        )}
        {session.user?.subscriptionPlan === SubscriptionPlan.PRO && (
          <View>
            <Text style={[sharedStyles.title, { textAlign: "center", marginVertical: 20 }]}>
              UTM Stats
            </Text>
            <StatList
              title="Sources"
              items={analytics.utmStats.topSources.map(s => ({
                label: s.source ?? "Unknown",
                count: s.count,
              }))}
            />
            <StatList
              title="Mediums"
              items={analytics.utmStats.topMediums.map(m => ({
                label: m.medium ?? "Unknown",
                count: m.count,
              }))}
            />
            <StatList
              title="Campaigns"
              items={analytics.utmStats.topCampaigns.map(c => ({
                label: c.campaign ?? "Unknown",
                count: c.count,
              }))}
            />
            <StatList
              title="Content"
              items={analytics.utmStats.topContents.map(c => ({
                label: c.content ?? "Unknown",
                count: c.count,
              }))}
            />
            <StatList
              title="Terms"
              items={analytics.utmStats.topTerms.map(t => ({
                label: t.term ?? "Unknown",
                count: t.count,
              }))}
            />
          </View>
        )}
      </Skeleton>
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

const styles = StyleSheet.create({
  buttons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
