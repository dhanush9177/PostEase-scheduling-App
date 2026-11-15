import { useState } from 'react';
import { Check, Lock, ShieldCheck, X } from 'lucide-react';
import { PLATFORMS } from '../data/platforms';
import type { PlatformId, SocialAccount } from '../types/postease';
import { PlatformIcon } from './PlatformIcon';
import { apiRequest } from '../lib/api';

interface OAuthConnectModalProps {
  isOpen: boolean;
  workspaceId: string;
  initialPlatform?: PlatformId;
  liveConfigured: {
    metaConfigured: boolean;
    youtubeConfigured: boolean;
    whatsappConfigured: boolean;
  };
  onClose: () => void;
  onConnected: (account: SocialAccount) => void;
}

export function OAuthConnectModal({
  isOpen,
  workspaceId,
  initialPlatform = 'instagram',
  liveConfigured,
  onClose,
  onConnected,
}: OAuthConnectModalProps) {
  const [platform, setPlatform] = useState<PlatformId>(initialPlatform);
  const [accountName, setAccountName] = useState('');
  const [handle, setHandle] = useState('');
  const [step, setStep] = useState<'select' | 'consent'>('select');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const meta = PLATFORMS[platform];
  const isLive =
    (platform === 'instagram' || platform === 'facebook')
      ? liveConfigured.metaConfigured
      : platform === 'youtube'
        ? liveConfigured.youtubeConfigured
        : liveConfigured.whatsappConfigured;

  const handleAuthorize = async () => {
    if (!accountName.trim()) {
      setError('Enter the brand page or channel display name to authorize.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ account: SocialAccount }>('/api/accounts/oauth-connect', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId,
          platform,
          accountName: accountName.trim(),
          handle: handle.trim() || undefined,
        }),
      });
      onConnected(res.account);
      setAccountName('');
      setHandle('');
      setStep('select');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authorization failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0b1c30]/50 dark:bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="oauth-modal-title"
    >
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#121624] border border-[#c7c4d7]/60 dark:border-white/10 shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#eff4ff] dark:bg-[#1A2035] flex items-center justify-center">
              <PlatformIcon platform={platform} size={22} />
            </div>
            <div>
              <h2 id="oauth-modal-title" className="text-base font-bold text-[#0b1c30] dark:text-white">
                Connect via Official OAuth
              </h2>
              <p className="text-xs text-[#464554] dark:text-[#94A3B8]">
                PostEase never asks for or stores your social passwords
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#464554] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            aria-label="Close OAuth authorization dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Platform selector */}
          <div>
            <label className="block text-xs font-semibold text-[#464554] dark:text-[#94A3B8] mb-2">
              Select Platform
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['instagram', 'facebook', 'youtube', 'whatsapp'] as PlatformId[]).map((pid) => {
                const active = platform === pid;
                return (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => {
                      setPlatform(pid);
                      setError(null);
                    }}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                      active
                        ? 'border-[#4648d4] bg-[#eff4ff] text-[#4648d4] dark:border-[#8B5CF6] dark:bg-[#8B5CF6]/20 dark:text-[#d0bcff]'
                        : 'border-slate-200 dark:border-white/10 text-[#464554] dark:text-[#94A3B8] hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <PlatformIcon platform={pid} size={16} />
                    <span className="truncate">{PLATFORMS[pid].shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* API capability transparency box */}
          <div className="rounded-xl bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/80 dark:border-white/10 p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#0b1c30] dark:text-white">
                {meta.apiName}
              </span>
              <span className="text-[11px] font-semibold text-[#825100] dark:text-[#4cd7f6]">
                {isLive ? 'Live OAuth Configured' : 'OAuth Demonstration Mode'}
              </span>
            </div>
            <div className="text-xs text-[#464554] dark:text-[#94A3B8] space-y-1">
              <p className="font-semibold text-[#006c49] dark:text-[#4EDEA3]">
                Supported by API:
              </p>
              <ul className="space-y-0.5 pl-4 list-disc">
                {meta.officialCapabilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="font-semibold text-[#825100] dark:text-[#ffb95f] pt-1">
                Manual / Not Automated by API:
              </p>
              <ul className="space-y-0.5 pl-4 list-disc">
                {meta.manualCapabilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {step === 'select' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] dark:text-slate-200 mb-1.5">
                  Page / Channel Name
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder={
                    platform === 'whatsapp'
                      ? 'e.g., Studio VIP Catalog'
                      : `e.g., Maya Studio ${meta.name}`
                  }
                  className="w-full min-h-[44px] rounded-xl px-3.5 py-2.5 text-sm bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10 text-[#0b1c30] dark:text-white focus:outline-none focus:border-[#4648d4] dark:focus:border-[#8B5CF6]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] dark:text-slate-200 mb-1.5">
                  Handle or Business Number (optional)
                </label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder={platform === 'whatsapp' ? '+91 98200 12345' : '@yourhandle'}
                  className="w-full min-h-[44px] rounded-xl px-3.5 py-2.5 text-sm bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10 text-[#0b1c30] dark:text-white focus:outline-none focus:border-[#4648d4] dark:focus:border-[#8B5CF6]"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[#4648d4]/30 dark:border-[#8B5CF6]/40 bg-[#eff4ff]/60 dark:bg-[#1A2035] p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#4648d4] dark:text-[#d0bcff]">
                <ShieldCheck className="w-4 h-4" />
                <span>OAuth Permission Consent Preview</span>
              </div>
              <p className="text-xs text-[#464554] dark:text-[#94A3B8]">
                Grant PostEase read & publishing scopes for <strong>{accountName}</strong> via {meta.apiName}:
              </p>
              <div className="space-y-1 text-xs text-[#0b1c30] dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#006c49] dark:text-[#4EDEA3]" />
                  <span>Schedule & publish authorized {meta.name} content</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#006c49] dark:text-[#4EDEA3]" />
                  <span>Read profile metadata & audience engagement insights</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#4648d4] dark:text-[#d0bcff]" />
                  <span>Revocable anytime in Settings or {meta.name} Security</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs font-medium text-[#ba1a1a] dark:text-[#ffb4ab] bg-[#ffdad6]/40 dark:bg-[#93000a]/30 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={step === 'consent' ? () => setStep('select') : onClose}
              className="min-h-[44px] px-4 py-2 rounded-full text-sm font-semibold text-[#464554] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              {step === 'consent' ? 'Back' : 'Cancel'}
            </button>

            {step === 'select' ? (
              <button
                type="button"
                onClick={() => {
                  if (!accountName.trim()) {
                    setError('Enter a Page or Channel name to continue to OAuth consent.');
                    return;
                  }
                  setError(null);
                  setStep('consent');
                }}
                className="min-h-[44px] px-5 py-2 rounded-full text-sm font-semibold bg-[#4648d4] hover:bg-[#3a3cc2] dark:bg-gradient-to-r dark:from-[#8B5CF6] dark:to-[#EC4899] text-white transition-all whitespace-nowrap shrink-0"
              >
                Continue to OAuth Consent
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleAuthorize}
                className="min-h-[44px] px-5 py-2 rounded-full text-sm font-semibold bg-[#006c49] hover:bg-[#00583b] dark:bg-gradient-to-r dark:from-[#8B5CF6] dark:to-[#EC4899] text-white transition-all disabled:opacity-60 whitespace-nowrap shrink-0"
              >
                {loading ? 'Authorizing...' : `Authorize ${meta.shortName} (OAuth)`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
