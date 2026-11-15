import { useState, type FormEvent } from 'react';
import {
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  HelpCircle,
  LogOut,
  Moon,
  Plus,
  ShieldCheck,
  Sun,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import type {
  AccountType,
  PlanTierId,
  PlatformId,
  ScheduledPost,
  SocialAccount,
  TeamRole,
  UserProfile,
  Workspace,
} from '../types/postease';
import { PLATFORMS, SUBSCRIPTION_PLANS } from '../data/platforms';
import { PlatformIcon, StatusLabel } from './PlatformIcon';
import { apiRequest } from '../lib/api';

interface SettingsScreenProps {
  user: UserProfile;
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  accounts: SocialAccount[];
  posts: ScheduledPost[];
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onSelectWorkspace: (wsId: string) => void;
  onOpenConnectAccount: (platform?: PlatformId) => void;
  onUserUpdated: (user: UserProfile) => void;
  onWorkspaceAdded: (ws: Workspace) => void;
  onWorkspaceUpdated: (ws: Workspace) => void;
  onAccountUpdated: (acc: SocialAccount) => void;
  onPostUpdated: (post: ScheduledPost) => void;
  onLogout: () => Promise<void>;
}

const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French'];
const ACCOUNT_TYPES: AccountType[] = [
  'Content Creator',
  'Influencer',
  'Small Business',
  'Marketing Agency',
];

const FAQS = [
  {
    q: 'Why does PostEase use OAuth instead of social passwords?',
    a: 'Official Meta, Google/YouTube, and WhatsApp Business APIs require OAuth 2.0 tokens so you can revoke access anytime without exposing credentials.',
  },
  {
    q: 'Why is WhatsApp Status marked as manual publishing?',
    a: 'WhatsApp does not provide a public API to auto-publish Status stories. PostEase automates approved Business template messages via Cloud API and builds a 1-tap Status prep kit for manual mobile posting.',
  },
  {
    q: 'Are subscription plans charging my card today?',
    a: 'No. The ₹199–₹1,999+ tiers reflect proposed pricing. No payment gateway is connected in this environment.',
  },
];

export function SettingsScreen({
  user,
  workspaces,
  activeWorkspace,
  accounts,
  posts,
  theme,
  onToggleTheme,
  onSelectWorkspace,
  onOpenConnectAccount,
  onUserUpdated,
  onWorkspaceAdded,
  onWorkspaceUpdated,
  onAccountUpdated,
  onPostUpdated,
  onLogout,
}: SettingsScreenProps) {
  const [section, setSection] = useState<
    'accounts' | 'workspaces' | 'profile' | 'plans' | 'support'
  >('accounts');

  // Profile form
  const [name, setName] = useState(user.name);
  const [handle, setHandle] = useState(user.handle);
  const [accountType, setAccountType] = useState<AccountType>(user.accountType);
  const [bio, setBio] = useState(user.bio);
  const [language, setLanguage] = useState(user.language);
  const [notifications, setNotifications] = useState(user.notifications);

  // Workspace & Team form
  const [newWsName, setNewWsName] = useState('');
  const [newWsIndustry, setNewWsIndustry] = useState('');
  const [isClientWs, setIsClientWs] = useState(true);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<TeamRole>('Editor');

  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pendingApprovals = posts.filter((p) => p.status === 'pending_approval');

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      const res = await apiRequest<{ user: UserProfile }>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          handle,
          accountType,
          bio,
          language,
          notifications,
        }),
      });
      onUserUpdated(res.user);
      setNotice('Profile and preferences saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateWorkspace = async (e: FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      const res = await apiRequest<{ workspace: Workspace }>('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({
          name: newWsName.trim(),
          industry: newWsIndustry.trim() || 'Digital Brand',
          isClientWorkspace: isClientWs,
          clientBrandName: isClientWs ? newWsName.trim() : undefined,
        }),
      });
      onWorkspaceAdded(res.workspace);
      setNewWsName('');
      setNewWsIndustry('');
      setNotice(`Created workspace "${res.workspace.name}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create workspace.');
    } finally {
      setSaving(false);
    }
  };

  const handleInviteMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !memberEmail.trim()) return;
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      const res = await apiRequest<{ workspace: Workspace }>(
        `/api/workspaces/${activeWorkspace.id}/members`,
        {
          method: 'POST',
          body: JSON.stringify({
            name: memberName.trim(),
            email: memberEmail.trim(),
            role: memberRole,
          }),
        }
      );
      onWorkspaceUpdated(res.workspace);
      setMemberName('');
      setMemberEmail('');
      setNotice(`Invited ${memberName.trim()} as ${memberRole}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    try {
      const res = await apiRequest<{ account: SocialAccount }>(
        `/api/accounts/${accountId}/disconnect`,
        { method: 'POST' }
      );
      onAccountUpdated(res.account);
      setNotice(`Disconnected ${PLATFORMS[res.account.platform].name} channel.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed.');
    }
  };

  const handleApproval = async (postId: string, action: 'approve' | 'reject') => {
    try {
      const res = await apiRequest<{ post: ScheduledPost }>(`/api/posts/${postId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      onPostUpdated(res.post);
      setNotice(
        action === 'approve'
          ? `Approved "${res.post.title}" for scheduled queue.`
          : `Returned "${res.post.title}" to draft.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval action failed.');
    }
  };

  const handleSelectPlan = async (planId: PlanTierId) => {
    try {
      const res = await apiRequest<{ user: UserProfile }>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ planId }),
      });
      onUserUpdated(res.user);
      setNotice(
        `Preview tier switched to ${planId.toUpperCase()} (Proposed pricing — no billing integration active).`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update plan preview.');
    }
  };

  const handleExportPrivacyData = () => {
    const blob = new Blob(
      [JSON.stringify({ user, activeWorkspace, accounts, posts }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `postease-export-${activeWorkspace.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice('Exported workspace data JSON.');
  };

  return (
    <div className="space-y-6">
      {/* Header & Section Tabs */}
      <section className="rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Settings &amp; Connected Accounts</h1>
            <p className="text-sm text-[#464554] dark:text-[#94A3B8]">
              OAuth integrations, client workspaces, team approvals, theme, and subscription tiers.
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="min-h-[42px] px-4 py-2 rounded-full border border-[#ba1a1a]/30 text-[#ba1a1a] dark:text-[#ffb4ab] text-xs font-semibold inline-flex items-center gap-2 hover:bg-[#ffdad6]/30 self-start sm:self-auto whitespace-nowrap shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'accounts', label: 'Social Accounts' },
            { id: 'workspaces', label: `Workspaces & Team (${pendingApprovals.length})` },
            { id: 'profile', label: 'Profile & Preferences' },
            { id: 'plans', label: 'Subscription Plans' },
            { id: 'support', label: 'Help & Privacy' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSection(tab.id as typeof section);
                setNotice(null);
                setError(null);
              }}
              className={`min-h-[40px] px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                section === tab.id
                  ? 'bg-[#4648d4] dark:bg-[#8B5CF6] text-white'
                  : 'bg-[#f8f9ff] dark:bg-[#0A0D14] text-[#464554] dark:text-[#94A3B8] border border-slate-200 dark:border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {notice && (
        <div className="rounded-2xl px-4 py-3 text-xs font-semibold bg-[#ecfdf5] dark:bg-[#005236]/40 text-[#006c49] dark:text-[#4EDEA3] border border-[#006c49]/25">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-2xl px-4 py-3 text-xs font-semibold bg-[#ffdad6]/50 dark:bg-[#93000a]/30 text-[#ba1a1a] dark:text-[#ffb4ab] border border-[#ba1a1a]/30">
          {error}
        </div>
      )}

      {/* 1. Social Account Connections */}
      {section === 'accounts' && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['instagram', 'facebook', 'youtube', 'whatsapp'] as PlatformId[]).map((pid) => {
            const meta = PLATFORMS[pid];
            const acc = accounts.find((a) => a.platform === pid && a.connected);

            return (
              <div
                key={pid}
                className="rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/70 dark:border-white/10 flex items-center justify-center">
                        <PlatformIcon platform={pid} size={24} />
                      </div>
                      <div>
                        <h2 className="font-display text-base font-bold">{meta.name}</h2>
                        <p className="text-xs text-[#464554] dark:text-[#94A3B8]">
                          {meta.apiName}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        acc
                          ? 'text-[#006c49] dark:text-[#4EDEA3]'
                          : 'text-[#825100] dark:text-[#ffb95f]'
                      }`}
                    >
                      {acc ? 'OAuth Connected' : 'Disconnected'}
                    </span>
                  </div>

                  {acc && (
                    <div className="rounded-xl p-3 bg-[#f8f9ff] dark:bg-[#0A0D14] text-xs space-y-1">
                      <p className="font-bold">
                        {acc.accountName} · <span className="font-normal">{acc.handle}</span>
                      </p>
                      <p className="text-[#464554] dark:text-[#94A3B8] tabular-nums">
                        {acc.followers.toLocaleString()} followers · Scopes:{' '}
                        {acc.oauthScopes.join(', ')}
                      </p>
                    </div>
                  )}

                  <div className="text-xs space-y-1.5 text-[#464554] dark:text-[#94A3B8]">
                    <p className="font-semibold text-[#006c49] dark:text-[#4EDEA3]">
                      Official API Supported:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {meta.officialCapabilities.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <p className="font-semibold text-[#825100] dark:text-[#ffb95f] pt-1">
                      Manual / Unsupported by API:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {meta.manualCapabilities.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => onOpenConnectAccount(pid)}
                    className="min-h-[42px] px-4 py-2 rounded-full bg-[#4648d4] hover:bg-[#3a3cc2] dark:bg-[#8B5CF6] text-white text-xs font-semibold"
                  >
                    {acc ? 'Reconnect via OAuth' : `Connect ${meta.shortName} via OAuth`}
                  </button>
                  {acc && (
                    <button
                      type="button"
                      onClick={() => handleDisconnectAccount(acc.id)}
                      className="min-h-[42px] px-3.5 py-2 rounded-full text-xs font-semibold text-[#ba1a1a] dark:text-[#ffb4ab] hover:bg-[#ffdad6]/30"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* 2. Brand Workspaces, Team & Approvals */}
      {section === 'workspaces' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 space-y-5">
            {/* Switch & Create Brand / Agency Client Workspaces */}
            <div className="rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
              <h2 className="font-display text-lg font-bold">Brand &amp; Client Workspaces</h2>
              <div className="space-y-2">
                {workspaces.map((ws) => {
                  const active = ws.id === activeWorkspace.id;
                  return (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => onSelectWorkspace(ws.id)}
                      className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                        active
                          ? 'border-[#4648d4] bg-[#eff4ff] dark:border-[#8B5CF6] dark:bg-[#8B5CF6]/15'
                          : 'border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-bold">{ws.name}</p>
                        <p className="text-xs text-[#464554] dark:text-[#94A3B8]">
                          {ws.industry} · {ws.isClientWorkspace ? 'Agency Client' : 'Primary Brand'} ·{' '}
                          {ws.members.length} members
                        </p>
                      </div>
                      {active && (
                        <CheckCircle2 className="w-5 h-5 text-[#4648d4] dark:text-[#d0bcff]" />
                      )}
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleCreateWorkspace} className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-3">
                <p className="text-xs font-bold">Add Brand or Agency Client Workspace</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    value={newWsName}
                    onChange={(e) => setNewWsName(e.target.value)}
                    placeholder="Brand / Client Name"
                    className="min-h-[42px] rounded-xl px-3 text-xs bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10"
                  />
                  <input
                    type="text"
                    value={newWsIndustry}
                    onChange={(e) => setNewWsIndustry(e.target.value)}
                    placeholder="Industry (e.g., Skincare)"
                    className="min-h-[42px] rounded-xl px-3 text-xs bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={isClientWs}
                    onChange={(e) => setIsClientWs(e.target.checked)}
                    className="rounded"
                  />
                  <span>Mark as Agency Client Workspace (enables approval workflows)</span>
                </label>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[42px] px-4 py-2 rounded-full bg-[#4648d4] dark:bg-[#8B5CF6] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Workspace</span>
                </button>
              </form>
            </div>

            {/* Team Members & Roles */}
            <div className="rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#4648d4] dark:text-[#d0bcff]" />
                <h2 className="font-display text-lg font-bold">
                  Team &amp; Role Permissions ({activeWorkspace.name})
                </h2>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {activeWorkspace.members.map((m) => (
                  <div key={m.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-bold">{m.name}</p>
                      <p className="text-[#464554] dark:text-[#94A3B8]">{m.email}</p>
                    </div>
                    <span className="font-semibold text-[#4648d4] dark:text-[#d0bcff]">
                      {m.role} · {m.status === 'invited' ? 'Invited' : 'Active'}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleInviteMember} className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2.5">
                <p className="text-xs font-bold">Invite Team Collaborator</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="Name"
                    className="min-h-[40px] rounded-xl px-3 text-xs bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10"
                  />
                  <input
                    type="email"
                    required
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="Email"
                    className="min-h-[40px] rounded-xl px-3 text-xs bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10"
                  />
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value as TeamRole)}
                    className="min-h-[40px] rounded-xl px-3 text-xs bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                    <option value="Approver">Approver</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[40px] px-4 py-2 rounded-full border border-slate-200 dark:border-white/15 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Send Invite</span>
                </button>
              </form>
            </div>
          </div>

          {/* Content Approval Queue */}
          <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#4648d4] dark:text-[#4cd7f6]" />
              <div>
                <h2 className="font-display text-lg font-bold">Content Approval Workflow</h2>
                <p className="text-xs text-[#464554] dark:text-[#94A3B8]">
                  Review posts submitted by editors or agency team members before publishing
                </p>
              </div>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="rounded-xl bg-[#f8f9ff] dark:bg-[#0A0D14] p-6 text-center text-xs text-[#464554] dark:text-[#94A3B8]">
                No posts awaiting approval in {activeWorkspace.name}. Submit a post for approval from the Scheduler to test this workflow.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-xl p-4 bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/80 dark:border-white/10 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold">{post.title}</p>
                        <p className="text-xs text-[#464554] dark:text-[#94A3B8] mt-0.5">
                          Submitted by {post.createdBy} · Scheduled {post.scheduledDate} {post.scheduledTime}
                        </p>
                      </div>
                      <StatusLabel status={post.status} />
                    </div>
                    <p className="text-xs text-[#0b1c30] dark:text-slate-300">
                      {Object.values(post.captions)[0]}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleApproval(post.id, 'approve')}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#006c49] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve &amp; Schedule</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproval(post.id, 'reject')}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-white/15 text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Return to Draft</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Profile, Theme, Language & Notifications */}
      {section === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 space-y-6 max-w-3xl"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-bold">Profile &amp; Workspace Preferences</h2>
            <button
              type="button"
              onClick={onToggleTheme}
              className="min-h-[40px] px-4 py-2 rounded-full border border-slate-200 dark:border-white/15 text-xs font-semibold inline-flex items-center gap-2"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[44px] rounded-xl px-3.5 text-sm bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Primary Handle</label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full min-h-[44px] rounded-xl px-3.5 text-sm bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Account Type</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as AccountType)}
                className="w-full min-h-[44px] rounded-xl px-3.5 text-sm bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Language Preference</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full min-h-[44px] rounded-xl px-3.5 text-sm bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">Creator / Brand Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-xl p-3.5 text-sm bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10"
            />
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-white/5">
            <h3 className="text-xs font-bold">Notification Settings</h3>
            {(
              [
                ['publishAlerts', 'Publishing alerts when scheduled posts dispatch or fail'],
                ['approvalRequests', 'Team approval requests & client review pings'],
                ['weeklyDigest', 'Weekly performance summary digest'],
                ['aiSuggestions', 'AI Studio reel trends & caption prompts'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-4 py-1.5 text-xs">
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={notifications[key]}
                  onChange={(e) =>
                    setNotifications((prev) => ({ ...prev, [key]: e.target.checked }))
                  }
                  className="w-4 h-4 accent-[#4648d4]"
                />
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="min-h-[46px] px-6 py-2.5 rounded-full bg-[#4648d4] dark:bg-gradient-to-r dark:from-[#8B5CF6] dark:to-[#EC4899] text-white text-sm font-semibold"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </form>
      )}

      {/* 4. Subscription Plans */}
      {section === 'plans' && (
        <section className="space-y-4">
          <div className="rounded-2xl bg-[#eff4ff] dark:bg-[#1A2035] border border-[#4648d4]/20 dark:border-[#8B5CF6]/30 px-4 py-3 flex items-center gap-3 text-xs">
            <CreditCard className="w-4 h-4 text-[#4648d4] dark:text-[#4cd7f6] shrink-0" />
            <span>
              <strong>Proposed Pricing Tiers:</strong> No payment gateway is connected. Selecting a plan previews workspace limits without processing real payments.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const current = user.planId === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-5 border flex flex-col justify-between gap-4 bg-white dark:bg-[#121624] ${
                    plan.highlighted
                      ? 'border-[#4648d4] dark:border-[#8B5CF6]'
                      : 'border-slate-200/80 dark:border-white/10'
                  }`}
                >
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-lg font-bold">{plan.name}</h3>
                        {current && (
                          <span className="text-[11px] font-bold text-[#006c49] dark:text-[#4EDEA3]">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#464554] dark:text-[#94A3B8] mt-0.5">
                        {plan.audience}
                      </p>
                    </div>

                    <div>
                      <span className="font-display text-2xl font-extrabold tabular-nums">
                        {plan.priceMonthlyInr}
                      </span>
                      <span className="text-xs text-[#464554] dark:text-[#94A3B8] ml-1">
                        {plan.cadence}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-[#0b1c30] dark:text-slate-200 pt-2 border-t border-slate-100 dark:border-white/5">
                      <p className="font-semibold">{plan.limits.scheduledPosts}</p>
                      <p>{plan.limits.socialAccounts}</p>
                      <p>{plan.limits.aiCredits}</p>
                      <p>{plan.limits.workspaces}</p>
                      <p>{plan.limits.collaboration}</p>
                    </div>

                    <ul className="space-y-1 text-[11px] text-[#464554] dark:text-[#94A3B8] pt-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#006c49] dark:text-[#4EDEA3] shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full min-h-[42px] rounded-full text-xs font-semibold transition-colors ${
                      current
                        ? 'bg-[#eff4ff] dark:bg-[#1A2035] text-[#4648d4] dark:text-[#d0bcff]'
                        : 'bg-[#4648d4] dark:bg-[#8B5CF6] text-white hover:opacity-90'
                    }`}
                  >
                    {current ? 'Current Preview Plan' : `Preview ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Help, Support & Privacy */}
      {section === 'support' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#4648d4] dark:text-[#d0bcff]" />
              <h2 className="font-display text-lg font-bold">Help &amp; API Integration FAQ</h2>
            </div>

            <div className="space-y-3">
              {FAQS.map((item) => (
                <div
                  key={item.q}
                  className="rounded-xl p-4 bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/70 dark:border-white/10"
                >
                  <p className="text-sm font-bold">{item.q}</p>
                  <p className="text-xs text-[#464554] dark:text-[#94A3B8] mt-1 leading-relaxed">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
            <h2 className="font-display text-lg font-bold">Privacy &amp; Data Controls</h2>
            <p className="text-xs text-[#464554] dark:text-[#94A3B8] leading-relaxed">
              Your PostEase schedule, brand workspaces, and connected OAuth metadata belong to your studio. Export a portable JSON archive anytime or sign out from this session.
            </p>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleExportPrivacyData}
                className="w-full min-h-[44px] px-4 py-2 rounded-full border border-slate-200 dark:border-white/15 text-xs font-semibold inline-flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5"
              >
                <Download className="w-4 h-4" />
                <span>Download Workspace Data (JSON)</span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="w-full min-h-[44px] px-4 py-2 rounded-full bg-[#ba1a1a] text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout of PostEase</span>
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
