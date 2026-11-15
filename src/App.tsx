import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bell,
  CalendarClock,
  Check,
  ChevronDown,
  Clapperboard,
  Home,
  LogOut,
  Moon,
  Plus,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import type {
  AppNotification,
  AspectRatio,
  PlatformId,
  ScheduledPost,
  SocialAccount,
  UserProfile,
  Workspace,
} from './types/postease';
import { apiRequest, setStoredToken } from './lib/api';
import { AuthOnboardingScreen } from './components/AuthOnboardingScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { SchedulerScreen } from './components/SchedulerScreen';
import { AIStudioScreen } from './components/AIStudioScreen';
import { AnalyticsScreen } from './components/AnalyticsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { OAuthConnectModal } from './components/OAuthConnectModal';
import { SAMPLE_ASSETS } from './data/platforms';

type NavTab = 'home' | 'schedule' | 'ai_studio' | 'analytics' | 'settings';

interface BootstrapPayload {
  authenticated: boolean;
  user: UserProfile | null;
  workspaces: Workspace[];
  accounts: SocialAccount[];
  posts: ScheduledPost[];
  notifications: AppNotification[];
  integrations: {
    geminiConfigured: boolean;
    metaConfigured: boolean;
    youtubeConfigured: boolean;
    whatsappConfigured: boolean;
  };
}

const NAV_ITEMS: { id: NavTab; label: string; Icon: typeof Home }[] = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'schedule', label: 'Schedule', Icon: CalendarClock },
  { id: 'ai_studio', label: 'AI Studio', Icon: Clapperboard },
  { id: 'analytics', label: 'Analytics', Icon: BarChart3 },
  { id: 'settings', label: 'Settings', Icon: Settings },
];

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('');
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [integrations, setIntegrations] = useState({
    geminiConfigured: false,
    metaConfigured: false,
    youtubeConfigured: false,
    whatsappConfigured: false,
  });

  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('postease_theme');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [oauthModal, setOauthModal] = useState<{ open: boolean; platform: PlatformId }>({
    open: false,
    platform: 'instagram',
  });

  const [schedulerSeed, setSchedulerSeed] = useState<{
    title?: string;
    caption?: string;
    hashtags?: string[];
    mediaUrl?: string;
    aspectRatio?: AspectRatio;
    platforms?: PlatformId[];
  } | null>(null);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);

  // Sync theme to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('postease_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = async () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (user) {
      try {
        await apiRequest('/api/auth/profile', {
          method: 'PATCH',
          body: JSON.stringify({ theme: next }),
        });
      } catch {
        // ignore background preference sync error
      }
    }
  };

  const loadBootstrap = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<BootstrapPayload>('/api/bootstrap');
      setIntegrations(data.integrations);
      if (data.authenticated && data.user) {
        setUser(data.user);
        setWorkspaces(data.workspaces);
        setAccounts(data.accounts);
        setPosts(data.posts);
        setNotifications(data.notifications);
        if (data.workspaces.length > 0) {
          setActiveWorkspaceId((prev) =>
            data.workspaces.some((w) => w.id === prev) ? prev : data.workspaces[0].id
          );
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0],
    [workspaces, activeWorkspaceId]
  );

  const workspaceAccounts = useMemo(
    () => accounts.filter((a) => a.workspaceId === activeWorkspace?.id),
    [accounts, activeWorkspace]
  );

  const workspacePosts = useMemo(
    () => posts.filter((p) => p.workspaceId === activeWorkspace?.id),
    [posts, activeWorkspace]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const handleLogout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setStoredToken(null);
    setUser(null);
    setActiveTab('home');
  };

  const handleMarkNotificationsRead = async () => {
    try {
      const res = await apiRequest<{ notifications: AppNotification[] }>(
        '/api/notifications/mark-read',
        { method: 'POST' }
      );
      setNotifications(res.notifications);
    } catch {
      // ignore
    }
  };

  const handlePublishNow = async (postId: string) => {
    const res = await apiRequest<{ post: ScheduledPost }>(`/api/posts/${postId}/publish-now`, {
      method: 'POST',
    });
    setPosts((prev) => prev.map((p) => (p.id === postId ? res.post : p)));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] dark:bg-[#0A0D14] flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="font-display text-2xl font-extrabold text-[#4648d4] dark:text-[#d0bcff]">
            PostEase
          </p>
          <p className="text-xs text-[#464554] dark:text-[#94A3B8]">
            Loading your studio workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !activeWorkspace) {
    return (
      <AuthOnboardingScreen
        theme={theme}
        onToggleTheme={toggleTheme}
        onAuthenticated={async () => {
          await loadBootstrap();
        }}
      />
    );
  }

  const currentTabTitle =
    NAV_ITEMS.find((item) => item.id === activeTab)?.label || 'Home';

  return (
    <div className="min-h-screen bg-[#f8f9ff] dark:bg-[#0A0D14] text-[#0b1c30] dark:text-[#e1e2ec] flex flex-col lg:flex-row">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 bg-white dark:bg-[#121624] border-r border-slate-200/80 dark:border-white/10 p-5 justify-between z-30">
        <div className="space-y-6">
          {/* Brand Wordmark */}
          <div className="flex items-center justify-between">
            <span className="font-display text-2xl font-extrabold tracking-tight text-[#0b1c30] dark:text-white">
              PostEase
            </span>
          </div>

          {/* Workspace Switcher */}
          <div className="space-y-1.5">
            <label
              htmlFor="desktop-workspace-select"
              className="block text-[11px] font-semibold text-[#464554] dark:text-[#94A3B8]"
            >
              Active Workspace
            </label>
            <div className="relative">
              <select
                id="desktop-workspace-select"
                value={activeWorkspace.id}
                onChange={(e) => setActiveWorkspaceId(e.target.value)}
                className="w-full appearance-none min-h-[42px] rounded-xl pl-3 pr-8 text-xs font-bold bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#4648d4] dark:focus:border-[#8B5CF6]"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name} {ws.isClientWorkspace ? '(Client)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#464554] dark:text-[#94A3B8]" />
            </div>
          </div>

          {/* 5 Main Navigation Links */}
          <nav className="space-y-1" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.Icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors ${
                    active
                      ? 'bg-[#eff4ff] text-[#4648d4] dark:bg-[#8B5CF6]/20 dark:text-[#d0bcff]'
                      : 'text-[#464554] dark:text-[#94A3B8] hover:bg-slate-100/70 dark:hover:bg-white/5 hover:text-[#0b1c30] dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Primary Sidebar CTA */}
          <button
            type="button"
            onClick={() => {
              setEditingPost(null);
              setSchedulerSeed(null);
              setActiveTab('schedule');
            }}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-full bg-[#4648d4] hover:bg-[#3a3cc2] dark:bg-gradient-to-r dark:from-[#8B5CF6] dark:to-[#EC4899] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Post</span>
          </button>
        </div>

        {/* User Profile Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-80"
          >
            <img
              src={user.avatarUrl || SAMPLE_ASSETS.avatar}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-white/10 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{user.name}</p>
              <p className="text-[11px] text-[#464554] dark:text-[#94A3B8] truncate">
                {user.accountType}
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center text-[#464554] dark:text-[#94A3B8] hover:text-[#ba1a1a] hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Sticky Top Header (Mobile <= 52px, Desktop 64px) */}
        <header className="sticky top-0 z-20 h-[52px] lg:h-16 bg-white/90 dark:bg-[#121624]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="lg:hidden font-display text-lg font-extrabold text-[#0b1c30] dark:text-white whitespace-nowrap shrink-0">
              PostEase
            </span>
            <span className="hidden lg:inline text-sm font-semibold text-[#464554] dark:text-[#94A3B8] truncate">
              {activeWorkspace.name} <span className="mx-1.5">/</span>{' '}
              <span className="text-[#0b1c30] dark:text-white">{currentTabTitle}</span>
            </span>

            {/* Mobile workspace switcher */}
            <select
              value={activeWorkspace.id}
              onChange={(e) => setActiveWorkspaceId(e.target.value)}
              aria-label="Switch brand workspace"
              className="lg:hidden max-w-[140px] truncate text-xs font-semibold bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="min-h-[40px] min-w-[40px] rounded-full flex items-center justify-center text-[#464554] dark:text-[#cbc3d7] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="relative min-h-[40px] min-w-[40px] rounded-full flex items-center justify-center text-[#464554] dark:text-[#cbc3d7] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              aria-label="Open notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#4648d4] dark:bg-[#EC4899] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="min-h-[40px] min-w-[40px] rounded-full flex items-center justify-center"
              aria-label="Open profile and settings"
            >
              <img
                src={user.avatarUrl || SAMPLE_ASSETS.avatar}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-white/15"
              />
            </button>
          </div>
        </header>

        {/* Scrollable Screen Viewport */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 pb-24 lg:pb-10">
          {activeTab === 'home' && (
            <DashboardScreen
              user={user}
              workspace={activeWorkspace}
              accounts={workspaceAccounts}
              posts={workspacePosts}
              onQuickCreatePost={() => {
                setEditingPost(null);
                setSchedulerSeed(null);
                setActiveTab('schedule');
              }}
              onQuickCreateReel={() => setActiveTab('ai_studio')}
              onQuickSchedule={() => {
                setEditingPost(null);
                setSchedulerSeed(null);
                setActiveTab('schedule');
              }}
              onOpenConnectAccount={(pid) =>
                setOauthModal({ open: true, platform: pid || 'instagram' })
              }
              onEditPost={(post) => {
                setEditingPost(post);
                setActiveTab('schedule');
              }}
              onPublishNow={handlePublishNow}
            />
          )}

          {activeTab === 'schedule' && (
            <SchedulerScreen
              workspace={activeWorkspace}
              posts={workspacePosts}
              draftSeed={schedulerSeed}
              editingPost={editingPost}
              onClearSeed={() => {
                setSchedulerSeed(null);
                setEditingPost(null);
              }}
              onPostSaved={(saved, isNew) => {
                setPosts((prev) =>
                  isNew ? [saved, ...prev] : prev.map((p) => (p.id === saved.id ? saved : p))
                );
              }}
              onPostDeleted={(postId) => {
                setPosts((prev) => prev.filter((p) => p.id !== postId));
              }}
            />
          )}

          {activeTab === 'ai_studio' && (
            <AIStudioScreen
              geminiConfigured={integrations.geminiConfigured}
              onSendToScheduler={(seed) => {
                setEditingPost(null);
                setSchedulerSeed(seed);
                setActiveTab('schedule');
              }}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsScreen />}

          {activeTab === 'settings' && (
            <SettingsScreen
              user={user}
              workspaces={workspaces}
              activeWorkspace={activeWorkspace}
              accounts={workspaceAccounts}
              posts={workspacePosts}
              theme={theme}
              onToggleTheme={toggleTheme}
              onSelectWorkspace={(wsId) => setActiveWorkspaceId(wsId)}
              onOpenConnectAccount={(pid) =>
                setOauthModal({ open: true, platform: pid || 'instagram' })
              }
              onUserUpdated={(updatedUser) => setUser(updatedUser)}
              onWorkspaceAdded={(ws) => {
                setWorkspaces((prev) => [...prev, ws]);
                setActiveWorkspaceId(ws.id);
              }}
              onWorkspaceUpdated={(ws) => {
                setWorkspaces((prev) => prev.map((item) => (item.id === ws.id ? ws : item)));
              }}
              onAccountUpdated={(acc) => {
                setAccounts((prev) => prev.map((a) => (a.id === acc.id ? acc : a)));
              }}
              onPostUpdated={(updatedPost) => {
                setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
              }}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* Mobile Fixed 5-Tab Bottom Navigation Bar (height 64px) */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-white/95 dark:bg-[#121624]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-white/10 grid grid-cols-5 items-center px-1"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.Icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors ${
                active
                  ? 'text-[#4648d4] dark:text-[#d0bcff]'
                  : 'text-[#464554] dark:text-[#94A3B8]'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 1.9} />
              <span className="text-[10px] font-semibold tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* OAuth Connection Modal */}
      <OAuthConnectModal
        isOpen={oauthModal.open}
        workspaceId={activeWorkspace.id}
        initialPlatform={oauthModal.platform}
        liveConfigured={integrations}
        onClose={() => setOauthModal((prev) => ({ ...prev, open: false }))}
        onConnected={(account) => {
          setAccounts((prev) => {
            const exists = prev.some((a) => a.id === account.id);
            return exists
              ? prev.map((a) => (a.id === account.id ? account : a))
              : [...prev, account];
          });
        }}
      />

      {/* Notifications Drawer */}
      {notificationsOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-[#0b1c30]/40 dark:bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
        >
          <div className="w-full max-w-sm bg-white dark:bg-[#121624] h-full border-l border-slate-200 dark:border-white/10 p-5 flex flex-col justify-between">
            <div className="space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <h2 className="font-display text-lg font-bold">Notifications</h2>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                  className="min-h-[36px] min-w-[36px] rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10"
                  aria-label="Close notifications"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {notifications.length === 0 ? (
                <p className="text-xs text-[#464554] dark:text-[#94A3B8] py-8 text-center">
                  You&apos;re all caught up.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`rounded-xl p-3.5 border text-xs space-y-1 ${
                        n.read
                          ? 'bg-[#f8f9ff] dark:bg-[#0A0D14] border-slate-200/60 dark:border-white/5 opacity-80'
                          : 'bg-[#eff4ff] dark:bg-[#1A2035] border-[#4648d4]/30 dark:border-[#8B5CF6]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold">{n.title}</span>
                        <span className="text-[10px] text-[#464554] dark:text-[#94A3B8]">
                          {n.timeLabel}
                        </span>
                      </div>
                      <p className="text-[#464554] dark:text-[#94A3B8] leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleMarkNotificationsRead}
              className="w-full min-h-[44px] rounded-full border border-slate-200 dark:border-white/15 text-xs font-semibold inline-flex items-center justify-center gap-2 mt-4"
            >
              <Check className="w-4 h-4" />
              <span>Mark All as Read</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
