import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  AppNotification,
  ScheduledPost,
  SocialAccount,
  UserProfile,
  Workspace,
} from '../src/types/postease.ts';

export interface StoredUser extends UserProfile {
  passwordHash: string;
  passwordSalt: string;
}

export interface DatabaseSchema {
  users: StoredUser[];
  sessions: Record<string, string>; // token -> userId
  workspaces: Workspace[];
  accounts: SocialAccount[];
  posts: ScheduledPost[];
  notifications: AppNotification[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'postease-db.json');

function formatOffsetDate(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const usedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, usedSalt, 64).toString('hex');
  return { hash, salt: usedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(hash, 'hex'));
}

function createInitialSeed(): DatabaseSchema {
  const { hash, salt } = hashPassword('postease2026');

  const demoUser: StoredUser = {
    id: 'usr_maya_01',
    name: 'Maya Lin',
    email: 'maya@postease.studio',
    handle: '@mayacreates',
    avatarUrl: '/src/assets/images/creator_avatar_main_1794724057123.jpg',
    accountType: 'Content Creator',
    bio: 'Lifestyle creator, specialty coffee stories & minimalist tech setups.',
    language: 'English',
    theme: 'light',
    planId: 'pro',
    notifications: {
      publishAlerts: true,
      approvalRequests: true,
      weeklyDigest: true,
      aiSuggestions: true,
    },
    onboardingCompleted: true,
    passwordHash: hash,
    passwordSalt: salt,
  };

  const workspaces: Workspace[] = [
    {
      id: 'ws_creator',
      name: 'Maya Studio',
      industry: 'Creator & Lifestyle',
      isClientWorkspace: false,
      members: [
        {
          id: 'mem_1',
          name: 'Maya Lin',
          email: 'maya@postease.studio',
          role: 'Owner',
          avatarUrl: '/src/assets/images/creator_avatar_main_1794724057123.jpg',
          status: 'active',
        },
        {
          id: 'mem_2',
          name: 'Aarav Mehta',
          email: 'aarav@postease.studio',
          role: 'Editor',
          status: 'active',
        },
        {
          id: 'mem_3',
          name: 'Elena Vance',
          email: 'elena@postease.studio',
          role: 'Approver',
          status: 'active',
        },
      ],
    },
    {
      id: 'ws_client_aura',
      name: 'Aura Audio',
      industry: 'Consumer Electronics',
      isClientWorkspace: true,
      clientBrandName: 'Aura Acoustics Pvt Ltd',
      members: [
        {
          id: 'mem_1',
          name: 'Maya Lin',
          email: 'maya@postease.studio',
          role: 'Admin',
          avatarUrl: '/src/assets/images/creator_avatar_main_1794724057123.jpg',
          status: 'active',
        },
        {
          id: 'mem_4',
          name: 'Rohan Kapoor',
          email: 'rohan@auraaudio.co',
          role: 'Approver',
          status: 'active',
        },
      ],
    },
  ];

  const accounts: SocialAccount[] = [
    {
      id: 'acc_ig_maya',
      workspaceId: 'ws_creator',
      platform: 'instagram',
      accountName: 'Maya Lin Studio',
      handle: '@mayacreates',
      followers: 48200,
      connected: true,
      connectionMode: 'demo_oauth',
      oauthScopes: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights'],
      lastSyncedAt: new Date().toISOString(),
      apiCapabilities: {
        officialSupported: ['Reels', 'Feed Posts', 'Business Stories', 'Insights'],
        manualOrUnsupported: ['Interactive Story Stickers', 'Personal Accounts'],
      },
    },
    {
      id: 'acc_yt_maya',
      workspaceId: 'ws_creator',
      platform: 'youtube',
      accountName: 'Maya Creates',
      handle: '@MayaCreatesYT',
      followers: 21400,
      connected: true,
      connectionMode: 'demo_oauth',
      oauthScopes: ['youtube.upload', 'youtube.readonly'],
      lastSyncedAt: new Date().toISOString(),
      apiCapabilities: {
        officialSupported: ['YouTube Shorts', '16:9 Videos', 'Scheduled publishAt'],
        manualOrUnsupported: ['Licensed Shorts Music Overlay'],
      },
    },
    {
      id: 'acc_fb_maya',
      workspaceId: 'ws_creator',
      platform: 'facebook',
      accountName: 'Maya Studio Page',
      handle: 'fb.com/mayastudiopage',
      followers: 15800,
      connected: true,
      connectionMode: 'demo_oauth',
      oauthScopes: ['pages_manage_posts', 'pages_read_engagement'],
      lastSyncedAt: new Date().toISOString(),
      apiCapabilities: {
        officialSupported: ['Page Posts', 'Page Reels', 'Page Stories'],
        manualOrUnsupported: ['Personal Timeline', 'Third-Party Groups'],
      },
    },
    {
      id: 'acc_wa_maya',
      workspaceId: 'ws_creator',
      platform: 'whatsapp',
      accountName: 'Maya Studio VIP',
      handle: '+91 98200 44120',
      followers: 3420,
      connected: true,
      connectionMode: 'demo_oauth',
      oauthScopes: ['whatsapp_business_messaging', 'whatsapp_business_management'],
      lastSyncedAt: new Date().toISOString(),
      apiCapabilities: {
        officialSupported: ['Business Cloud API Template Messages'],
        manualOrUnsupported: ['WhatsApp Status (Manual Mobile Handoff Only)'],
      },
    },
    {
      id: 'acc_ig_aura',
      workspaceId: 'ws_client_aura',
      platform: 'instagram',
      accountName: 'Aura Audio Official',
      handle: '@auraaudio.in',
      followers: 92400,
      connected: true,
      connectionMode: 'demo_oauth',
      oauthScopes: ['instagram_basic', 'instagram_content_publish'],
      lastSyncedAt: new Date().toISOString(),
      apiCapabilities: {
        officialSupported: ['Reels', 'Feed Posts', 'Business Stories'],
        manualOrUnsupported: ['Interactive Stickers'],
      },
    },
    {
      id: 'acc_wa_aura',
      workspaceId: 'ws_client_aura',
      platform: 'whatsapp',
      accountName: 'Aura Support & Drops',
      handle: '+91 98111 77210',
      followers: 12900,
      connected: true,
      connectionMode: 'demo_oauth',
      oauthScopes: ['whatsapp_business_messaging'],
      lastSyncedAt: new Date().toISOString(),
      apiCapabilities: {
        officialSupported: ['Approved Launch Broadcast Templates'],
        manualOrUnsupported: ['WhatsApp Status (Manual Handoff)'],
      },
    },
  ];

  const posts: ScheduledPost[] = [
    {
      id: 'post_101',
      workspaceId: 'ws_creator',
      title: 'Iced Matcha Espresso Layering Reel',
      platforms: ['instagram', 'youtube'],
      contentTypes: { instagram: 'ig_reel', youtube: 'yt_short' },
      captions: {
        instagram: 'Morning ritual in 3 layers. Matcha, oat milk, and single-origin espresso over clear ice.',
        youtube: '3-Layer Iced Matcha Espresso Pour #Shorts',
      },
      hashtags: ['#MorningRitual', '#MatchaEspresso', '#CreatorLife', '#CafeAesthetic'],
      mediaUrl: '/src/assets/images/reel_cover_coffee_1794724057853.jpg',
      mediaType: 'image',
      aspectRatio: '9:16',
      scheduledDate: formatOffsetDate(0),
      scheduledTime: '18:30',
      status: 'scheduled',
      publishMode: 'demo_simulation',
      statusNote: 'Ready for 18:30 queue in Demonstration Mode',
      createdBy: 'Maya Lin',
      approvedBy: 'Elena Vance',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'post_102',
      workspaceId: 'ws_creator',
      title: '2026 Minimalist Desk Rig Breakdown',
      platforms: ['facebook', 'instagram'],
      contentTypes: { facebook: 'fb_post', instagram: 'ig_post' },
      captions: {
        facebook: 'Everything inside my portable shooting desk for fast weekly Reels and YouTube Shorts.',
        instagram: 'Small desk, zero clutter. My 2026 mobile creator kit for shooting 3 Reels in under an hour.',
      },
      hashtags: ['#DeskSetup', '#CreatorGear', '#ContentWorkflow'],
      mediaUrl: '/src/assets/images/post_cover_workspace_1794724058283.jpg',
      mediaType: 'image',
      aspectRatio: '1:1',
      scheduledDate: formatOffsetDate(0),
      scheduledTime: '11:00',
      status: 'published',
      publishMode: 'demo_simulation',
      statusNote: 'Published in Demonstration Mode',
      createdBy: 'Maya Lin',
      metrics: { views: 18420, likes: 1640, comments: 94, shares: 218 },
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'post_103',
      workspaceId: 'ws_creator',
      title: 'Aura Studio ANC Headphones Drop',
      platforms: ['instagram', 'whatsapp'],
      contentTypes: { instagram: 'ig_reel', whatsapp: 'wa_business_message' },
      captions: {
        instagram: 'First listen on the matte obsidian Aura Studio cans. Zero cable clutter, 42h battery.',
        whatsapp: 'VIP Drop Alert: Our studio gear review & exclusive creator code goes live tonight at 7 PM.',
      },
      hashtags: ['#TechReview', '#MinimalTech', '#StudioAudio'],
      mediaUrl: '/src/assets/images/reel_cover_product_1794724059079.jpg',
      mediaType: 'image',
      aspectRatio: '9:16',
      scheduledDate: formatOffsetDate(1),
      scheduledTime: '19:00',
      status: 'pending_approval',
      publishMode: 'demo_simulation',
      statusNote: 'Awaiting client/approver sign-off before queue dispatch',
      createdBy: 'Aarav Mehta',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'post_104',
      workspaceId: 'ws_creator',
      title: 'Weekend Espresso Club Status Update',
      platforms: ['whatsapp'],
      contentTypes: { whatsapp: 'wa_status_prep' },
      captions: {
        whatsapp: 'Fresh roast drops Saturday 9 AM — swipe up or reply MENU for early bags.',
      },
      hashtags: ['#CoffeeClub', '#WeekendDrop'],
      mediaUrl: '/src/assets/images/reel_cover_coffee_1794724057853.jpg',
      mediaType: 'image',
      aspectRatio: '9:16',
      scheduledDate: formatOffsetDate(2),
      scheduledTime: '09:30',
      status: 'draft',
      publishMode: 'manual_handoff',
      statusNote: 'WhatsApp Status has no public API — prepared for manual mobile share',
      createdBy: 'Maya Lin',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'post_105',
      workspaceId: 'ws_creator',
      title: 'Behind the Scenes: Color Grading Reels',
      platforms: ['youtube'],
      contentTypes: { youtube: 'yt_video' },
      captions: {
        youtube: 'How I grade sunlit vertical footage in 4 minutes without heavy LUTs.',
      },
      hashtags: ['#ColorGrading', '#Filmmaking', '#PostEase'],
      mediaUrl: '/src/assets/images/post_cover_workspace_1794724058283.jpg',
      mediaType: 'image',
      aspectRatio: '16:9',
      scheduledDate: formatOffsetDate(-2),
      scheduledTime: '17:00',
      status: 'published',
      publishMode: 'demo_simulation',
      statusNote: 'Published in Demonstration Mode',
      createdBy: 'Maya Lin',
      metrics: { views: 34900, likes: 2890, comments: 215, shares: 410 },
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'post_106',
      workspaceId: 'ws_creator',
      title: 'Facebook Story Reel Teaser',
      platforms: ['facebook'],
      contentTypes: { facebook: 'fb_story' },
      captions: {
        facebook: 'New creator gear walkthrough drops tomorrow morning.',
      },
      hashtags: ['#CreatorTools'],
      mediaUrl: '/src/assets/images/reel_cover_product_1794724059079.jpg',
      mediaType: 'image',
      aspectRatio: '9:16',
      scheduledDate: formatOffsetDate(-1),
      scheduledTime: '14:15',
      status: 'failed',
      publishMode: 'official_api',
      statusNote: 'Meta OAuth token expired — reconnect Facebook Page in Settings to retry',
      createdBy: 'Maya Lin',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'post_107',
      workspaceId: 'ws_client_aura',
      title: 'Aura Obsidian Edition Launch Reel',
      platforms: ['instagram', 'youtube', 'facebook'],
      contentTypes: { instagram: 'ig_reel', youtube: 'yt_short', facebook: 'fb_reel' },
      captions: {
        instagram: 'Sculpted acoustics. Matte Obsidian. Launching Friday.',
        youtube: 'Meet Aura Obsidian Wireless ANC #Shorts',
        facebook: 'Pure studio clarity anywhere. Reserve your pair today.',
      },
      hashtags: ['#AuraAudio', '#ObsidianEdition', '#WirelessANC'],
      mediaUrl: '/src/assets/images/reel_cover_product_1794724059079.jpg',
      mediaType: 'image',
      aspectRatio: '9:16',
      scheduledDate: formatOffsetDate(0),
      scheduledTime: '20:00',
      status: 'scheduled',
      publishMode: 'demo_simulation',
      statusNote: 'Approved by Rohan Kapoor · Queued for 20:00',
      createdBy: 'Maya Lin',
      approvedBy: 'Rohan Kapoor',
      updatedAt: new Date().toISOString(),
    },
  ];

  const notifications: AppNotification[] = [
    {
      id: 'notif_1',
      title: 'Approval needed',
      message: 'Aarav Mehta submitted "Aura Studio ANC Headphones Drop" for your review.',
      timeLabel: '14m ago',
      read: false,
      category: 'approval',
    },
    {
      id: 'notif_2',
      title: 'Facebook Story action required',
      message: 'Facebook Story Reel Teaser failed because live Meta OAuth credentials are not connected.',
      timeLabel: '2h ago',
      read: false,
      category: 'account',
    },
    {
      id: 'notif_3',
      title: 'Post published (Demo)',
      message: '2026 Minimalist Desk Rig Breakdown completed simulated dispatch at 11:00.',
      timeLabel: '6h ago',
      read: true,
      category: 'publish',
    },
  ];

  return {
    users: [demoUser],
    sessions: {
      demo_session_token: demoUser.id,
    },
    workspaces,
    accounts,
    posts,
    notifications,
  };
}

export function loadDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const seed = createInitialSeed();
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) as DatabaseSchema;
  } catch {
    const seed = createInitialSeed();
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
}

export function saveDb(db: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DB_PATH);
}

export function sanitizeUser(user: StoredUser): UserProfile {
  const { passwordHash: _h, passwordSalt: _s, ...profile } = user;
  return profile;
}
