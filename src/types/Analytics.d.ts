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
  entryPagtes: Page[];
  timeOnPage: TimeOnPage[];
  utmStats: Utm;
  customEvents: CustomEvent[];
}
interface DailyView {
  date: Date;
  count: number;
}
interface Page {
  url: string;
  count: number;
}
interface Referrer {
  referrer: string;
  count: number;
}
interface Device {
  deviceFamily: string;
  deviceBrand: string;
  deviceModel: string;
  isSpider: boolean;
  count: number;
}
interface Browser {
  browser: string;
  browserMajor: string;
  count: number;
}
interface Country {
  country: string;
  count: number;
}
interface OperatingSystem {
  os: string;
  osMajor: string;
  count: number;
}
interface TimeOnPage {
  url: string;
  avgSeconds: number;
}
interface Utm {
  topSources: TopSource[];
  topMediums: TopMedium[];
  topCampaigns: TopCampaign[];
  topContents: TopContent[];
  topTerms: TopTerm[];
}
interface TopSource {
  source: string;
  count: number;
}
interface TopMedium {
  medium: string;
  count: number;
}
interface TopCampaign {
  campaign: string;
}
interface TopContent {
  content: string;
  count: number;
}
interface TopTerm {
  term: string;
  count: number;
}
interface CustomEvent {
  name: string;
  count: number;
  totalRevenue: number;
}
export interface DateRangePickerParams {
  isVisible: boolean;
  maximumDate: Date;
  minimumDate: Date;
  submitDate: (startDate: Date, endDate: Date) => void;
  close: () => void;
}
