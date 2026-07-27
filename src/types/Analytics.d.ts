export interface AnalyticsResult {
  totalViews: number;
  viewsPerDay: DailyView[];
  topPages: Page[];
  outboundLinks: Page[];
  topReferrers: Referrer[];
  aiTraffic: Referrer[];
  devices: Device[];
  browsers: Browser[];
  countries: Country[];
  operatingSystems: OperatingSystem[];
  uniqueVisitors: number;
  bounceRate: number;
  entryPages: Page[];
  timeOnPage: TimeOnPage[];
  utmStats: Utm;
  customEvents: CustomEvent[];
}
type DailyView = {
  date: string;
  count: number;
};
type Page = {
  url: string;
  count: number;
};
type Referrer = {
  referrer: string;
  count: number;
};
type Device = {
  deviceFamily: string;
  deviceBrand: string;
  deviceModel: string;
  isSpider: boolean;
  count: number;
};
type Browser = {
  browser: string;
  browserMajor: string;
  count: number;
};
type Country = {
  country: string;
  count: number;
};
type OperatingSystem = {
  os: string;
  osMajor: string;
  count: number;
};
type TimeOnPage = {
  url: string;
  avgSeconds: number;
};
interface Utm {
  topSources: TopSource[];
  topMediums: TopMedium[];
  topCampaigns: TopCampaign[];
  topContents: TopContent[];
  topTerms: TopTerm[];
}
type TopSource = {
  source: string;
  count: number;
};
type TopMedium = {
  medium: string;
  count: number;
};
type TopCampaign = {
  campaign: string;
  count: number;
};
type TopContent = {
  content: string;
  count: number;
};
type TopTerm = {
  term: string;
  count: number;
};
type CustomEvent = {
  name: string;
  count: number;
  totalRevenue: number;
};
export interface DateRangePickerParams {
  isVisible: boolean;
  maximumDate: Date;
  minimumDate: Date;
  submitDate: (startDate: Date, endDate: Date) => void;
  close: () => void;
}
export type GoogleSearchConsoleData = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};
