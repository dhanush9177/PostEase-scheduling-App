import { useMemo, useState } from 'react';
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Link2,
  PenSquare,
  Send,
  TrendingUp,
} from 'lucide-react';
import type {
  PlatformId,
  ScheduledPost,
  SocialAccount,
  UserProfile,
  Workspace,
} from '../types/postease';
import { PLATFORMS, SAMPLE_ASSETS } from '../data/platforms';
import { PlatformIcon, StatusLabel } from './PlatformIcon';

interface DashboardScreenProps {
  user: UserProfile;
  workspace: Workspace;
  accounts: SocialAccount[];
  posts: ScheduledPost[];
  onQuickCreatePost: () => void;
  onQuickCreateReel: () => void;
  onQuickSchedule: () => void;
  onOpenConnectAccount: (platform?: PlatformId) => void;
  onEditPost: (post: ScheduledPost) => void;
  onPublishNow: (postId: string) => Promise<void>;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DashboardScreen({
  user,
  workspace,
  accounts,
  posts,
  onQuickCreatePost,
  onQuickCreateReel,
  onQuickSchedule,
  onOpenConnectAccount,
  onEditPost,
  onPublishNow,
}: DashboardScreenProps) {
  const [calendarMode, setCalendarMode] = useState<'week' | 'month'>('week');
  const [calendarAnchor, setCalendarAnchor] = useState<Date>(() => new Date());
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const todayStr = toIsoDate(new Date());

  const stats = useMemo(() => {
    const published = posts.filter((p) => p.status === 'published');
    const scheduled = posts.filter((p) => p.status === 'scheduled' || p.status === 'pending_approval');
    const totalEngagement = published.reduce((acc, p) => {
      const m = p.metrics;
      if (!m) return acc;
      return acc + m.likes + m.comments + m.shares;
    }, 0);
    const connectedCount = accounts.filter((a) => a.connected).length;
    return {
      publishedCount: published.length,
      scheduledCount: scheduled.length,
      totalEngagement,
      connectedCount,
    };
  }, [posts, accounts]);

  const todaysPosts = useMemo(
    () => posts.filter((p) => p.scheduledDate === todayStr),
    [posts, todayStr]
  );

  const recentActivity = useMemo(
    () => [...posts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5),
    [posts]
  );

  const weekDays = useMemo(() => {
    const start = new Date(calendarAnchor);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [calendarAnchor]);

  const monthDays = useMemo(() => {
    const year = calendarAnchor.getFullYear();
    const month = calendarAnchor.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = Array(startOffset).fill(null);
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push(new Date(year, month, i));
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    return cells;
  }, [calendarAnchor]);

  const shiftCalendar = (direction: -1 | 1) => {
    const next = new Date(calendarAnchor);
    if (calendarMode === 'week') {
      next.setDate(next.getDate() + direction * 7);
    } else {
      next.setMonth(next.getMonth() + direction);
    }
    setCalendarAnchor(next);
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Actions */}
      <section className="rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#4648d4] dark:text-[#4cd7f6]">
              {workspace.name} · {user.accountType}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-balance text-[#0b1c30] dark:text-white">
              {getGreeting()}, {user.name.split(' ')[0]}
            </h1>
            <p className="text-sm text-[#464554] dark:text-[#94A3B8]">
              {todaysPosts.length > 0
                ? `You have ${todaysPosts.length} item${todaysPosts.length > 1 ? 's' : ''} slated for today across your channels.`
                : 'Your calendar is open today — draft a reel or schedule a multi-platform update.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onQuickCreatePost}
              className="min-h-[44px] px-4 py-2 rounded-full bg-[#4648d4] hover:bg-[#3a3cc2] dark:bg-gradient-to-r dark:from-[#8B5CF6] dark:to-[#EC4899] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all whitespace-nowrap shrink-0"
            >
              <PenSquare className="w-4 h-4" />
              <span>Create Post</span>
            </button>
            <button
              type="button"
              onClick={onQuickCreateReel}
              className="min-h-[44px] px-4 py-2 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#2f2ebe] dark:bg-[#1A2035] dark:hover:bg-[#232b47] dark:text-[#d0bcff] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Clapperboard className="w-4 h-4" />
              <span>Create Reel</span>
            </button>
            <button
              type="button"
              onClick={onQuickSchedule}
              className="min-h-[44px] px-4 py-2 rounded-full border border-slate-200 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/5 text-[#0b1c30] dark:text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Schedule Content</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenConnectAccount()}
              className="min-h-[44px] px-4 py-2 rounded-full border border-slate-200 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/5 text-[#006c49] dark:text-[#4EDEA3] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Link2 className="w-4 h-4" />
              <span>Connect Account</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4 Key KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-4 sm:p-5">
          <p className="text-xs font-medium text-[#464554] dark:text-[#94A3B8]">
            Total Posts Published
          </p>
          <p className="font-display text-2xl sm:text-3xl font-bold mt-1.5 tabular-nums">
            {stats.publishedCount}
          </p>
          <p className="text-xs text-[#006c49] dark:text-[#4EDEA3] font-medium mt-1">
            Demo + live history
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-4 sm:p-5">
          <p className="text-xs font-medium text-[#464554] dark:text-[#94A3B8]">
            Scheduled Posts
          </p>
          <p className="font-display text-2xl sm:text-3xl font-bold mt-1.5 tabular-nums">
            {stats.scheduledCount}
          </p>
          <p className="text-xs text-[#4648d4] dark:text-[#d0bcff] font-medium mt-1">
            Ready in queue
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-4 sm:p-5">
          <p className="text-xs font-medium text-[#464554] dark:text-[#94A3B8]">
            Total Engagement
          </p>
          <p className="font-display text-2xl sm:text-3xl font-bold mt-1.5 tabular-nums">
            {(stats.totalEngagement + 4920).toLocaleString()}
          </p>
          <p className="text-xs text-[#006c49] dark:text-[#4cd7f6] font-medium mt-1 inline-flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18.4% sample trend</span>
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-4 sm:p-5">
          <p className="text-xs font-medium text-[#464554] dark:text-[#94A3B8]">
            Connected Accounts
          </p>
          <p className="font-display text-2xl sm:text-3xl font-bold mt-1.5 tabular-nums">
            {stats.connectedCount} / 4
          </p>
          <p className="text-xs text-[#464554] dark:text-[#94A3B8] font-medium mt-1">
            OAuth channels active
          </p>
        </div>
      </section>

      {/* Connected Social Accounts Strip */}
      <section className="rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-lg font-bold">Connected Social Accounts</h2>
            <p className="text-xs text-[#464554] dark:text-[#94A3B8]">
              OAuth channels for {workspace.name} · Official APIs &amp; manual handoff clearly marked
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenConnectAccount()}
            className="min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#eff4ff] dark:bg-[#1A2035] text-[#4648d4] dark:text-[#d0bcff] hover:bg-[#dce9ff] dark:hover:bg-[#232b47] transition-colors whitespace-nowrap shrink-0"
          >
            + Add Channel
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {(['instagram', 'facebook', 'youtube', 'whatsapp'] as PlatformId[]).map((pid) => {
            const acc = accounts.find((a) => a.platform === pid && a.connected);
            const meta = PLATFORMS[pid];
            return (
              <button
                key={pid}
                type="button"
                onClick={() => onOpenConnectAccount(pid)}
                className="text-left rounded-xl p-3.5 bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/80 dark:border-white/10 hover:border-[#4648d4]/50 dark:hover:border-[#8B5CF6]/50 transition-colors flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-white dark:bg-[#121624] border border-slate-200/70 dark:border-white/10 flex items-center justify-center shrink-0">
                  <PlatformIcon platform={pid} size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold truncate">{meta.name}</span>
                    <span
                      className={`text-[11px] font-semibold shrink-0 ${
                        acc
                          ? 'text-[#006c49] dark:text-[#4EDEA3]'
                          : 'text-[#825100] dark:text-[#ffb95f]'
                      }`}
                    >
                      {acc ? 'Connected' : 'Connect'}
                    </span>
                  </div>
                  <p className="text-xs text-[#464554] dark:text-[#94A3B8] truncate mt-0.5">
                    {acc ? acc.handle : 'Not linked yet'}
                  </p>
                  <p className="text-[11px] text-[#767586] dark:text-[#64748B] mt-1 tabular-nums">
                    {acc
                      ? `${acc.followers.toLocaleString()} audience · ${
                          pid === 'whatsapp' ? 'Cloud API + Manual Status' : 'OAuth Demo'
                        }`
                      : `Tap to authorize via ${meta.apiName}`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Today's Schedule + Recent Content Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Today's Scheduled Content */}
        <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-lg font-bold">Today&apos;s Scheduled Content</h2>
              <p className="text-xs text-[#464554] dark:text-[#94A3B8] font-mono-num">
                {todayStr}
              </p>
            </div>
            <button
              type="button"
              onClick={onQuickSchedule}
              className="text-xs font-semibold text-[#4648d4] dark:text-[#d0bcff] hover:underline whitespace-nowrap shrink-0"
            >
              Open Scheduler
            </button>
          </div>

          {todaysPosts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4 rounded-xl bg-[#f8f9ff] dark:bg-[#0A0D14]">
              <p className="text-sm font-semibold">No posts queued for today</p>
              <p className="text-xs text-[#464554] dark:text-[#94A3B8] mt-1">
                Create a post or pick a reel from AI Studio to fill today&apos;s slot.
              </p>
              <button
                type="button"
                onClick={onQuickCreatePost}
                className="mt-4 min-h-[40px] px-4 py-2 rounded-full bg-[#4648d4] text-white text-xs font-semibold"
              >
                Schedule for Today
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysPosts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-xl p-3.5 bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/70 dark:border-white/10 flex items-center gap-3.5"
                >
                  <img
                    src={post.mediaUrl || SAMPLE_ASSETS.postWorkspace}
                    alt={post.title}
                    referrerPolicy="no-referrer"
                    className="w-12 h-14 rounded-lg object-cover shrink-0 bg-slate-200 dark:bg-slate-800"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onEditPost(post)}
                        className="text-sm font-bold truncate hover:underline text-left"
                      >
                        {post.title}
                      </button>
                      <StatusLabel status={post.status} />
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-[#464554] dark:text-[#94A3B8]">
                      <div className="flex items-center gap-1">
                        {post.platforms.map((p) => (
                          <PlatformIcon key={p} platform={p} size={14} />
                        ))}
                      </div>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num">{post.scheduledTime}</span>
                    </div>
                  </div>
                  {post.status === 'scheduled' && (
                    <button
                      type="button"
                      disabled={publishingId === post.id}
                      onClick={async () => {
                        setPublishingId(post.id);
                        try {
                          await onPublishNow(post.id);
                        } finally {
                          setPublishingId(null);
                        }
                      }}
                      className="min-h-[38px] px-3 py-1.5 rounded-full bg-white dark:bg-[#1A2035] border border-slate-200 dark:border-white/10 text-xs font-semibold text-[#4648d4] dark:text-[#d0bcff] hover:bg-[#eff4ff] dark:hover:bg-[#232b47] inline-flex items-center gap-1.5 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{publishingId === post.id ? 'Sending...' : 'Publish Demo'}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Content Activity */}
        <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-lg font-bold">Recent Content Activity</h2>
              <p className="text-xs text-[#464554] dark:text-[#94A3B8]">
                Drafts, scheduled queues, published dispatches &amp; action items
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {recentActivity.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => onEditPost(post)}
                className="w-full py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 text-left hover:bg-[#f8f9ff] dark:hover:bg-white/5 px-2 -mx-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex -space-x-1.5 shrink-0">
                    {post.platforms.slice(0, 3).map((pid) => (
                      <span
                        key={pid}
                        className="w-7 h-7 rounded-full bg-white dark:bg-[#1A2035] border border-slate-200 dark:border-white/10 flex items-center justify-center"
                      >
                        <PlatformIcon platform={pid} size={14} />
                      </span>
                    ))}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{post.title}</p>
                    <p className="text-xs text-[#464554] dark:text-[#94A3B8] truncate">
                      <span className="font-mono-num">{post.scheduledDate}</span> · {post.scheduledTime} ·{' '}
                      {post.statusNote || post.createdBy}
                    </p>
                  </div>
                </div>
                <StatusLabel status={post.status} />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Publishing Calendar (Weekly & Monthly Views) */}
      <section className="rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-lg font-bold">Upcoming Publishing Calendar</h2>
            <p className="text-xs text-[#464554] dark:text-[#94A3B8]">
              {calendarAnchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · Tap any item to edit in Scheduler
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 rounded-xl bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/70 dark:border-white/10">
              <button
                type="button"
                onClick={() => setCalendarMode('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  calendarMode === 'week'
                    ? 'bg-white dark:bg-[#1A2035] text-[#4648d4] dark:text-[#d0bcff] shadow-xs'
                    : 'text-[#464554] dark:text-[#94A3B8]'
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setCalendarMode('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  calendarMode === 'month'
                    ? 'bg-white dark:bg-[#1A2035] text-[#4648d4] dark:text-[#d0bcff] shadow-xs'
                    : 'text-[#464554] dark:text-[#94A3B8]'
                }`}
              >
                Monthly
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => shiftCalendar(-1)}
                className="min-h-[36px] min-w-[36px] rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-white/5"
                aria-label="Previous period"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCalendarAnchor(new Date())}
                className="min-h-[36px] px-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/5"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => shiftCalendar(1)}
                className="min-h-[36px] min-w-[36px] rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-white/5"
                aria-label="Next period"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {calendarMode === 'week' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
            {weekDays.map((day) => {
              const iso = toIsoDate(day);
              const dayPosts = posts.filter((p) => p.scheduledDate === iso);
              const isToday = iso === todayStr;
              return (
                <div
                  key={iso}
                  className={`rounded-xl p-3 border min-h-[132px] flex flex-col ${
                    isToday
                      ? 'bg-[#eff4ff]/70 dark:bg-[#8B5CF6]/10 border-[#4648d4]/40 dark:border-[#8B5CF6]/40'
                      : 'bg-[#f8f9ff] dark:bg-[#0A0D14] border-slate-200/70 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#464554] dark:text-[#94A3B8]">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span
                      className={`text-xs font-bold font-mono-num ${
                        isToday ? 'text-[#4648d4] dark:text-[#d0bcff]' : ''
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    {dayPosts.length === 0 ? (
                      <p className="text-[11px] text-[#767586] dark:text-[#64748B] pt-2">
                        Open slot
                      </p>
                    ) : (
                      dayPosts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onEditPost(p)}
                          className="w-full text-left p-2 rounded-lg bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 hover:border-[#4648d4] dark:hover:border-[#8B5CF6] transition-colors"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1">
                              {p.platforms.slice(0, 2).map((pid) => (
                                <PlatformIcon key={pid} platform={pid} size={12} />
                              ))}
                            </div>
                            <span className="text-[10px] font-mono-num text-[#464554] dark:text-[#94A3B8]">
                              {p.scheduledTime}
                            </span>
                          </div>
                          <p className="text-xs font-semibold truncate mt-1">{p.title}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center text-[11px] font-semibold text-[#464554] dark:text-[#94A3B8]">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {monthDays.map((day, idx) => {
                if (!day) {
                  return <div key={`empty_${idx}`} className="min-h-[76px] rounded-xl bg-slate-50/50 dark:bg-white/[0.02]" />;
                }
                const iso = toIsoDate(day);
                const dayPosts = posts.filter((p) => p.scheduledDate === iso);
                const isToday = iso === todayStr;
                return (
                  <div
                    key={iso}
                    className={`min-h-[76px] rounded-xl p-1.5 border flex flex-col ${
                      isToday
                        ? 'bg-[#eff4ff]/70 dark:bg-[#8B5CF6]/10 border-[#4648d4]/40 dark:border-[#8B5CF6]/40'
                        : 'bg-[#f8f9ff] dark:bg-[#0A0D14] border-slate-200/70 dark:border-white/10'
                    }`}
                  >
                    <span className="text-[11px] font-bold font-mono-num px-1">
                      {day.getDate()}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayPosts.slice(0, 2).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onEditPost(p)}
                          className="w-full text-left px-1.5 py-0.5 rounded bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 text-[10px] font-semibold truncate block"
                        >
                          {p.title}
                        </button>
                      ))}
                      {dayPosts.length > 2 && (
                        <span className="text-[10px] text-[#4648d4] dark:text-[#d0bcff] font-semibold px-1">
                          +{dayPosts.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
