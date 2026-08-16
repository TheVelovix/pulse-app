import { fetchWithAuth, getTokens, parseMonth, useTypedParams } from "@/lib/lib";
import { AnalyticsProject, AnalyticsResult, GoogleSearchConsoleData } from "@/types/Analytics";
import { ProjectDetailsParams } from "@/types/NavParams";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { toast } from "sonner-native";
import { Skeleton } from "@/components/Skeleton";
import { sharedStyles } from "@/constants/commonStyles";
import {
  CalendarIcon,
  ChartLineUpIcon,
  CopyIcon,
  ExportIcon,
  PlugsConnectedIcon,
  PlugsIcon,
} from "phosphor-react-native";
import { colors } from "@/constants/theme";
import * as Clipboard from "expo-clipboard";
import { SubscriptionPlan, useSession } from "@/context/SessionContext";
import DateRangePicker from "@/components/DateRangePicker";
import CopyScriptModal from "@/components/CopyScriptModal";
import BackButton from "@/components/BackButton";
import { Directory } from "expo-file-system";
import EventSource from "react-native-sse";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import StatList from "@/components/StatList";
import StatTable from "@/components/StatTable";
import SearchConsoleList from "@/components/SearchConsoleList";
import ViewsChart from "@/components/ViewsChart";
import { useTablet } from "@/context/TabletContext";

async function getProjectDetails(id: string) {
  try {
    const res = await fetchWithAuth(`${process.env.EXPO_PUBLIC_BACKEND}/api/projects/${id}`);
    if (!res.ok) {
      toast.error("Failed to fetch project details.");
      return;
    }
    const data = await res.json();
    return data;
  } catch {
    toast.error("Failed to fetch project details.");
  }
}
async function getProjectAnalytics(
  id: string,
  days?: number,
  from?: Date,
  to?: Date,
): Promise<AnalyticsResult | null> {
  try {
    const urlParams = new URLSearchParams();
    if (from && to) {
      urlParams.set("from", from.toDateString());
      urlParams.set("to", to.toDateString());
    } else if (days) {
      urlParams.set("days", days.toString());
    }
    const query = urlParams.toString();
    const res = await fetchWithAuth(
      `${process.env.EXPO_PUBLIC_BACKEND}/api/analytics/${id}?${query}`,
    );
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
    if (res.status === 404) {
      const text = await res.text();
      if (text === "search-console-not-connected") {
        throw new Error(text);
      }
    } else if (res.status === 500) {
      toast.error("Failed to get search console data. Please report at: info@velovix.com");
    }
    return [];
  } catch (e) {
    if (e instanceof Error && e.message === "search-console-not-connected") throw e;
    else toast.error("Failed to get search console data. Please report at: info@velovix.com");
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
  const [project, setProject] = useState<AnalyticsProject | undefined>(undefined);
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
  const router = useRouter();
  useEffect(() => {
    startTransition(async () => {
      const [analytics, project] = await Promise.all([
        getProjectAnalytics(params.id, days, from, to),
        getProjectDetails(params.id),
      ]);
      if (analytics) {
        setAnalytics(analytics);
      }
      if (project) {
        setProject(project);
      }
    });
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
  // Defaulted to true to keep the button hidden while requests are in progress
  const [searchConsoleConnected, setSearchConsoleConnected] = useState(true);
  const refetchSearchConsoleData = useCallback(async () => {
    try {
      const data = await getSearchConsoleData(params.id);
      setSearchConsoleData(data);
      setSearchConsoleConnected(true);
      return true;
    } catch (e) {
      if (e instanceof Error && e.message === "search-console-not-connected") {
        setSearchConsoleConnected(false);
      }
      return false;
    }
  }, [params.id]);
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
        setLiveVisitors(parseInt(e.data!, 10));
      });

      eventSource.addEventListener("error", () => {
        eventSource.close();
      });
      await refetchSearchConsoleData();
    })();

    return () => eventSource?.close();
  }, [session.user?.subscriptionPlan, params.id, refetchSearchConsoleData]);
  const [connectingSearchConsole, setConnectingSearchConsole] = useState(false);
  const connectSearchConsole = useCallback(async () => {
    setConnectingSearchConsole(true);
    try {
      const { accessToken } = await getTokens();
      const connectUrl = `${process.env.EXPO_PUBLIC_BACKEND}/api/search-console/connect/${params.id}?token=${encodeURIComponent(accessToken!)}`;
      // The callback redirects to the web dashboard, which the app cannot intercept,
      // so the browser is dismissed by hand. The tokens are stored server-side either
      // way, so just re-check the connection however the browser was closed.
      await WebBrowser.openBrowserAsync(connectUrl);
      if (await refetchSearchConsoleData()) toast.success("Google Search Console connected.");
    } finally {
      setConnectingSearchConsole(false);
    }
  }, [params.id, refetchSearchConsoleData]);
  const [connectingGa, setConnectingGa] = useState(false);
  const importFromGa = useCallback(async () => {
    if (project?.importedGa) {
      toast.info("Already imported from Google Analytics");
      return;
    }
    setConnectingGa(true);
    try {
      const { accessToken } = await getTokens();
      const connectUrl = `${process.env.EXPO_PUBLIC_BACKEND}/api/ga-import/connect/${params.id}?platform=mobile&token=${encodeURIComponent(accessToken!)}`;
      const result = await WebBrowser.openAuthSessionAsync(connectUrl, "pulse://");
      // On Android the redirect arrives through Linking, so expo-router navigates to
      // /GaImport by itself. On iOS the auth session swallows it, so route manually.
      if (result.type !== "success" || Platform.OS === "android") return;
      const { queryParams } = Linking.parse(result.url);
      const properties = queryParams?.properties;
      const gaAccessToken = queryParams?.accessToken;
      if (typeof properties !== "string" || typeof gaAccessToken !== "string") {
        toast.error("Failed to read Google Analytics properties.");
        return;
      }
      router.push({
        pathname: "/GaImport",
        params: { projectId: params.id, properties, accessToken: gaAccessToken },
      });
    } catch {
      toast.error("Failed to connect to Google Analytics.");
    } finally {
      setConnectingGa(false);
    }
  }, [params.id, router]);
  const { isTablet, isLandscape } = useTablet();
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 15 }}>
      <BackButton />
      <Skeleton loading={loading} style={loading ? styles.skeletonFrame : undefined}>
        <Text style={sharedStyles.title}>{params.name} Analytics</Text>
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
      <View
        style={[
          { flexDirection: "row", justifyContent: "space-around", flexWrap: "wrap" },
          isTablet && !isLandscape && { width: "55%" },
          isTablet && isLandscape && { width: "35%" },
        ]}
      >
        {DATE_RANGES.map((range, index) => {
          if (range.label === "All time" && session.user?.subscriptionPlan !== SubscriptionPlan.PRO)
            return;
          return (
            <Skeleton
              key={index}
              loading={loading}
              style={{ ...(loading ? styles.skeletonFrame : undefined), width: 80, maxHeight: 60 }}
            >
              <Pressable
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
            </Skeleton>
          );
        })}

        <Skeleton
          loading={loading}
          style={{ ...(loading ? styles.skeletonFrame : undefined), width: 80, maxHeight: 60 }}
        >
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
        </Skeleton>
      </View>

      {/*Buttons*/}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: !isTablet ? "space-around" : "flex-start",
          gap: !isTablet ? 0 : 10,
        }}
      >
        <Skeleton
          loading={loading}
          style={{ ...(loading ? styles.skeletonFrame : undefined), width: 80, maxHeight: 60 }}
        >
          <Pressable
            onPress={() => setShowCopyScript(true)}
            style={({ pressed }) => [
              styles.buttons,
              sharedStyles.cards,
              pressed && { backgroundColor: colors.background },
            ]}
          >
            <CopyIcon color="white" />
            <Text style={sharedStyles.labels}>Copy Script</Text>
          </Pressable>
        </Skeleton>

        {session.user?.subscriptionPlan === SubscriptionPlan.PRO && (
          <Skeleton
            loading={loading}
            style={{ ...(loading ? styles.skeletonFrame : undefined), width: 80, maxHeight: 60 }}
          >
            <Pressable
              onPress={exportCsv}
              style={({ pressed }) => [
                styles.buttons,
                sharedStyles.cards,
                pressed && { backgroundColor: colors.background },
              ]}
            >
              <ExportIcon color="white" />
              <Text style={sharedStyles.labels}>Export CSV</Text>
            </Pressable>
          </Skeleton>
        )}
        {!searchConsoleConnected && session.user?.subscriptionPlan === SubscriptionPlan.PRO && (
          <Skeleton
            loading={loading}
            style={{ ...(loading ? styles.skeletonFrame : undefined), width: 80, maxHeight: 60 }}
          >
            <Pressable
              disabled={connectingSearchConsole}
              onPress={connectSearchConsole}
              style={({ pressed }) => [
                styles.buttons,
                sharedStyles.cards,
                pressed && { backgroundColor: colors.background },
                connectingSearchConsole && { opacity: 0.7 },
              ]}
            >
              {connectingSearchConsole ? (
                <PlugsConnectedIcon color="white" />
              ) : (
                <PlugsIcon color="white" />
              )}
              <Text style={sharedStyles.labels}>
                {connectingSearchConsole ? "Connecting..." : "Connect Google Search Console"}
              </Text>
            </Pressable>
          </Skeleton>
        )}
        {session.user?.subscriptionPlan === SubscriptionPlan.PRO && !project?.importedGa && (
          <Skeleton
            loading={loading}
            style={{ ...(loading ? styles.skeletonFrame : undefined), width: 80, maxHeight: 60 }}
          >
            <Pressable
              disabled={connectingGa}
              onPress={importFromGa}
              style={[styles.buttons, sharedStyles.cards, connectingGa && { opacity: 0.7 }]}
            >
              <ChartLineUpIcon color="white" />
              <Text style={sharedStyles.labels}>
                {connectingGa ? "Connecting..." : "Import from Google Analytics"}
              </Text>
            </Pressable>
          </Skeleton>
        )}
      </View>

      {/*Main Stats*/}
      <Skeleton loading={loading} style={loading ? styles.skeletonFrame : undefined}>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: !isTablet ? "space-around" : "flex-start",
            gap: !isTablet ? 0 : 20,
          }}
        >
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
            <Text style={sharedStyles.title}>
              {((analytics?.bounceRate ?? 0) * 100).toFixed(1)}%
            </Text>
          </View>
          {session.user?.subscriptionPlan === SubscriptionPlan.PRO && (
            <View style={sharedStyles.cards}>
              <Text style={sharedStyles.labelsMuted}>Live Views</Text>
              <Text style={sharedStyles.title}>{liveVisitors}</Text>
            </View>
          )}
        </View>
      </Skeleton>

      <Skeleton loading={loading} style={loading ? styles.skeletonFrame : undefined}>
        <ViewsChart data={analytics.viewsPerDay} />
      </Skeleton>

      <Skeleton loading={loading} style={loading ? styles.skeletonFrame : undefined}>
        {!isTablet || !isLandscape ? (
          <>
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
          </>
        ) : (
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <StatList
                title="Entry Pages"
                items={analytics.entryPages.map(p => ({
                  label: p.url,
                  count: p.count,
                }))}
              />
            </View>
            <View style={{ flex: 1 }}>
              <StatList
                title="Top Pages"
                items={analytics.topPages.map(p => ({
                  label: p.url,
                  count: p.count,
                }))}
              />
            </View>
          </View>
        )}
        {session.user?.subscriptionPlan === SubscriptionPlan.PRO && (
          <StatList
            title="Time on Page (avg. seconds)"
            items={analytics.timeOnPage.map(p => ({
              label: p.url,
              count: p.avgSeconds,
            }))}
          />
        )}

        {/*Referrers*/}
        {!isTablet || !isLandscape ? (
          <>
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
          </>
        ) : (
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <StatList
                title="Top Referrers"
                items={analytics.topReferrers.map(r => ({
                  label: r.referrer ?? "Direct",
                  count: r.count,
                }))}
              />
            </View>
            <View style={{ flex: 1 }}>
              <StatList
                title="AI Referrers"
                items={analytics.aiTraffic.map(r => ({
                  label: r.referrer ?? "Direct",
                  count: r.count,
                }))}
              />
            </View>
          </View>
        )}

        <StatList
          title="Outbound Links"
          items={analytics.outboundLinks.map(r => ({
            label: r.url,
            count: r.count,
          }))}
        />

        {/*Devices and OS-es*/}
        {!isTablet || !isLandscape ? (
          <>
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
          </>
        ) : (
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
            <View style={{ flex: 1 }}>
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
            </View>
            <View style={{ flex: 1 }}>
              <StatTable
                title="Operating Systems"
                items={analytics.operatingSystems}
                columns={[
                  { key: "os", label: "OS Family" },
                  { key: "osMajor", label: "OS Major" },
                  { key: "count", label: "Count" },
                ]}
              />
            </View>
          </View>
        )}

        {/*Browsers and Countries*/}
        {!isTablet || !isLandscape ? (
          <>
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
          </>
        ) : (
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <StatTable
                title="Browsers"
                items={analytics.browsers}
                columns={[
                  { key: "browser", label: "Browser" },
                  { key: "browserMajor", label: "Version" },
                  { key: "count", label: "Views" },
                ]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <StatList
                title="Countries"
                items={analytics.countries.map(c => ({
                  label: c.country ?? "Unknown",
                  count: c.count,
                }))}
              />
            </View>
          </View>
        )}
        {session.user?.subscriptionPlan === SubscriptionPlan.PRO && (
          <>
            {!isTablet || !isLandscape ? (
              <>
                <StatList
                  title="Custom Events"
                  items={analytics.customEvents.map(e => ({
                    label:
                      e.totalRevenue != null ? `${e.name} (€${e.totalRevenue.toFixed(2)})` : e.name,
                    count: e.count,
                  }))}
                />
                <SearchConsoleList data={searchConsoleData} />
              </>
            ) : (
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <StatList
                    title="Custom Events"
                    items={analytics.customEvents.map(e => ({
                      label:
                        e.totalRevenue != null
                          ? `${e.name} (€${e.totalRevenue.toFixed(2)})`
                          : e.name,
                      count: e.count,
                    }))}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <SearchConsoleList data={searchConsoleData} />
                </View>
              </View>
            )}
          </>
        )}
        {session.user?.subscriptionPlan === SubscriptionPlan.PRO && (
          <>
            <Text style={[sharedStyles.title, { textAlign: "center", marginVertical: 20 }]}>
              UTM Stats
            </Text>
            {!isTablet ? (
              <View>
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
            ) : (
              <>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <StatList
                      title="Sources"
                      items={analytics.utmStats.topSources.map(s => ({
                        label: s.source ?? "Unknown",
                        count: s.count,
                      }))}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <StatList
                      title="Mediums"
                      items={analytics.utmStats.topMediums.map(m => ({
                        label: m.medium ?? "Unknown",
                        count: m.count,
                      }))}
                    />
                  </View>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <StatList
                      title="Campaigns"
                      items={analytics.utmStats.topCampaigns.map(c => ({
                        label: c.campaign ?? "Unknown",
                        count: c.count,
                      }))}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <StatList
                      title="Content"
                      items={analytics.utmStats.topContents.map(c => ({
                        label: c.content ?? "Unknown",
                        count: c.count,
                      }))}
                    />
                  </View>
                </View>
                <StatList
                  title="Terms"
                  items={analytics.utmStats.topTerms.map(t => ({
                    label: t.term ?? "Unknown",
                    count: t.count,
                  }))}
                />
              </>
            )}
          </>
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
  skeletonFrame: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    minHeight: 150,
  },
});
