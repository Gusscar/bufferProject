export type Service =
  | "bluesky"
  | "facebook"
  | "googlebusiness"
  | "instagram"
  | "linkedin"
  | "mastodon"
  | "pinterest"
  | "startPage"
  | "substack"
  | "threads"
  | "tiktok"
  | "twitter"
  | "whatsapp"
  | "youtube";

export type PostStatus =
  | "draft"
  | "needs_approval"
  | "scheduled"
  | "sending"
  | "sent"
  | "error";

export type ShareMode =
  | "addToQueue"
  | "customScheduled"
  | "shareNext"
  | "shareNow";

export type SchedulingType = "automatic" | "notification";

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type PostMetricUnit = "count" | "percentage";

export interface Account {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  timezone?: string | null;
  organizations: Organization[];
}

export interface Organization {
  id: string;
  name: string;
}

export interface ScheduleV2 {
  day: DayOfWeek;
  paused: boolean;
  times: string[];
}

export interface Channel {
  id: string;
  name: string;
  displayName?: string | null;
  descriptor: string;
  avatar: string;
  service: Service;
  type?: string | null;
  timezone: string;
  isQueuePaused: boolean;
  postingSchedule: ScheduleV2[];
  postingGoal?: { cadence: number; goal: number } | null;
  externalLink?: string | null;
}

export interface PostMetric {
  type: string;
  name: string;
  value: number;
  unit: PostMetricUnit;
}

export interface PostAsset {
  id?: string | null;
  source: string;
  thumbnail?: string | null;
  type?: string | null;
}

export interface PostTag {
  id: string;
  name: string;
  color?: string | null;
}

export interface Post {
  id: string;
  text: string;
  status: PostStatus;
  dueAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  channelId: string;
  channelService: Service;
  channelName?: string | null;
  channelAvatar?: string | null;
  schedulingType?: SchedulingType | null;
  shareMode?: ShareMode | null;
  isCustomScheduled?: boolean | null;
  externalLink?: string | null;
  error?: { message: string } | null;
  assets: PostAsset[];
  metrics?: PostMetric[] | null;
  metricsUpdatedAt?: string | null;
  tags?: PostTag[] | null;
  allowedActions?: string[] | null;
}

export interface PostsPage {
  edges: Post[];
  pageInfo: { endCursor?: string | null; hasNextPage: boolean };
  totalCount?: number | null;
}

export interface AggregatedMetrics {
  metrics: PostMetric[];
  metricsUpdatedAt?: string | null;
}

/* ---------- App-local ---------- */

export interface KpiSnapshot {
  id: string;
  date: string;
  metrics: Record<string, number>;
  channelFilter: string;
}

export interface ConnectionState {
  apiKeySet: boolean;
  account?: Account | null;
  channels: Channel[];
}

export interface BrandProfile {
  name: string;
  mission: string;
  tone: string;
  audience: string;
  visualStyle: string;
  hashtags: string;
}

export interface AppStore {
  bufferApiKey?: string;
  pollinationsApiKey?: string;
  pollinationsModel: string;
  llmModel: string;
  imageSeed: number;
  snapshots: KpiSnapshot[];
  bufferCache: Record<string, { ts: number; value: unknown }>;
  brand: BrandProfile;
}