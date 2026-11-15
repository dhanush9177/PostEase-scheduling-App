export type PlatformId = 'instagram' | 'facebook' | 'youtube' | 'whatsapp';

export type ContentType =
  | 'ig_post'
  | 'ig_story'
  | 'ig_reel'
  | 'fb_post'
  | 'fb_story'
  | 'fb_reel'
  | 'yt_video'
  | 'yt_short'
  | 'wa_business_message'
  | 'wa_status_prep';

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'pending_approval';

export type AccountType =
  | 'Content Creator'
  | 'Influencer'
  | 'Small Business'
  | 'Marketing Agency';

export type TeamRole = 'Owner' | 'Admin' | 'Editor' | 'Approver';

export type AspectRatio = '9:16' | '1:1' | '16:9';

export type PlanTierId = 'free' | 'creator' | 'pro' | 'business' | 'agency';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  handle: string;
  avatarUrl: string;
  accountType: AccountType;
  bio: string;
  language: string;
  theme: 'light' | 'dark';
  planId: PlanTierId;
  notifications: {
    publishAlerts: boolean;
    approvalRequests: boolean;
    weeklyDigest: boolean;
    aiSuggestions: boolean;
  };
  onboardingCompleted: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  avatarUrl?: string;
  status: 'active' | 'invited';
}

export interface Workspace {
  id: string;
  name: string;
  industry: string;
  isClientWorkspace: boolean;
  clientBrandName?: string;
  members: TeamMember[];
}

export interface SocialAccount {
  id: string;
  workspaceId: string;
  platform: PlatformId;
  accountName: string;
  handle: string;
  followers: number;
  connected: boolean;
  connectionMode: 'demo_oauth' | 'official_api' | 'disconnected';
  oauthScopes: string[];
  lastSyncedAt: string;
  apiCapabilities: {
    officialSupported: string[];
    manualOrUnsupported: string[];
  };
}

export interface ScheduledPost {
  id: string;
  workspaceId: string;
  title: string;
  platforms: PlatformId[];
  contentTypes: Partial<Record<PlatformId, ContentType>>;
  captions: Partial<Record<PlatformId, string>>;
  hashtags: string[];
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'none';
  aspectRatio?: AspectRatio;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  status: PostStatus;
  publishMode: 'official_api' | 'demo_simulation' | 'manual_handoff';
  statusNote?: string;
  createdBy: string;
  approvedBy?: string;
  metrics?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  updatedAt: string;
}

export interface StoryboardScene {
  id: string;
  sceneNumber: number;
  durationSec: number;
  visualDirection: string;
  cameraAngle: string;
  voiceoverLine: string;
  onScreenText: string;
  bRollSuggestion: string;
}

export interface ReelProject {
  id: string;
  title: string;
  topic: string;
  format: AspectRatio;
  templateId: string;
  hook: string;
  script: string;
  scenes: StoryboardScene[];
  captions: {
    instagram: string;
    youtube: string;
    facebook: string;
  };
  hashtags: string[];
  voiceoverEnabled: boolean;
  voiceStyle: string;
  musicTrack: string;
  subtitlesEnabled: boolean;
  trimStartSec: number;
  trimEndSec: number;
  mediaUrl?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timeLabel: string;
  read: boolean;
  category: 'publish' | 'approval' | 'ai' | 'account';
}
