import { useMemo, useState } from 'react';
import {
  Eye,
  Heart,
  Info,
  MessageCircle,
  Share2,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { PlatformId } from '../types/postease';
import { PLATFORMS, SAMPLE_ASSETS } from '../data/platforms';
import { PlatformIcon } from './PlatformIcon';

const WEEKLY_SERIES = [
  { label: 'Mon', views: 14200, engagement: 1120 },
  { label: 'Tue', views: 18600, engagement: 1490 },
  { label: 'Wed', views: 16400, engagement: 1380 },
  { label: 'Thu', views: 24900, engagement: 2150 },
  { label: 'Fri', views: 31200, engagement: 2890 },
  { label: 'Sat', views: 28400, engagement: 2610 },
  { label: 'Sun', views: 36800, engagement: 3420 },
];

const MONTHLY_SERIES = [
  { label: 'Wk 1', views: 92400, engagement: 7420 },
  { label: 'Wk 2', views: 118500, engagement: 9840 },
  { label: 'Wk 3', views: 144200, engagement: 12190 },
  { label: 'Wk 4', views: 170500, engagement: 15060 },
];

const PLATFORM_BREAKDOWN: {
  platform: PlatformId;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  followers: number;
  engagementRate: number;
  topFormat: string;
}[] = [
  {
    platform: 'instagram',
    views: 248400,
    likes: 21450,
    comments: 1480,
    shares: 3920,
    followers: 48200,
    engagementRate: 6.8,
    topFormat: '9:16 Reels',
  },
  {
    platform: 'youtube',
    views: 196200,
    likes: 14200,
    comments: 940,
    shares: 2110,
    followers: 21400,
    engagementRate: 5.4,
    topFormat: 'YouTube Shorts',
  },
  {
    platform: 'facebook',
    views: 64800,
    likes: 3410,
    comments: 420,
    shares: 890,
    followers: 15800,
    engagementRate: 3.9,
    topFormat: 'Page Reels',
  },
  {
    platform: 'whatsapp',
    views: 16200,
    likes: 0,
    comments: 1240,
    shares: 680,
    followers: 3420,
    engagementRate: 11.8,
    topFormat: 'VIP Broadcasts',
  },
];

const TOP_CONTENT = [
  {
    id: 'top_1',
    title: 'Iced Matcha Espresso Layering Reel',
    platform: 'instagram' as PlatformId,
    format: 'Instagram Reel',
    views: 84200,
    likes: 7640,
    comments: 412,
    shares: 1290,
    thumbnail: SAMPLE_ASSETS.reelCoffee,
  },
  {
    id: 'top_2',
    title: 'Aura Obsidian ANC Product Showcase',
    platform: 'youtube' as PlatformId,
    format: 'YouTube Short',
    views: 62900,
    likes: 4920,
    comments: 298,
    shares: 845,
    thumbnail: SAMPLE_ASSETS.reelProduct,
  },
  {
    id: 'top_3',
    title: '2026 Minimalist Creator Desk Rig',
    platform: 'facebook' as PlatformId,
    format: 'Facebook Page Post',
    views: 31400,
    likes: 1840,
    comments: 164,
    shares: 512,
    thumbnail: SAMPLE_ASSETS.postWorkspace,
  },
];

export function AnalyticsScreen() {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [platformFilter, setPlatformFilter] = useState<PlatformId | 'all'>('all');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const filteredBreakdown = useMemo(() => {
    if (platformFilter === 'all') return PLATFORM_BREAKDOWN;
    return PLATFORM_BREAKDOWN.filter((p) => p.platform === platformFilter);
  }, [platformFilter]);

  const totals = useMemo(() => {
    const scale = period === 'weekly' ? 0.34 : 1;
    const views = Math.round(filteredBreakdown.reduce((s, p) => s + p.views, 0) * scale);
    const likes = Math.round(filteredBreakdown.reduce((s, p) => s + p.likes, 0) * scale);
    const comments = Math.round(filteredBreakdown.reduce((s, p) => s + p.comments, 0) * scale);
    const shares = Math.round(filteredBreakdown.reduce((s, p) => s + p.shares, 0) * scale);
    const followers = filteredBreakdown.reduce((s, p) => s + p.followers, 0);
    const avgRate =
      filteredBreakdown.reduce((s, p) => s + p.engagementRate, 0) / filteredBreakdown.length;
    return { views, likes, comments, shares, followers, avgRate };
  }, [filteredBreakdown, period]);

  const activeSeries = period === 'weekly' ? WEEKLY_SERIES : MONTHLY_SERIES;
  const maxViews = Math.max(...activeSeries.map((d) => d.views));

  return (
    <div className="space-y-6">
      {/* Header & Demonstration Label */}
      <section className="rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#0b1c30] dark:text-white">
              Performance Analytics
            </h1>
            <p className="text-sm text-[#464554] dark:text-[#94A3B8] mt-0.5">
              Cross-channel reach, engagement velocity, and top-performing content.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex p-1 rounded-xl bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={() => setPeriod('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  period === 'weekly'
                    ? 'bg-white dark:bg-[#1A2035] text-[#4648d4] dark:text-[#d0bcff] shadow-xs'
                    : 'text-[#464554] dark:text-[#94A3B8]'
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setPeriod('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  period === 'monthly'
                    ? 'bg-white dark:bg-[#1A2035] text-[#4648d4] dark:text-[#d0bcff] shadow-xs'
                    : 'text-[#464554] dark:text-[#94A3B8]'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>

        {/* Honest Demonstration Data Notice */}
        <div className="rounded-xl bg-[#eff4ff] dark:bg-[#1A2035] border border-[#4648d4]/20 dark:border-[#8B5CF6]/30 px-4 py-3 flex items-start gap-3">
          <Info className="w-4 h-4 text-[#4648d4] dark:text-[#4cd7f6] shrink-0 mt-0.5" />
          <p className="text-xs text-[#0b1c30] dark:text-[#e1e2ec] leading-relaxed">
            <strong>Demonstration Data:</strong> Metrics below use realistic sample creator analytics so you can inspect charts and reporting workflows. Live figures sync automatically once Meta Graph API and YouTube Analytics OAuth tokens are connected.
          </p>
        </div>

        {/* Platform Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setPlatformFilter('all')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              platformFilter === 'all'
                ? 'bg-[#4648d4] dark:bg-[#8B5CF6] text-white'
                : 'bg-[#f8f9ff] dark:bg-[#0A0D14] text-[#464554] dark:text-[#94A3B8] border border-slate-200 dark:border-white/10'
            }`}
          >
            All Platforms
          </button>
          {(['instagram', 'youtube', 'facebook', 'whatsapp'] as PlatformId[]).map((pid) => (
            <button
              key={pid}
              type="button"
              onClick={() => setPlatformFilter(pid)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                platformFilter === pid
                  ? 'bg-[#4648d4] dark:bg-[#8B5CF6] text-white'
                  : 'bg-[#f8f9ff] dark:bg-[#0A0D14] text-[#464554] dark:text-[#94A3B8] border border-slate-200 dark:border-white/10'
              }`}
            >
              <PlatformIcon platform={pid} size={14} />
              <span>{PLATFORMS[pid].name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 6 Core Metrics */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Views', value: totals.views.toLocaleString(), delta: '+22.4%', Icon: Eye },
          { label: 'Likes', value: totals.likes.toLocaleString(), delta: '+16.8%', Icon: Heart },
          { label: 'Comments', value: totals.comments.toLocaleString(), delta: '+11.2%', Icon: MessageCircle },
          { label: 'Shares', value: totals.shares.toLocaleString(), delta: '+27.5%', Icon: Share2 },
          { label: 'Followers', value: totals.followers.toLocaleString(), delta: '+1,420', Icon: Users },
          { label: 'Engagement Rate', value: `${totals.avgRate.toFixed(1)}%`, delta: '+0.9 pts', Icon: TrendingUp },
        ].map((metric) => {
          const Icon = metric.Icon;
          return (
            <div
              key={metric.label}
              className="rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-4"
            >
              <div className="flex items-center justify-between text-[#464554] dark:text-[#94A3B8]">
                <span className="text-xs font-medium">{metric.label}</span>
                <Icon className="w-4 h-4" />
              </div>
              <p className="font-display text-xl sm:text-2xl font-bold mt-2 tabular-nums">
                {metric.value}
              </p>
              <p className="text-xs font-semibold text-[#006c49] dark:text-[#4EDEA3] mt-1 tabular-nums">
                {metric.delta}
              </p>
            </div>
          );
        })}
      </section>

      {/* Growth Chart & Platform Performance */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Interactive Growth Bar/Curve Chart */}
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5">
          <div className="flex items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="font-display text-lg font-bold">
                {period === 'weekly' ? 'Weekly Growth Velocity' : 'Monthly Growth Trajectory'}
              </h2>
              <p className="text-xs text-[#464554] dark:text-[#94A3B8]">
                Views &amp; total interactions (sample series)
              </p>
            </div>
            {hoveredIdx !== null && (
              <div className="text-right">
                <p className="text-xs font-bold text-[#4648d4] dark:text-[#d0bcff]">
                  {activeSeries[hoveredIdx].label}
                </p>
                <p className="text-xs font-mono-num">
                  {activeSeries[hoveredIdx].views.toLocaleString()} views ·{' '}
                  {activeSeries[hoveredIdx].engagement.toLocaleString()} eng
                </p>
              </div>
            )}
          </div>

          <div className="h-56 flex items-end gap-3 sm:gap-5 pt-6 pb-2">
            {activeSeries.map((item, idx) => {
              const heightPct = Math.max(14, Math.round((item.views / maxViews) * 100));
              const engPct = Math.max(8, Math.round((item.engagement / maxViews) * 400));
              const isHovered = hoveredIdx === idx;
              return (
                <button
                  key={item.label}
                  type="button"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onFocus={() => setHoveredIdx(idx)}
                  className="flex-1 h-full flex flex-col items-center justify-end gap-2 group focus:outline-none"
                >
                  <span className="text-[11px] font-mono-num text-[#464554] dark:text-[#94A3B8] opacity-80 group-hover:opacity-100">
                    {(item.views / 1000).toFixed(1)}k
                  </span>
                  <div className="w-full max-w-[44px] h-full flex items-end justify-center gap-1">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-xl transition-all duration-200 ${
                        isHovered
                          ? 'bg-[#4648d4] dark:bg-gradient-to-t dark:from-[#8B5CF6] dark:to-[#EC4899]'
                          : 'bg-[#4648d4]/75 dark:bg-[#8B5CF6]/70'
                      }`}
                    />
                    <div
                      style={{ height: `${Math.min(100, engPct)}%` }}
                      className="w-2.5 rounded-t-md bg-[#006c49] dark:bg-[#4cd7f6]"
                    />
                  </div>
                  <span className="text-xs font-semibold text-[#464554] dark:text-[#94A3B8]">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-5 pt-3 border-t border-slate-100 dark:border-white/5 text-xs text-[#464554] dark:text-[#94A3B8]">
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#4648d4] dark:bg-[#8B5CF6]" />
              <span>Views</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#006c49] dark:bg-[#4cd7f6]" />
              <span>Interactions</span>
            </span>
          </div>
        </div>

        {/* Platform-wise Performance */}
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5">
          <h2 className="font-display text-lg font-bold mb-1">Platform-Wise Performance</h2>
          <p className="text-xs text-[#464554] dark:text-[#94A3B8] mb-4">
            Audience &amp; engagement rate by channel
          </p>

          <div className="space-y-3">
            {filteredBreakdown.map((row) => {
              const meta = PLATFORMS[row.platform];
              return (
                <div
                  key={row.platform}
                  className="rounded-xl p-3.5 bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/70 dark:border-white/10 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <PlatformIcon platform={row.platform} size={18} />
                      <span className="text-sm font-bold">{meta.name}</span>
                    </div>
                    <span className="text-xs font-bold font-mono-num text-[#006c49] dark:text-[#4EDEA3]">
                      {row.engagementRate}% eng
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#464554] dark:text-[#94A3B8] tabular-nums">
                    <span>{row.views.toLocaleString()} views</span>
                    <span>{row.followers.toLocaleString()} followers</span>
                    <span>Top: {row.topFormat}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Best-Performing Content */}
      <section className="rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5">
        <h2 className="font-display text-lg font-bold mb-1">Best-Performing Content</h2>
        <p className="text-xs text-[#464554] dark:text-[#94A3B8] mb-4">
          Ranked by total views &amp; share velocity
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TOP_CONTENT.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl overflow-hidden bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/80 dark:border-white/10 flex flex-col"
            >
              <div className="relative h-44 bg-slate-200 dark:bg-slate-800">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-white/90">
                    <PlatformIcon platform={item.platform} size={14} />
                    <span>{item.format}</span>
                  </div>
                  <p className="font-display text-sm font-bold truncate mt-0.5">{item.title}</p>
                </div>
              </div>

              <div className="p-3.5 grid grid-cols-4 gap-2 text-center tabular-nums">
                <div>
                  <p className="text-[11px] text-[#464554] dark:text-[#94A3B8]">Views</p>
                  <p className="text-xs font-bold mt-0.5">{(item.views / 1000).toFixed(1)}k</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#464554] dark:text-[#94A3B8]">Likes</p>
                  <p className="text-xs font-bold mt-0.5">{item.likes.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#464554] dark:text-[#94A3B8]">Comments</p>
                  <p className="text-xs font-bold mt-0.5">{item.comments}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#464554] dark:text-[#94A3B8]">Shares</p>
                  <p className="text-xs font-bold mt-0.5">{item.shares}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
