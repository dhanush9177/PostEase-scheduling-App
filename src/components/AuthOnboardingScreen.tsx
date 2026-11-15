import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  Film,
  KeyRound,
  Moon,
  Sparkles,
  Sun,
  UserCheck,
  Users,
} from 'lucide-react';
import type { AccountType, UserProfile } from '../types/postease';
import { apiRequest, setStoredToken } from '../lib/api';
import { SAMPLE_ASSETS } from '../data/platforms';

interface AuthOnboardingScreenProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onAuthenticated: (user: UserProfile) => void;
}

type AuthMode = 'welcome' | 'login' | 'signup' | 'forgot' | 'onboarding';

const ACCOUNT_TYPES: {
  id: AccountType;
  title: string;
  desc: string;
  Icon: typeof Sparkles;
}[] = [
  {
    id: 'Content Creator',
    title: 'Content Creator',
    desc: 'Solo educators, vloggers, and short-form storytellers.',
    Icon: Film,
  },
  {
    id: 'Influencer',
    title: 'Influencer',
    desc: 'Personal brand partnerships, Reels, and community drops.',
    Icon: UserCheck,
  },
  {
    id: 'Small Business',
    title: 'Small Business',
    desc: 'Local shops, D2C brands, and WhatsApp VIP broadcasts.',
    Icon: Building2,
  },
  {
    id: 'Marketing Agency',
    title: 'Marketing Agency',
    desc: 'Multi-client workspaces, team roles, and approvals.',
    Icon: Users,
  },
];

export function AuthOnboardingScreen({
  theme,
  onToggleTheme,
  onAuthenticated,
}: AuthOnboardingScreenProps) {
  const [mode, setMode] = useState<AuthMode>('welcome');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('Content Creator');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ token: string; user: UserProfile }>('/api/auth/demo-login', {
        method: 'POST',
      });
      setStoredToken(res.token);
      onAuthenticated(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start demo workspace.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ token: string; user: UserProfile }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setStoredToken(res.token);
      onAuthenticated(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupStepOne = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Enter your name, email, and a password of at least 6 characters.');
      return;
    }
    setError(null);
    setMode('onboarding');
  };

  const handleCompleteOnboarding = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ token: string; user: UserProfile }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          accountType,
          handle,
          bio,
        }),
      });
      setStoredToken(res.token);
      onAuthenticated(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await apiRequest<{ message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setNotice(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] dark:bg-[#0A0D14] text-[#0b1c30] dark:text-[#e1e2ec] flex flex-col">
      {/* Top Bar */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            setMode('welcome');
            setError(null);
            setNotice(null);
          }}
          className="font-display text-xl font-extrabold tracking-tight text-[#0b1c30] dark:text-white whitespace-nowrap shrink-0"
        >
          PostEase
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121624] text-[#464554] dark:text-[#cbc3d7] hover:bg-slate-50 dark:hover:bg-[#1A2035] transition-colors"
            aria-label="Toggle light or dark theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {mode !== 'login' && (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className="min-h-[40px] px-4 py-2 rounded-full text-sm font-semibold text-[#464554] dark:text-[#cbc3d7] hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
            >
              Log in
            </button>
          )}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="min-h-[40px] px-4 py-2 rounded-full text-sm font-semibold bg-[#4648d4] hover:bg-[#3b3dc2] dark:bg-gradient-to-r dark:from-[#8B5CF6] dark:to-[#EC4899] text-white transition-all whitespace-nowrap shrink-0"
          >
            Open Demo
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Hero / Value Narrative */}
        <section className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-bold tracking-wide text-[#4648d4] dark:text-[#4cd7f6]">
              Create · Schedule · Publish · Grow
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-balance text-[#0b1c30] dark:text-white">
              One calm studio for Reels, Shorts &amp; daily social growth.
            </h1>
            <p className="text-base text-[#464554] dark:text-[#94A3B8] max-w-xl leading-relaxed">
              Plan Instagram, Facebook, YouTube, and WhatsApp Business from a single calendar, generate Gemini-powered scripts and storyboards, and keep client approvals effortless.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-4 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-[#eff4ff] dark:bg-[#8B5CF6]/20 flex items-center justify-center text-[#4648d4] dark:text-[#d0bcff]">
                <CalendarClock className="w-4 h-4" />
              </div>
              <h3 className="font-display text-sm font-bold">Multi-Platform Scheduler</h3>
              <p className="text-xs text-[#464554] dark:text-[#94A3B8]">
                Visual drag-and-drop calendar with clear API vs. manual WhatsApp Status handoffs.
              </p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-4 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-[#ecfdf5] dark:bg-[#EC4899]/20 flex items-center justify-center text-[#006c49] dark:text-[#ffb0cd]">
                <Film className="w-4 h-4" />
              </div>
              <h3 className="font-display text-sm font-bold">AI Reel Studio</h3>
              <p className="text-xs text-[#464554] dark:text-[#94A3B8]">
                Turn topics or product photos into timed scripts, storyboards, and motion previews.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <img
              src={SAMPLE_ASSETS.avatar}
              alt="Creator studio preview"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-white/15"
            />
            <div className="text-xs text-[#464554] dark:text-[#94A3B8]">
              <span className="font-semibold text-[#0b1c30] dark:text-white">
                Demo Workspace Ready
              </span>{' '}
              — Explore pre-populated Reels, Analytics, and Team Approvals as Maya Lin.
            </div>
          </div>
        </section>

        {/* Right Interactive Auth / Onboarding Card */}
        <section className="lg:col-span-6">
          <div className="rounded-3xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 shadow-[0_12px_32px_-4px_rgba(70,72,212,0.08)] dark:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.6)] p-6 sm:p-8">
            {mode === 'welcome' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#0b1c30] dark:text-white">
                    Welcome to PostEase
                  </h2>
                  <p className="text-sm text-[#464554] dark:text-[#94A3B8] mt-1">
                    Create your creator workspace or jump straight into the live studio.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    disabled={loading}
                    className="w-full min-h-[48px] px-5 py-3 rounded-full bg-[#4648d4] hover:bg-[#3a3cc2] dark:bg-gradient-to-r dark:from-[#8B5CF6] dark:to-[#EC4899] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <span>{loading ? 'Opening Workspace...' : 'Continue with Demo Workspace'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                    }}
                    className="w-full min-h-[48px] px-5 py-3 rounded-full border border-slate-200 dark:border-white/15 bg-[#f8f9ff] dark:bg-[#1A2035] hover:bg-[#eff4ff] dark:hover:bg-[#232a45] text-[#0b1c30] dark:text-white font-semibold text-sm transition-colors"
                  >
                    Create New Account
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className="w-full min-h-[44px] px-5 py-2.5 rounded-full text-sm font-semibold text-[#464554] dark:text-[#94A3B8] hover:text-[#0b1c30] dark:hover:text-white transition-colors"
                  >
                    Already have an account? Sign in
                  </button>
                </div>
              </div>
            )}

            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <h2 className="font-display text-2xl font-bold">Sign in to PostEase</h2>
                  <p className="text-xs text-[#464554] dark:text-[#94A3B8] mt-1">
                    Demo credentials: <span className="font-mono-num">maya@postease.studio</span> /{' '}
                    <span className="font-mono-num">postease2026</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maya@postease.studio"
                    className="w-full min-h-[44px] rounded-xl px-3.5 py-2.5 text-sm bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#4648d4] dark:focus:border-[#8B5CF6]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                      }}
                      className="text-xs font-semibold text-[#4648d4] dark:text-[#d0bcff] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full min-h-[44px] rounded-xl px-3.5 py-2.5 text-sm bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#4648d4] dark:focus:border-[#8B5CF6]"
                  />
                </div>

                {error && (
                  <p className="text-xs font-medium text-[#ba1a1a] dark:text-[#ffb4ab] bg-[#ffdad6]/40 dark:bg-[#93000a]/30 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[48px] rounded-full bg-[#4648d4] hover:bg-[#3a3cc2] dark:bg-gradient-to-r dark:from-[#8B5CF6] dark:to-[#EC4899] text-white font-semibold text-sm transition-all disabled:opacity-60"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                    }}
                    className="font-semibold text-[#4648d4] dark:text-[#d0bcff] hover:underline"
                  >
                    Create an account
                  </button>
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    className="font-semibold text-[#006c49] dark:text-[#4EDEA3] hover:underline"
                  >
                    1-Click Demo Login
                  </button>
                </div>
              </form>
            )}

            {mode === 'signup' && (
              <form onSubmit={handleSignupStepOne} className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-[#4648d4] dark:text-[#4cd7f6]">
                    Step 1 of 2 · Account Details
                  </p>
                  <h2 className="font-display text-2xl font-bold mt-0.5">Create your account</h2>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Ananya Sharma"
                    className="w-full min-h-[44px] rounded-xl px-3.5 py-2.5 text-sm bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#4648d4] dark:focus:border-[#8B5CF6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Work Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@brand.com"
                    className="w-full min-h-[44px] rounded-xl px-3.5 py-2.5 text-sm bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#4648d4] dark:focus:border-[#8B5CF6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Password (min 6 characters)</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="w-full min-h-[44px] rounded-xl px-3.5 py-2.5 text-sm bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#4648d4] dark:focus:border-[#8B5CF6]"
                  />
                </div>

                {error && (
                  <p className="text-xs font-medium text-[#ba1a1a] dark:text-[#ffb4ab] bg-[#ffdad6]/40 dark:bg-[#93000a]/30 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full min-h-[48px] rounded-full bg-[#4648d4] hover:bg-[#3a3cc2] dark:bg-gradient-to-r dark:from-[#8B5CF6] dark:to-[#EC4899] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <span>Continue to Profile Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full text-center text-xs font-semibold text-[#464554] dark:text-[#94A3B8] hover:underline"
                >
                  Already have an account? Sign in
                </button>
              </form>
            )}

            {mode === 'onboarding' && (
              <form onSubmit={handleCompleteOnboarding} className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-[#4648d4] dark:text-[#4cd7f6]">
                    Step 2 of 2 · Personalize Your Studio
                  </p>
                  <h2 className="font-display text-2xl font-bold mt-0.5">How will you use PostEase?</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ACCOUNT_TYPES.map((type) => {
                    const active = accountType === type.id;
                    const Icon = type.Icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setAccountType(type.id)}
                        className={`text-left p-3.5 rounded-2xl border transition-all ${
                          active
                            ? 'border-[#4648d4] bg-[#eff4ff] dark:border-[#8B5CF6] dark:bg-[#8B5CF6]/15'
                            : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Icon
                            className={`w-4 h-4 ${
                              active
                                ? 'text-[#4648d4] dark:text-[#d0bcff]'
                                : 'text-[#464554] dark:text-[#94A3B8]'
                            }`}
                          />
                          {active && (
                            <CheckCircle2 className="w-4 h-4 text-[#4648d4] dark:text-[#d0bcff]" />
                          )}
                        </div>
                        <p className="font-display text-sm font-bold mt-2">{type.title}</p>
                        <p className="text-xs text-[#464554] dark:text-[#94A3B8] mt-0.5">
                          {type.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Creator / Brand Handle</label>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="@yourbrand"
                      className="w-full min-h-[44px] rounded-xl px-3.5 py-2.5 text-sm bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#4648d4] dark:focus:border-[#8B5CF6]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Short Bio / Niche</label>
                    <input
                      type="text"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="e.g., Specialty coffee & tech"
                      className="w-full min-h-[44px] rounded-xl px-3.5 py-2.5 text-sm bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#4648d4] dark:focus:border-[#8B5CF6]"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs font-medium text-[#ba1a1a] dark:text-[#ffb4ab] bg-[#ffdad6]/40 dark:bg-[#93000a]/30 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="min-h-[48px] px-4 rounded-full text-sm font-semibold text-[#464554] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-white/10"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 min-h-[48px] rounded-full bg-[#4648d4] hover:bg-[#3a3cc2] dark:bg-gradient-to-r dark:from-[#8B5CF6] dark:to-[#EC4899] text-white font-semibold text-sm transition-all disabled:opacity-60"
                  >
                    {loading ? 'Setting up Studio...' : 'Launch My PostEase Studio'}
                  </button>
                </div>
              </form>
            )}

            {mode === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <KeyRound className="w-5 h-5 text-[#4648d4] dark:text-[#d0bcff]" />
                  <h2 className="font-display text-2xl font-bold">Reset Password</h2>
                </div>
                <p className="text-xs text-[#464554] dark:text-[#94A3B8]">
                  Enter the email linked to your PostEase workspace and we will queue a reset link.
                </p>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@brand.com"
                    className="w-full min-h-[44px] rounded-xl px-3.5 py-2.5 text-sm bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#4648d4] dark:focus:border-[#8B5CF6]"
                  />
                </div>

                {error && (
                  <p className="text-xs font-medium text-[#ba1a1a] dark:text-[#ffb4ab] bg-[#ffdad6]/40 dark:bg-[#93000a]/30 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}
                {notice && (
                  <p className="text-xs font-medium text-[#006c49] dark:text-[#4EDEA3] bg-[#ecfdf5] dark:bg-[#005236]/40 rounded-xl px-3 py-2">
                    {notice}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[48px] rounded-full bg-[#4648d4] hover:bg-[#3a3cc2] dark:bg-gradient-to-r dark:from-[#8B5CF6] dark:to-[#EC4899] text-white font-semibold text-sm"
                >
                  {loading ? 'Sending...' : 'Send Reset Instructions'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setNotice(null);
                  }}
                  className="w-full text-center text-xs font-semibold text-[#464554] dark:text-[#94A3B8] hover:underline"
                >
                  Back to Sign In
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
