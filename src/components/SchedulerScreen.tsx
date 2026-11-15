import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from 'react';
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  Hash,
  Info,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import type {
  AspectRatio,
  ContentType,
  PlatformId,
  PostStatus,
  ScheduledPost,
  Workspace,
} from '../types/postease';
import { PLATFORMS, SAMPLE_ASSETS } from '../data/platforms';
import { PlatformIcon, StatusLabel } from './PlatformIcon';
import { apiRequest } from '../lib/api';

interface SchedulerScreenProps {
  workspace: Workspace;
  posts: ScheduledPost[];
  draftSeed?: {
    title?: string;
    caption?: string;
    hashtags?: string[];
    mediaUrl?: string;
    aspectRatio?: AspectRatio;
    platforms?: PlatformId[];
  } | null;
  editingPost?: ScheduledPost | null;
  onClearSeed: () => void;
  onPostSaved: (post: ScheduledPost, isNew: boolean) => void;
  onPostDeleted: (postId: string) => void;
}

const DEFAULT_CONTENT_TYPE: Record<PlatformId, ContentType> = {
  instagram: 'ig_reel',
  facebook: 'fb_post',
  youtube: 'yt_short',
  whatsapp: 'wa_business_message',
};

const QUICK_HASHTAGS = [
  '#CreatorEconomy',
  '#PostEase',
  '#SmallBusinessIndia',
  '#ReelsDaily',
  '#BehindTheScenes',
  '#ProductDrop',
];

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function SchedulerScreen({
  workspace,
  posts,
  draftSeed,
  editingPost,
  onClearSeed,
  onPostSaved,
  onPostDeleted,
}: SchedulerScreenProps) {
  const [viewTab, setViewTab] = useState<'composer' | 'calendar'>('composer');
  const [calendarMode, setCalendarMode] = useState<'week' | 'month'>('week');
  const [calendarAnchor, setCalendarAnchor] = useState<Date>(() => new Date());
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null);

  // Composer Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [platforms, setPlatforms] = useState<PlatformId[]>(['instagram']);
  const [contentTypes, setContentTypes] = useState<Partial<Record<PlatformId, ContentType>>>({
    instagram: 'ig_reel',
  });
  const [captions, setCaptions] = useState<Partial<Record<PlatformId, string>>>({
    instagram: '',
  });
  const [activePreviewPlatform, setActivePreviewPlatform] = useState<PlatformId>('instagram');
  const [hashtagsInput, setHashtagsInput] = useState('#PostEase #CreatorWorkflow');
  const [mediaUrl, setMediaUrl] = useState<string>(SAMPLE_ASSETS.reelCoffee);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'none'>('image');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [scheduledDate, setScheduledDate] = useState<string>(() => toIsoDate(new Date()));
  const [scheduledTime, setScheduledTime] = useState('18:30');

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedKit, setCopiedKit] = useState(false);

  // Load seed from AI Studio or editing post
  useEffect(() => {
    if (editingPost) {
      setEditingId(editingPost.id);
      setTitle(editingPost.title);
      setPlatforms(editingPost.platforms);
      setContentTypes(editingPost.contentTypes || {});
      setCaptions(editingPost.captions || {});
      setActivePreviewPlatform(editingPost.platforms[0] || 'instagram');
      setHashtagsInput(editingPost.hashtags.join(' '));
      setMediaUrl(editingPost.mediaUrl || SAMPLE_ASSETS.postWorkspace);
      setMediaType(editingPost.mediaType || 'image');
      setAspectRatio(editingPost.aspectRatio || '9:16');
      setScheduledDate(editingPost.scheduledDate);
      setScheduledTime(editingPost.scheduledTime);
      setViewTab('composer');
      setFeedback(null);
      onClearSeed();
    } else if (draftSeed) {
      setEditingId(null);
      setTitle(draftSeed.title || 'AI Studio Reel Draft');
      const targetPlatforms: PlatformId[] = draftSeed.platforms?.length
        ? draftSeed.platforms
        : ['instagram', 'youtube'];
      setPlatforms(targetPlatforms);
      const nextTypes: Partial<Record<PlatformId, ContentType>> = {};
      const nextCaps: Partial<Record<PlatformId, string>> = {};
      targetPlatforms.forEach((p) => {
        nextTypes[p] = DEFAULT_CONTENT_TYPE[p];
        nextCaps[p] = draftSeed.caption || '';
      });
      setContentTypes(nextTypes);
      setCaptions(nextCaps);
      setActivePreviewPlatform(targetPlatforms[0]);
      setHashtagsInput((draftSeed.hashtags || []).join(' '));
      if (draftSeed.mediaUrl) {
        setMediaUrl(draftSeed.mediaUrl);
        setMediaType('image');
      }
      if (draftSeed.aspectRatio) setAspectRatio(draftSeed.aspectRatio);
      setViewTab('composer');
      setFeedback({ type: 'success', text: 'Loaded draft from AI Studio into Composer.' });
      onClearSeed();
    }
  }, [draftSeed, editingPost, onClearSeed]);

  const togglePlatform = (pid: PlatformId) => {
    setPlatforms((prev) => {
      if (prev.includes(pid)) {
        if (prev.length === 1) return prev;
        const next = prev.filter((p) => p !== pid);
        if (activePreviewPlatform === pid) setActivePreviewPlatform(next[0]);
        return next;
      }
      setContentTypes((ct) => ({ ...ct, [pid]: ct[pid] || DEFAULT_CONTENT_TYPE[pid] }));
      setCaptions((c) => ({ ...c, [pid]: c[pid] ?? (c[prev[0]] || '') }));
      setActivePreviewPlatform(pid);
      return [...prev, pid];
    });
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 9 * 1024 * 1024) {
      setFeedback({ type: 'error', text: 'File exceeds 9 MB limit. Choose a smaller image or clip.' });
      return;
    }

    setUploadProgress(15);
    setFeedback(null);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setUploadProgress(65);
        const res = await apiRequest<{ url: string; mediaType: 'image' | 'video' }>('/api/upload', {
          method: 'POST',
          body: JSON.stringify({
            filename: file.name,
            dataUrl: reader.result,
          }),
        });
        setUploadProgress(100);
        setMediaUrl(res.url);
        setMediaType(res.mediaType);
        setFeedback({ type: 'success', text: `Uploaded ${file.name} to workspace media.` });
        setTimeout(() => setUploadProgress(null), 600);
      } catch (err) {
        setUploadProgress(null);
        setFeedback({
          type: 'error',
          text: err instanceof Error ? err.message : 'Media upload failed.',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const resetComposer = () => {
    setEditingId(null);
    setTitle('');
    setPlatforms(['instagram']);
    setContentTypes({ instagram: 'ig_reel' });
    setCaptions({ instagram: '' });
    setActivePreviewPlatform('instagram');
    setHashtagsInput('#PostEase #CreatorWorkflow');
    setMediaUrl(SAMPLE_ASSETS.reelCoffee);
    setMediaType('image');
    setAspectRatio('9:16');
    setScheduledDate(toIsoDate(new Date()));
    setScheduledTime('18:30');
  };

  const parsedHashtags = useMemo(
    () =>
      hashtagsInput
        .split(/[\s,]+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => (t.startsWith('#') ? t : `#${t}`)),
    [hashtagsInput]
  );

  const handleSubmitPost = async (targetStatus: PostStatus) => {
    if (!title.trim()) {
      setFeedback({ type: 'error', text: 'Please enter a post title before saving.' });
      return;
    }
    const primaryCaption = captions[activePreviewPlatform] || Object.values(captions)[0] || '';
    if (!primaryCaption.trim()) {
      setFeedback({ type: 'error', text: 'Please write a caption or message for your post.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        workspaceId: workspace.id,
        title: title.trim(),
        platforms,
        contentTypes,
        captions,
        hashtags: parsedHashtags,
        mediaUrl,
        mediaType,
        aspectRatio,
        scheduledDate,
        scheduledTime,
        status: targetStatus,
      };

      if (editingId) {
        const res = await apiRequest<{ post: ScheduledPost }>(`/api/posts/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        onPostSaved(res.post, false);
        setFeedback({ type: 'success', text: `Updated "${res.post.title}".` });
      } else {
        const res = await apiRequest<{ post: ScheduledPost }>('/api/posts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        onPostSaved(res.post, true);
        setFeedback({
          type: 'success',
          text:
            targetStatus === 'draft'
              ? `Saved "${res.post.title}" as a draft.`
              : targetStatus === 'pending_approval'
                ? `Submitted "${res.post.title}" for workspace approval.`
                : `Scheduled "${res.post.title}" for ${scheduledDate} at ${scheduledTime} (Demo Queue).`,
        });
        resetComposer();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleMovePostDate = async (postId: string, newDate: string) => {
    try {
      const res = await apiRequest<{ post: ScheduledPost }>(`/api/posts/${postId}`, {
        method: 'PATCH',
        body: JSON.stringify({ scheduledDate: newDate }),
      });
      onPostSaved(res.post, false);
      setFeedback({ type: 'success', text: `Rescheduled "${res.post.title}" to ${newDate}.` });
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Reschedule failed.' });
    }
  };

  const handleDropOnDate = async (e: DragEvent, targetDate: string) => {
    e.preventDefault();
    const id = draggedPostId || e.dataTransfer.getData('text/plain');
    setDraggedPostId(null);
    if (!id) return;
    await handleMovePostDate(id, targetDate);
  };

  const handleDeleteConfirmed = async (postId: string) => {
    try {
      await apiRequest(`/api/posts/${postId}`, { method: 'DELETE' });
      onPostDeleted(postId);
      setDeleteConfirmId(null);
      if (editingId === postId) resetComposer();
      setFeedback({ type: 'success', text: 'Post removed from schedule.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed.' });
    }
  };

  const hasWhatsAppStatus =
    platforms.includes('whatsapp') && contentTypes.whatsapp === 'wa_status_prep';

  const handleCopyStatusKit = async () => {
    const text = `${captions.whatsapp || ''}\n\n${parsedHashtags.join(' ')}`.trim();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKit(true);
      setTimeout(() => setCopiedKit(false), 2000);
    } catch {
      setFeedback({ type: 'error', text: 'Clipboard unavailable in this browser context.' });
    }
  };

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
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calendarAnchor]);

  const todayStr = toIsoDate(new Date());

  return (
    <div className="space-y-6">
      {/* Header & View Switcher */}
      <section className="rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0b1c30] dark:text-white">
            Social Media Scheduler
          </h1>
          <p className="text-sm text-[#464554] dark:text-[#94A3B8]">
            Compose, customize captions per platform, preview frames, and drag-and-drop dates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 rounded-xl bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/80 dark:border-white/10">
            <button
              type="button"
              onClick={() => setViewTab('composer')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                viewTab === 'composer'
                  ? 'bg-white dark:bg-[#1A2035] text-[#4648d4] dark:text-[#d0bcff] shadow-xs'
                  : 'text-[#464554] dark:text-[#94A3B8]'
              }`}
            >
              Composer &amp; Preview
            </button>
            <button
              type="button"
              onClick={() => setViewTab('calendar')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                viewTab === 'calendar'
                  ? 'bg-white dark:bg-[#1A2035] text-[#4648d4] dark:text-[#d0bcff] shadow-xs'
                  : 'text-[#464554] dark:text-[#94A3B8]'
              }`}
            >
              Visual Calendar ({posts.length})
            </button>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetComposer}
              className="min-h-[40px] px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/15 text-xs font-semibold inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          )}
        </div>
      </section>

      {feedback && (
        <div
          className={`rounded-2xl px-4 py-3 text-xs font-semibold flex items-center justify-between gap-3 border ${
            feedback.type === 'error'
              ? 'bg-[#ffdad6]/50 dark:bg-[#93000a]/30 text-[#ba1a1a] dark:text-[#ffb4ab] border-[#ba1a1a]/30'
              : 'bg-[#ecfdf5] dark:bg-[#005236]/40 text-[#006c49] dark:text-[#4EDEA3] border-[#006c49]/25'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {viewTab === 'composer' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Composer Column */}
          <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold">
                {editingId ? 'Edit Scheduled Content' : 'Create & Schedule Content'}
              </h2>
              <span className="text-xs font-medium text-[#464554] dark:text-[#94A3B8]">
                {workspace.name}
              </span>
            </div>

            {/* Post Title */}
            <div>
              <label className="block text-xs font-semibold mb-1.5">Campaign / Post Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Morning Matcha Pour-Over Reel"
                className="w-full min-h-[44px] rounded-xl px-3.5 py-2.5 text-sm bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#4648d4] dark:focus:border-[#8B5CF6]"
              />
            </div>

            {/* Platform Multi-Select */}
            <div>
              <label className="block text-xs font-semibold mb-2">
                1. Target Platforms &amp; Content Types
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['instagram', 'facebook', 'youtube', 'whatsapp'] as PlatformId[]).map((pid) => {
                  const selected = platforms.includes(pid);
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => togglePlatform(pid)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 transition-colors ${
                        selected
                          ? 'border-[#4648d4] bg-[#eff4ff] text-[#4648d4] dark:border-[#8B5CF6] dark:bg-[#8B5CF6]/20 dark:text-[#d0bcff]'
                          : 'border-slate-200 dark:border-white/10 text-[#464554] dark:text-[#94A3B8] hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2 truncate">
                        <PlatformIcon platform={pid} size={15} />
                        <span className="truncate">{PLATFORMS[pid].shortName}</span>
                      </span>
                      {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Per-platform format selector */}
              <div className="mt-3 space-y-2">
                {platforms.map((pid) => {
                  const meta = PLATFORMS[pid];
                  const selectedType = contentTypes[pid] || DEFAULT_CONTENT_TYPE[pid];
                  const chosenOption = meta.contentOptions.find((o) => o.id === selectedType);
                  return (
                    <div
                      key={pid}
                      className="rounded-xl p-3 bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/70 dark:border-white/10 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 text-xs font-bold">
                          <PlatformIcon platform={pid} size={14} />
                          <span>{meta.name} Format</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {meta.contentOptions.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() =>
                                setContentTypes((prev) => ({ ...prev, [pid]: opt.id }))
                              }
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                                selectedType === opt.id
                                  ? 'bg-[#4648d4] dark:bg-[#8B5CF6] text-white'
                                  : 'bg-white dark:bg-[#121624] text-[#464554] dark:text-[#94A3B8] border border-slate-200 dark:border-white/10'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {chosenOption && (
                        <p className="text-[11px] text-[#464554] dark:text-[#94A3B8]">
                          {chosenOption.apiMode === 'manual_handoff' ? (
                            <span className="font-semibold text-[#825100] dark:text-[#ffb95f]">
                              Manual Publishing:{' '}
                            </span>
                          ) : (
                            <span className="font-semibold text-[#006c49] dark:text-[#4EDEA3]">
                              Official API Supported:{' '}
                            </span>
                          )}
                          {chosenOption.helperText}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Media Upload & Aspect Ratio */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold">2. Upload Media or Pick Studio Asset</label>
                <div className="flex items-center gap-1">
                  {(['9:16', '1:1', '16:9'] as AspectRatio[]).map((ar) => (
                    <button
                      key={ar}
                      type="button"
                      onClick={() => setAspectRatio(ar)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-num font-semibold ${
                        aspectRatio === ar
                          ? 'bg-[#4648d4] dark:bg-[#8B5CF6] text-white'
                          : 'bg-[#f8f9ff] dark:bg-[#0A0D14] text-[#464554] dark:text-[#94A3B8]'
                      }`}
                    >
                      {ar}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="min-h-[44px] px-4 py-2 rounded-xl border border-dashed border-[#4648d4]/50 dark:border-[#8B5CF6]/50 bg-[#eff4ff]/50 dark:bg-[#1A2035] text-xs font-semibold text-[#4648d4] dark:text-[#d0bcff] inline-flex items-center gap-2 cursor-pointer hover:bg-[#eff4ff] dark:hover:bg-[#232b47]">
                  <Upload className="w-4 h-4" />
                  <span>Upload Image / Video</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>

                <div className="flex items-center gap-2">
                  {[
                    { label: 'Matcha Reel', url: SAMPLE_ASSETS.reelCoffee },
                    { label: 'Headphones', url: SAMPLE_ASSETS.reelProduct },
                    { label: 'Desk Kit', url: SAMPLE_ASSETS.postWorkspace },
                  ].map((sample) => (
                    <button
                      key={sample.label}
                      type="button"
                      onClick={() => {
                        setMediaUrl(sample.url);
                        setMediaType('image');
                      }}
                      className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 ${
                        mediaUrl === sample.url
                          ? 'border-[#4648d4] dark:border-[#8B5CF6] bg-[#eff4ff] dark:bg-[#8B5CF6]/20'
                          : 'border-slate-200 dark:border-white/10'
                      }`}
                    >
                      <img
                        src={sample.url}
                        alt={sample.label}
                        className="w-5 h-5 rounded object-cover"
                      />
                      <span>{sample.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {uploadProgress !== null && (
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-[#4648d4] dark:bg-[#8B5CF6] transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Platform-Specific Captions */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold">3. Platform-Specific Captions</label>
                <div className="flex items-center gap-1.5">
                  {platforms.map((pid) => (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => setActivePreviewPlatform(pid)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1.5 ${
                        activePreviewPlatform === pid
                          ? 'bg-[#4648d4] dark:bg-[#8B5CF6] text-white'
                          : 'bg-[#f8f9ff] dark:bg-[#0A0D14] text-[#464554] dark:text-[#94A3B8]'
                      }`}
                    >
                      <PlatformIcon platform={pid} size={12} />
                      <span>{PLATFORMS[pid].shortName}</span>
                    </button>
                  ))}
                  {platforms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const base = captions[activePreviewPlatform] || '';
                        const synced: Partial<Record<PlatformId, string>> = {};
                        platforms.forEach((p) => {
                          synced[p] = base;
                        });
                        setCaptions(synced);
                      }}
                      className="text-[11px] font-semibold text-[#4648d4] dark:text-[#4cd7f6] hover:underline ml-1"
                    >
                      Sync to all
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={4}
                value={captions[activePreviewPlatform] || ''}
                onChange={(e) =>
                  setCaptions((prev) => ({ ...prev, [activePreviewPlatform]: e.target.value }))
                }
                placeholder={`Write your ${PLATFORMS[activePreviewPlatform].name} caption...`}
                className="w-full rounded-xl p-3.5 text-sm bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#4648d4] dark:focus:border-[#8B5CF6]"
              />
            </div>

            {/* Hashtags */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold">
                <Hash className="w-3.5 h-3.5" />
                <span>Hashtags</span>
              </label>
              <input
                type="text"
                value={hashtagsInput}
                onChange={(e) => setHashtagsInput(e.target.value)}
                placeholder="#CreatorLife #PostEase"
                className="w-full min-h-[42px] rounded-xl px-3.5 py-2 text-xs bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#4648d4] dark:focus:border-[#8B5CF6]"
              />
              <div className="flex flex-wrap gap-1.5">
                {QUICK_HASHTAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (!hashtagsInput.includes(tag)) {
                        setHashtagsInput((prev) => `${prev.trim()} ${tag}`.trim());
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/80 dark:border-white/10 text-[11px] font-medium text-[#464554] dark:text-[#94A3B8] hover:text-[#4648d4] dark:hover:text-[#d0bcff]"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Publishing Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl px-3.5 py-2 text-sm font-mono-num bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#4648d4] dark:focus:border-[#8B5CF6]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Publishing Time</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl px-3.5 py-2 text-sm font-mono-num bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#4648d4] dark:focus:border-[#8B5CF6]"
                />
              </div>
            </div>

            {/* WhatsApp Status Manual Prep Helper */}
            {hasWhatsAppStatus && (
              <div className="rounded-xl bg-[#ecfdf5] dark:bg-[#005236]/30 border border-[#006c49]/25 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-[#005236] dark:text-[#6ffbbe]">
                  <p className="font-bold">WhatsApp Status Manual Handoff Kit</p>
                  <p className="mt-0.5 opacity-90">
                    WhatsApp Business API does not automate Status posts. Copy your formatted text &amp; save media for mobile upload.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyStatusKit}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#006c49] text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedKit ? 'Copied!' : 'Copy Status Kit'}</span>
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSubmitPost('scheduled')}
                className="min-h-[46px] px-5 py-2.5 rounded-full bg-[#4648d4] hover:bg-[#3a3cc2] dark:bg-gradient-to-r dark:from-[#8B5CF6] dark:to-[#EC4899] text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
              >
                <CalendarIcon className="w-4 h-4" />
                <span>{editingId ? 'Save Changes' : 'Schedule Post'}</span>
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => handleSubmitPost('draft')}
                className="min-h-[46px] px-4 py-2.5 rounded-full border border-slate-200 dark:border-white/15 bg-[#f8f9ff] dark:bg-[#1A2035] text-sm font-semibold hover:bg-slate-100 dark:hover:bg-[#232b47]"
              >
                Save Draft
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => handleSubmitPost('pending_approval')}
                className="min-h-[46px] px-4 py-2.5 rounded-full border border-slate-200 dark:border-white/15 text-xs font-semibold text-[#825100] dark:text-[#4cd7f6] inline-flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Submit for Approval</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Platform Preview + Scheduled Queue */}
          <div className="lg:col-span-5 space-y-5">
            {/* Live Preview */}
            <div className="rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-base font-bold">Live Channel Preview</h3>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#464554] dark:text-[#94A3B8]">
                  <PlatformIcon platform={activePreviewPlatform} size={15} />
                  <span>{PLATFORMS[activePreviewPlatform].name}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-[#f8f9ff] dark:bg-[#0A0D14] overflow-hidden max-w-sm mx-auto">
                {/* Mock social header */}
                <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-slate-200/60 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={SAMPLE_ASSETS.avatar}
                      alt={workspace.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold leading-tight">{workspace.name}</p>
                      <p className="text-[10px] text-[#464554] dark:text-[#94A3B8]">
                        {scheduledDate} · {scheduledTime}
                      </p>
                    </div>
                  </div>
                  <PlatformIcon platform={activePreviewPlatform} size={16} />
                </div>

                {/* Media Frame */}
                <div
                  className={`relative bg-slate-900 flex items-center justify-center overflow-hidden ${
                    aspectRatio === '9:16'
                      ? 'aspect-[9/12]'
                      : aspectRatio === '1:1'
                        ? 'aspect-square'
                        : 'aspect-video'
                  }`}
                >
                  {mediaUrl ? (
                    mediaType === 'video' ? (
                      <video src={mediaUrl} controls className="w-full h-full object-cover" />
                    ) : (
                      <img
                        src={mediaUrl}
                        alt={title || 'Post preview'}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <span className="text-xs text-white/60">No media selected</span>
                  )}
                </div>

                {/* Caption & Hashtags */}
                <div className="p-3.5 space-y-1.5">
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">
                    {captions[activePreviewPlatform] || 'Your caption preview appears here as you type...'}
                  </p>
                  {parsedHashtags.length > 0 && (
                    <p className="text-[11px] font-medium text-[#4648d4] dark:text-[#d0bcff] break-words">
                      {parsedHashtags.join(' ')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Queued Posts List */}
            <div className="rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold">Workspace Queue</h3>
                <span className="text-xs text-[#464554] dark:text-[#94A3B8] tabular-nums">
                  {posts.length} items
                </span>
              </div>

              {posts.length === 0 ? (
                <p className="text-xs text-[#464554] dark:text-[#94A3B8] py-4 text-center">
                  No posts in this workspace yet.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="rounded-xl p-3 bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/70 dark:border-white/10 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{post.title}</p>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#464554] dark:text-[#94A3B8]">
                            {post.platforms.map((pid) => (
                              <PlatformIcon key={pid} platform={pid} size={12} />
                            ))}
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-num">
                              {post.scheduledDate} {post.scheduledTime}
                            </span>
                          </div>
                        </div>
                        <StatusLabel status={post.status} />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(post.id);
                            setTitle(post.title);
                            setPlatforms(post.platforms);
                            setContentTypes(post.contentTypes || {});
                            setCaptions(post.captions || {});
                            setActivePreviewPlatform(post.platforms[0] || 'instagram');
                            setHashtagsInput(post.hashtags.join(' '));
                            setMediaUrl(post.mediaUrl || SAMPLE_ASSETS.postWorkspace);
                            setMediaType(post.mediaType || 'image');
                            setAspectRatio(post.aspectRatio || '9:16');
                            setScheduledDate(post.scheduledDate);
                            setScheduledTime(post.scheduledTime);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-[#121624] border border-slate-200 dark:border-white/10 inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        {deleteConfirmId === post.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteConfirmed(post.id)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#ba1a1a] text-white"
                            >
                              Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 rounded-lg text-[11px] font-semibold text-[#464554] dark:text-[#94A3B8]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(post.id)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#ba1a1a] dark:text-[#ffb4ab] hover:bg-[#ffdad6]/30 inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Visual Drag-and-Drop Publishing Calendar */
        <section className="rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#464554] dark:text-[#94A3B8]">
              <Info className="w-4 h-4 text-[#4648d4] dark:text-[#4cd7f6] shrink-0" />
              <span>
                Drag any post card onto a different date cell to reschedule it, or tap to edit in Composer.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex p-1 rounded-xl bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/80 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setCalendarMode('week')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    calendarMode === 'week'
                      ? 'bg-white dark:bg-[#1A2035] text-[#4648d4] dark:text-[#d0bcff]'
                      : 'text-[#464554] dark:text-[#94A3B8]'
                  }`}
                >
                  Week
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarMode('month')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    calendarMode === 'month'
                      ? 'bg-white dark:bg-[#1A2035] text-[#4648d4] dark:text-[#d0bcff]'
                      : 'text-[#464554] dark:text-[#94A3B8]'
                  }`}
                >
                  Month
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const next = new Date(calendarAnchor);
                  if (calendarMode === 'week') next.setDate(next.getDate() - 7);
                  else next.setMonth(next.getMonth() - 1);
                  setCalendarAnchor(next);
                }}
                className="min-h-[36px] min-w-[36px] rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = new Date(calendarAnchor);
                  if (calendarMode === 'week') next.setDate(next.getDate() + 7);
                  else next.setMonth(next.getMonth() + 1);
                  setCalendarAnchor(next);
                }}
                className="min-h-[36px] min-w-[36px] rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5">
            {(calendarMode === 'week' ? weekDays : monthDays).map((day, idx) => {
              if (!day) {
                return (
                  <div
                    key={`blank_${idx}`}
                    className="hidden md:block min-h-[120px] rounded-xl bg-slate-50/50 dark:bg-white/[0.02]"
                  />
                );
              }
              const iso = toIsoDate(day);
              const dayPosts = posts.filter((p) => p.scheduledDate === iso);
              const isToday = iso === todayStr;

              return (
                <div
                  key={iso}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropOnDate(e, iso)}
                  className={`min-h-[140px] rounded-xl p-2.5 border flex flex-col transition-colors ${
                    isToday
                      ? 'bg-[#eff4ff]/60 dark:bg-[#8B5CF6]/10 border-[#4648d4]/40 dark:border-[#8B5CF6]/40'
                      : 'bg-[#f8f9ff] dark:bg-[#0A0D14] border-slate-200/70 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-[#464554] dark:text-[#94A3B8]">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="text-xs font-bold font-mono-num">{day.getDate()}</span>
                  </div>

                  <div className="space-y-1.5 flex-1">
                    {dayPosts.map((post) => (
                      <div
                        key={post.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggedPostId(post.id);
                          e.dataTransfer.setData('text/plain', post.id);
                        }}
                        className="p-2 rounded-lg bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 cursor-grab active:cursor-grabbing space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            {post.platforms.slice(0, 2).map((pid) => (
                              <PlatformIcon key={pid} platform={pid} size={12} />
                            ))}
                          </div>
                          <span className="text-[10px] font-mono-num text-[#464554] dark:text-[#94A3B8]">
                            {post.scheduledTime}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(post.id);
                            setTitle(post.title);
                            setPlatforms(post.platforms);
                            setContentTypes(post.contentTypes || {});
                            setCaptions(post.captions || {});
                            setActivePreviewPlatform(post.platforms[0] || 'instagram');
                            setHashtagsInput(post.hashtags.join(' '));
                            setMediaUrl(post.mediaUrl || SAMPLE_ASSETS.postWorkspace);
                            setMediaType(post.mediaType || 'image');
                            setAspectRatio(post.aspectRatio || '9:16');
                            setScheduledDate(post.scheduledDate);
                            setScheduledTime(post.scheduledTime);
                            setViewTab('composer');
                          }}
                          className="text-left text-xs font-semibold line-clamp-2 hover:underline"
                        >
                          {post.title}
                        </button>
                        <div className="flex items-center justify-between gap-1 pt-0.5">
                          <StatusLabel status={post.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
