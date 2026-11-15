import type { ContentType, PlanTierId, PlatformId } from '../types/postease';

export interface PlatformMeta {
  id: PlatformId;
  name: string;
  shortName: string;
  brandColor: string;
  lightTint: string;
  darkTint: string;
  apiName: string;
  contentOptions: {
    id: ContentType;
    label: string;
    apiMode: 'official_api' | 'manual_handoff';
    helperText: string;
  }[];
  officialCapabilities: string[];
  manualCapabilities: string[];
}

export const PLATFORMS: Record<PlatformId, PlatformMeta> = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    shortName: 'IG',
    brandColor: '#E1306C',
    lightTint: 'bg-[#E1306C]/10 text-[#B81D53]',
    darkTint: 'dark:bg-[#E1306C]/15 dark:text-[#FF7AA8]',
    apiName: 'Meta Instagram Graph API',
    contentOptions: [
      {
        id: 'ig_reel',
        label: 'Reel',
        apiMode: 'official_api',
        helperText: 'Supported via Instagram Graph API for Business & Creator accounts.',
      },
      {
        id: 'ig_post',
        label: 'Feed Post',
        apiMode: 'official_api',
        helperText: 'Supported via Instagram Content Publishing API.',
      },
      {
        id: 'ig_story',
        label: 'Story',
        apiMode: 'official_api',
        helperText: 'Supported for Business accounts via Graph API; interactive stickers require mobile polish.',
      },
    ],
    officialCapabilities: [
      'Publish & schedule single/carousel Feed Posts',
      'Publish & schedule Reels via Business/Creator Graph API',
      'Publish image/video Stories for Business accounts',
      'Read media insights & engagement metrics',
    ],
    manualCapabilities: [
      'Interactive Story polls, quizzes & music sticker placement',
      'Personal (non-Creator/non-Business) profile publishing',
    ],
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    shortName: 'FB',
    brandColor: '#1877F2',
    lightTint: 'bg-[#1877F2]/10 text-[#125EC4]',
    darkTint: 'dark:bg-[#1877F2]/15 dark:text-[#66A8FF]',
    apiName: 'Meta Pages & Reels Graph API',
    contentOptions: [
      {
        id: 'fb_post',
        label: 'Page Post',
        apiMode: 'official_api',
        helperText: 'Supported via Facebook Pages Graph API.',
      },
      {
        id: 'fb_reel',
        label: 'Reel',
        apiMode: 'official_api',
        helperText: 'Supported via Facebook Reels Publishing API for Pages.',
      },
      {
        id: 'fb_story',
        label: 'Page Story',
        apiMode: 'official_api',
        helperText: 'Supported via Facebook Page Stories API.',
      },
    ],
    officialCapabilities: [
      'Schedule & publish Facebook Page posts & links',
      'Publish Facebook Page Reels & Video uploads',
      'Publish Facebook Page Stories',
    ],
    manualCapabilities: [
      'Personal Facebook profile timeline posting',
      'Third-party Group posting (restricted by Meta API)',
    ],
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    shortName: 'YT',
    brandColor: '#FF0000',
    lightTint: 'bg-[#FF0000]/10 text-[#C80000]',
    darkTint: 'dark:bg-[#FF0000]/15 dark:text-[#FF7878]',
    apiName: 'YouTube Data API v3',
    contentOptions: [
      {
        id: 'yt_short',
        label: 'Short (9:16)',
        apiMode: 'official_api',
        helperText: 'Vertical videos <= 60s uploaded via YouTube Data API v3.',
      },
      {
        id: 'yt_video',
        label: 'Video (16:9)',
        apiMode: 'official_api',
        helperText: 'Full upload & scheduled publishAt via YouTube Data API v3.',
      },
    ],
    officialCapabilities: [
      'Upload & schedule standard Videos with publishAt timestamp',
      'Upload vertical Shorts (<= 60s, 9:16)',
      'Set titles, descriptions, tags & privacy status',
    ],
    manualCapabilities: [
      'Trending YouTube Shorts licensed audio overlay',
      'End-screen card visual editor',
    ],
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    shortName: 'WA',
    brandColor: '#10B981',
    lightTint: 'bg-[#10B981]/12 text-[#006c49]',
    darkTint: 'dark:bg-[#25D366]/15 dark:text-[#4EDEA3]',
    apiName: 'WhatsApp Business Cloud API',
    contentOptions: [
      {
        id: 'wa_business_message',
        label: 'Business Broadcast',
        apiMode: 'official_api',
        helperText: 'Official Cloud API supports approved business template messages.',
      },
      {
        id: 'wa_status_prep',
        label: 'Status Prep (Manual)',
        apiMode: 'manual_handoff',
        helperText: 'WhatsApp does not offer an API for Status publishing. PostEase prepares media & caption for 1-tap mobile handoff.',
      },
    ],
    officialCapabilities: [
      'Send approved Business template messages via Cloud API',
      'Deliver rich media catalog alerts to opted-in customers',
    ],
    manualCapabilities: [
      'WhatsApp Status updates (no official publishing API; prepared for manual mobile share)',
      'Unsolicited bulk broadcasts without opt-in template approval',
    ],
  },
};

export interface SubscriptionPlan {
  id: PlanTierId;
  name: string;
  audience: string;
  priceMonthlyInr: string;
  cadence: string;
  highlighted?: boolean;
  limits: {
    scheduledPosts: string;
    socialAccounts: string;
    aiCredits: string;
    workspaces: string;
    collaboration: string;
  };
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    audience: 'For solo beginners testing scheduling',
    priceMonthlyInr: '₹0',
    cadence: 'forever',
    limits: {
      scheduledPosts: '10 scheduled posts / mo',
      socialAccounts: '2 social accounts',
      aiCredits: '5 AI script drafts / mo',
      workspaces: '1 workspace',
      collaboration: 'Solo creator only',
    },
    features: [
      'Visual weekly & monthly calendar',
      'Basic caption editor & hashtag saver',
      'WhatsApp Status manual prep kit',
    ],
  },
  {
    id: 'creator',
    name: 'Creator',
    audience: 'For independent creators & influencers',
    priceMonthlyInr: '₹199',
    cadence: 'per month (proposed)',
    limits: {
      scheduledPosts: '60 scheduled posts / mo',
      socialAccounts: '4 social accounts',
      aiCredits: '40 AI reels & captions / mo',
      workspaces: '1 brand workspace',
      collaboration: 'Solo creator',
    },
    features: [
      'Text-to-Reel storyboard & script studio',
      'Auto-subtitle & 9:16 / 1:1 / 16:9 exports',
      'Cross-platform caption customization',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    audience: 'For high-output creators & growing shops',
    priceMonthlyInr: '₹499',
    cadence: 'per month (proposed)',
    highlighted: true,
    limits: {
      scheduledPosts: 'Unlimited scheduled posts',
      socialAccounts: '8 social accounts',
      aiCredits: '150 AI reels, ads & calendars / mo',
      workspaces: '2 brand workspaces',
      collaboration: '2 team seats',
    },
    features: [
      'Image-to-Video product motion concepts',
      '7-Day AI content calendar generator',
      'Cross-channel analytics & best-time insights',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    audience: 'For multi-channel SMEs & D2C brands',
    priceMonthlyInr: '₹999',
    cadence: 'per month (proposed)',
    limits: {
      scheduledPosts: 'Unlimited scheduled posts',
      socialAccounts: '15 social accounts',
      aiCredits: '400 AI studio generations / mo',
      workspaces: '5 brand workspaces',
      collaboration: '5 team members + roles',
    },
    features: [
      'WhatsApp Business Cloud API template queue',
      'Role-based team permissions',
      'Shared brand media & hashtag library',
    ],
  },
  {
    id: 'agency',
    name: 'Agency',
    audience: 'For digital marketing agencies & studios',
    priceMonthlyInr: '₹1,999+',
    cadence: 'per month (proposed)',
    limits: {
      scheduledPosts: 'Unlimited across clients',
      socialAccounts: 'Unlimited client accounts',
      aiCredits: 'Unlimited AI Studio priority',
      workspaces: 'Unlimited client workspaces',
      collaboration: 'Unlimited seats + approval flows',
    },
    features: [
      'Client workspace isolation & switching',
      'External client content approval workflows',
      'White-label performance reports',
    ],
  },
];

export const SAMPLE_ASSETS = {
  avatar: '/src/assets/images/creator_avatar_main_1794724057123.jpg',
  reelCoffee: '/src/assets/images/reel_cover_coffee_1794724057853.jpg',
  reelProduct: '/src/assets/images/reel_cover_product_1794724059079.jpg',
  postWorkspace: '/src/assets/images/post_cover_workspace_1794724058283.jpg',
};
