import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CalendarPlus,
  Check,
  Clapperboard,
  Copy,
  Download,
  Film,
  Image as ImageIcon,
  Mic,
  Music,
  Pause,
  Play,
  Plus,
  Scissors,
  Sparkles,
  Subtitles,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react';
import type { AspectRatio, PlatformId, StoryboardScene } from '../types/postease';
import { SAMPLE_ASSETS } from '../data/platforms';
import { apiRequest } from '../lib/api';

interface AIStudioScreenProps {
  geminiConfigured: boolean;
  onSendToScheduler: (seed: {
    title: string;
    caption: string;
    hashtags: string[];
    mediaUrl: string;
    aspectRatio: AspectRatio;
    platforms: PlatformId[];
  }) => void;
}

interface TextToReelResult {
  title: string;
  hook: string;
  script: string;
  scenes: Omit<StoryboardScene, 'id'>[];
  captions: {
    instagram: string;
    youtube: string;
    facebook: string;
  };
  hashtags: string[];
  musicMood: string;
}

interface ImageToVideoResult {
  conceptTitle: string;
  visualAnalysis: string;
  recommendedAudioMood: string;
  promotionalCaption: string;
  hashtags: string[];
  motionScenes: {
    sceneNumber: number;
    durationSec: number;
    transitionType: string;
    headlineOverlay: string;
    voiceoverLine: string;
    motionInstruction: string;
  }[];
}

interface MarketingResult {
  summary: string;
  items: {
    label: string;
    platform: string;
    format: string;
    content: string;
    hashtags: string[];
    bestTime: string;
  }[];
}

const VIDEO_TEMPLATES: {
  id: string;
  name: string;
  format: AspectRatio;
  mediaUrl: string;
  scenes: StoryboardScene[];
}[] = [
  {
    id: 'tpl_product',
    name: 'Product Launch Reveal',
    format: '9:16',
    mediaUrl: SAMPLE_ASSETS.reelProduct,
    scenes: [
      {
        id: 'sc_1',
        sceneNumber: 1,
        durationSec: 4,
        visualDirection: 'Tight macro push-in on product silhouette',
        cameraAngle: 'Eye-level macro',
        voiceoverLine: 'Meet the cleanest upgrade to your daily studio workflow.',
        onScreenText: 'Wait until you hear this',
        bRollSuggestion: 'Rim-lit product silhouette on stone',
      },
      {
        id: 'sc_2',
        sceneNumber: 2,
        durationSec: 6,
        visualDirection: 'Smooth 45-degree pan highlighting matte finish',
        cameraAngle: '45-deg orbit',
        voiceoverLine: 'Zero cable clutter, 42 hours of battery, and studio clarity anywhere.',
        onScreenText: '42H Battery · Studio Clarity',
        bRollSuggestion: 'Hands lifting headphones off desk',
      },
      {
        id: 'sc_3',
        sceneNumber: 3,
        durationSec: 5,
        visualDirection: 'Final wide frame with call-to-action overlay',
        cameraAngle: 'Centered hero',
        voiceoverLine: 'Tap the link in bio to reserve the Obsidian drop today.',
        onScreenText: 'Obsidian Drop Live Now',
        bRollSuggestion: 'Full product hero shot',
      },
    ],
  },
  {
    id: 'tpl_cafe',
    name: 'Morning Ritual Story',
    format: '9:16',
    mediaUrl: SAMPLE_ASSETS.reelCoffee,
    scenes: [
      {
        id: 'sc_c1',
        sceneNumber: 1,
        durationSec: 5,
        visualDirection: 'Top-down pour over ice crystals',
        cameraAngle: '45-deg overhead',
        voiceoverLine: 'Three layers. Ninety seconds. Your new 8 AM ritual.',
        onScreenText: '3-Layer Iced Matcha Espresso',
        bRollSuggestion: 'Espresso stream hitting oat milk',
      },
      {
        id: 'sc_c2',
        sceneNumber: 2,
        durationSec: 6,
        visualDirection: 'Sunlight shadow sweep across travertine table',
        cameraAngle: 'Low tabletop',
        voiceoverLine: 'Ceremonial matcha base balanced with bright single-origin roast.',
        onScreenText: 'Save this recipe for tomorrow',
        bRollSuggestion: 'Slow stir with brass spoon',
      },
    ],
  },
  {
    id: 'tpl_tutorial',
    name: 'Creator Desk Breakdown',
    format: '16:9',
    mediaUrl: SAMPLE_ASSETS.postWorkspace,
    scenes: [
      {
        id: 'sc_d1',
        sceneNumber: 1,
        durationSec: 5,
        visualDirection: 'Overhead reveal of full camera & mic layout',
        cameraAngle: 'Top-down flatlay',
        voiceoverLine: 'Here is how I shoot a week of Reels in forty-five minutes.',
        onScreenText: '45-Min Weekly Reel Rig',
        bRollSuggestion: 'Desk overhead establishing shot',
      },
      {
        id: 'sc_d2',
        sceneNumber: 2,
        durationSec: 7,
        visualDirection: 'Zoom into storyboard notebook and wireless mic',
        cameraAngle: 'Tight detail',
        voiceoverLine: 'Draft three hooks on paper first, clip your wireless mic, and batch film.',
        onScreenText: 'Hook -> Mic -> Batch',
        bRollSuggestion: 'Writing hook lines in notebook',
      },
    ],
  },
];

const MUSIC_TRACKS = [
  { id: 'lofi', name: 'Warm Lo-Fi Café (88 BPM)', freq: 220 },
  { id: 'synth', name: 'Kinetic Creator Pulse (118 BPM)', freq: 330 },
  { id: 'acoustic', name: 'Sunlit Acoustic Morning (96 BPM)', freq: 261.6 },
];

export function AIStudioScreen({
  geminiConfigured,
  onSendToScheduler,
}: AIStudioScreenProps) {
  const [activeTab, setActiveTab] = useState<
    'text_to_reel' | 'image_to_video' | 'video_tools' | 'marketing'
  >('text_to_reel');

  // Text-to-Reel State
  const [topic, setTopic] = useState(
    '3 morning habits that double my creative output before 10 AM'
  );
  const [tone, setTone] = useState('Energetic & Helpful');
  const [durationSec, setDurationSec] = useState(30);
  const [reelFormat, setReelFormat] = useState<AspectRatio>('9:16');
  const [reelPlatform, setReelPlatform] = useState('Instagram Reels');
  const [reelLoading, setReelLoading] = useState(false);
  const [reelError, setReelError] = useState<string | null>(null);
  const [reelResult, setReelResult] = useState<TextToReelResult | null>(null);

  // Image-to-Video State
  const [i2vProduct, setI2vProduct] = useState('Aura Obsidian Wireless Headphones');
  const [i2vGoal, setI2vGoal] = useState('Product Launch & Pre-Order');
  const [i2vFormat, setI2vFormat] = useState<AspectRatio>('9:16');
  const [i2vMotion, setI2vMotion] = useState('Ken Burns Zoom & Kinetic Type');
  const [i2vImage, setI2vImage] = useState<string>(SAMPLE_ASSETS.reelProduct);
  const [i2vLoading, setI2vLoading] = useState(false);
  const [i2vError, setI2vError] = useState<string | null>(null);
  const [i2vResult, setI2vResult] = useState<ImageToVideoResult | null>(null);
  const [i2vPlaying, setI2vPlaying] = useState(false);
  const [i2vSceneIdx, setI2vSceneIdx] = useState(0);

  // AI Video Tools (Timeline & Export Studio) State
  const [editorTitle, setEditorTitle] = useState('Product Launch Reveal');
  const [editorFormat, setEditorFormat] = useState<AspectRatio>('9:16');
  const [editorTemplate, setEditorTemplate] = useState('tpl_product');
  const [editorMedia, setEditorMedia] = useState(SAMPLE_ASSETS.reelProduct);
  const [scenes, setScenes] = useState<StoryboardScene[]>(VIDEO_TEMPLATES[0].scenes);
  const [subtitlesOn, setSubtitlesOn] = useState(true);
  const [voiceoverOn, setVoiceoverOn] = useState(true);
  const [voiceStyle, setVoiceStyle] = useState('Warm Narrator');
  const [musicTrack, setMusicTrack] = useState(MUSIC_TRACKS[0].id);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(15);
  const [playheadSec, setPlayheadSec] = useState(0);
  const [editorPlaying, setEditorPlaying] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // AI Marketing Assistant State
  const [mktMode, setMktMode] = useState<
    'captions' | 'hashtags' | 'ideas' | 'ad_copy' | 'calendar'
  >('captions');
  const [mktTopic, setMktTopic] = useState('Artisanal Iced Matcha Summer Menu Drop');
  const [mktVoice, setMktVoice] = useState('Warm, modern, and inviting');
  const [mktPlatform, setMktPlatform] = useState('Instagram');
  const [mktLoading, setMktLoading] = useState(false);
  const [mktError, setMktError] = useState<string | null>(null);
  const [mktResult, setMktResult] = useState<MarketingResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalTimelineDuration = useMemo(
    () => Math.max(5, scenes.reduce((s, sc) => s + sc.durationSec, 0)),
    [scenes]
  );

  // Keep trimEnd synced when scenes change
  useEffect(() => {
    setTrimEnd(totalTimelineDuration);
    if (playheadSec > totalTimelineDuration) setPlayheadSec(0);
  }, [totalTimelineDuration, playheadSec]);

  // Playback timer for AI Video Tools timeline
  useEffect(() => {
    if (!editorPlaying) return;
    const timer = setInterval(() => {
      setPlayheadSec((prev) => {
        const next = prev + 0.25;
        if (next >= trimEnd) {
          return trimStart;
        }
        return next;
      });
    }, 250);
    return () => clearInterval(timer);
  }, [editorPlaying, trimStart, trimEnd]);

  // Playback timer for Image-to-Video motion preview
  useEffect(() => {
    if (!i2vPlaying) return;
    const count = i2vResult?.motionScenes?.length || 3;
    const timer = setInterval(() => {
      setI2vSceneIdx((prev) => (prev + 1) % count);
    }, 2400);
    return () => clearInterval(timer);
  }, [i2vPlaying, i2vResult]);

  // Determine active scene at playhead
  const activeEditorScene = useMemo(() => {
    let elapsed = 0;
    for (const sc of scenes) {
      if (playheadSec <= elapsed + sc.durationSec) return sc;
      elapsed += sc.durationSec;
    }
    return scenes[0];
  }, [scenes, playheadSec]);

  const handleGenerateTextToReel = async () => {
    setReelLoading(true);
    setReelError(null);
    try {
      const res = await apiRequest<{ result: TextToReelResult }>('/api/ai/text-to-reel', {
        method: 'POST',
        body: JSON.stringify({
          topic,
          tone,
          durationSec,
          format: reelFormat,
          platform: reelPlatform,
        }),
      });
      setReelResult(res.result);
    } catch (err) {
      setReelError(err instanceof Error ? err.message : 'Unable to generate reel script.');
    } finally {
      setReelLoading(false);
    }
  };

  const handleLoadReelIntoEditor = () => {
    if (!reelResult) return;
    setEditorTitle(reelResult.title);
    setEditorFormat(reelFormat);
    setScenes(
      reelResult.scenes.map((sc, i) => ({
        ...sc,
        id: `ai_sc_${i}_${Date.now()}`,
      }))
    );
    setTrimStart(0);
    setPlayheadSec(0);
    setActiveTab('video_tools');
  };

  const handleUploadI2VImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setI2vImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateImageToVideo = async () => {
    setI2vLoading(true);
    setI2vError(null);
    try {
      const isDataUrl = i2vImage.startsWith('data:');
      const res = await apiRequest<{ result: ImageToVideoResult }>('/api/ai/image-to-video', {
        method: 'POST',
        body: JSON.stringify({
          imageDataUrl: isDataUrl ? i2vImage : undefined,
          imagePath: !isDataUrl ? i2vImage : undefined,
          productName: i2vProduct,
          goal: i2vGoal,
          format: i2vFormat,
          motionStyle: i2vMotion,
        }),
      });
      setI2vResult(res.result);
      setI2vSceneIdx(0);
      setI2vPlaying(true);
    } catch (err) {
      setI2vError(err instanceof Error ? err.message : 'Image-to-video concepting failed.');
    } finally {
      setI2vLoading(false);
    }
  };

  const handleGenerateMarketing = async () => {
    setMktLoading(true);
    setMktError(null);
    try {
      const res = await apiRequest<{ result: MarketingResult }>('/api/ai/marketing-assistant', {
        method: 'POST',
        body: JSON.stringify({
          mode: mktMode,
          topic: mktTopic,
          brandVoice: mktVoice,
          platform: mktPlatform,
        }),
      });
      setMktResult(res.result);
    } catch (err) {
      setMktError(err instanceof Error ? err.message : 'Marketing assistant failed.');
    } finally {
      setMktLoading(false);
    }
  };

  const handlePreviewVoiceover = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const text = scenes.map((s) => s.voiceoverLine).join('. ');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceStyle === 'Energetic Creator' ? 1.12 : 0.96;
    window.speechSynthesis.speak(utterance);
  };

  const handleToggleMusicPreview = () => {
    if (audioPlaying) {
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      setAudioPlaying(false);
      return;
    }
    try {
      const track = MUSIC_TRACKS.find((t) => t.id === musicTrack) || MUSIC_TRACKS[0];
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = track.freq;
      gain.gain.value = 0.04;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      audioCtxRef.current = ctx;
      setAudioPlaying(true);
      setTimeout(() => {
        ctx.close().catch(() => {});
        if (audioCtxRef.current === ctx) {
          audioCtxRef.current = null;
          setAudioPlaying(false);
        }
      }, 2400);
    } catch {
      setAudioPlaying(false);
    }
  };

  const handleExportStoryboard = () => {
    const payload = {
      title: editorTitle,
      format: editorFormat,
      trimRangeSec: [trimStart, trimEnd],
      subtitlesEnabled: subtitlesOn,
      voiceoverEnabled: voiceoverOn,
      voiceStyle,
      musicTrack,
      scenes,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${editorTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-reel-blueprint.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const moveScene = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= scenes.length) return;
    setScenes((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    });
  };

  const copyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // ignore clipboard restriction
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header & Mode Tabs */}
      <section className="rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#0b1c30] dark:text-white">
              AI Reel Studio
            </h1>
            <p className="text-sm text-[#464554] dark:text-[#94A3B8]">
              Generate scripts, visual storyboards, product motion previews, subtitles, and marketing calendars.
            </p>
          </div>
          <div className="text-xs font-semibold text-[#464554] dark:text-[#94A3B8]">
            {geminiConfigured ? (
              <span className="text-[#006c49] dark:text-[#4EDEA3]">
                Gemini API Ready (gemini-4-hydrogen)
              </span>
            ) : (
              <span className="text-[#ba1a1a] dark:text-[#ffb4ab]">
                Gemini API Key Not Set — Configure in Settings &gt; Secrets
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'text_to_reel', label: 'A. Text-to-Reel', Icon: Clapperboard },
            { id: 'image_to_video', label: 'B. Image-to-Video', Icon: ImageIcon },
            { id: 'video_tools', label: 'C. AI Video Tools', Icon: Scissors },
            { id: 'marketing', label: 'D. Marketing Assistant', Icon: Wand2 },
          ].map((tab) => {
            const Icon = tab.Icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`min-h-[42px] px-4 py-2 rounded-full text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-[#4648d4] dark:bg-gradient-to-r dark:from-[#8B5CF6] dark:to-[#EC4899] text-white'
                    : 'bg-[#f8f9ff] dark:bg-[#0A0D14] text-[#464554] dark:text-[#94A3B8] border border-slate-200 dark:border-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* TAB A: TEXT-TO-REEL */}
      {activeTab === 'text_to_reel' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
            <h2 className="font-display text-lg font-bold">Text-to-Reel Blueprint</h2>

            <div>
              <label className="block text-xs font-semibold mb-1.5">Topic or Video Prompt</label>
              <textarea
                rows={4}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Describe your product, story, or reel idea..."
                className="w-full rounded-xl p-3.5 text-sm bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#4648d4] dark:focus:border-[#8B5CF6]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl px-3 text-xs bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10"
                >
                  <option>Energetic &amp; Helpful</option>
                  <option>Cinematic &amp; Minimal</option>
                  <option>Educational Breakdown</option>
                  <option>Product Launch Hype</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Target Platform</label>
                <select
                  value={reelPlatform}
                  onChange={(e) => setReelPlatform(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl px-3 text-xs bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10"
                >
                  <option>Instagram Reels</option>
                  <option>YouTube Shorts</option>
                  <option>Facebook Reels</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Duration</label>
                <div className="flex gap-1.5">
                  {[15, 30, 60].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setDurationSec(sec)}
                      className={`flex-1 min-h-[38px] rounded-xl text-xs font-mono-num font-semibold ${
                        durationSec === sec
                          ? 'bg-[#4648d4] dark:bg-[#8B5CF6] text-white'
                          : 'bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Video Format</label>
                <div className="flex gap-1.5">
                  {(['9:16', '1:1', '16:9'] as AspectRatio[]).map((ar) => (
                    <button
                      key={ar}
                      type="button"
                      onClick={() => setReelFormat(ar)}
                      className={`flex-1 min-h-[38px] rounded-xl text-xs font-mono-num font-semibold ${
                        reelFormat === ar
                          ? 'bg-[#4648d4] dark:bg-[#8B5CF6] text-white'
                          : 'bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10'
                      }`}
                    >
                      {ar}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {reelError && (
              <div className="rounded-xl p-3 text-xs font-medium bg-[#ffdad6]/50 dark:bg-[#93000a]/30 text-[#ba1a1a] dark:text-[#ffb4ab]">
                {reelError}
              </div>
            )}

            <button
              type="button"
              disabled={reelLoading}
              onClick={handleGenerateTextToReel}
              className="w-full min-h-[48px] rounded-full bg-[#4648d4] hover:bg-[#3a3cc2] dark:bg-gradient-to-r dark:from-[#8B5CF6] dark:to-[#EC4899] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              <span>{reelLoading ? 'Generating Script & Storyboard...' : 'Generate Reel Script'}</span>
            </button>
          </div>

          {/* Result Column */}
          <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 space-y-5">
            {!reelResult ? (
              <div className="py-12 px-4 text-center space-y-2">
                <Film className="w-9 h-9 mx-auto text-[#4648d4] dark:text-[#d0bcff]" />
                <h3 className="font-display text-base font-bold">
                  Ready to draft your next Reel
                </h3>
                <p className="text-xs text-[#464554] dark:text-[#94A3B8] max-w-md mx-auto">
                  Enter a topic and click Generate Reel Script to get a hook, timed voiceover, scene-by-scene storyboard, visual b-roll suggestions, and captions via Gemini.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                  <div>
                    <p className="text-xs font-semibold text-[#4648d4] dark:text-[#4cd7f6]">
                      {reelFormat} · {durationSec}s · {reelResult.musicMood}
                    </p>
                    <h3 className="font-display text-xl font-bold mt-0.5">{reelResult.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleLoadReelIntoEditor}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#eff4ff] dark:bg-[#1A2035] text-[#4648d4] dark:text-[#d0bcff] text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Open in Video Tools</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onSendToScheduler({
                          title: reelResult.title,
                          caption: reelResult.captions.instagram,
                          hashtags: reelResult.hashtags,
                          mediaUrl: SAMPLE_ASSETS.reelCoffee,
                          aspectRatio: reelFormat,
                          platforms: ['instagram', 'youtube'],
                        })
                      }
                      className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#006c49] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span>Send to Scheduler</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl p-3.5 bg-[#f8f9ff] dark:bg-[#0A0D14] space-y-2">
                  <p className="text-xs font-bold text-[#4648d4] dark:text-[#d0bcff]">
                    Opening Hook (0–3s)
                  </p>
                  <p className="text-sm font-semibold">{reelResult.hook}</p>
                  <p className="text-xs font-bold pt-1 text-[#464554] dark:text-[#94A3B8]">
                    Full Voiceover Script
                  </p>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{reelResult.script}</p>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#464554] dark:text-[#94A3B8]">
                    Scene-by-Scene Storyboard
                  </h4>
                  <div className="space-y-2">
                    {reelResult.scenes.map((sc) => (
                      <div
                        key={sc.sceneNumber}
                        className="rounded-xl p-3.5 bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/70 dark:border-white/10 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>
                            Scene {sc.sceneNumber} · {sc.cameraAngle}
                          </span>
                          <span className="font-mono-num text-[#4648d4] dark:text-[#4cd7f6]">
                            {sc.durationSec}s
                          </span>
                        </div>
                        <p className="text-xs">
                          <strong>Visual:</strong> {sc.visualDirection}
                        </p>
                        <p className="text-xs text-[#464554] dark:text-[#94A3B8]">
                          <strong>Voiceover:</strong> &ldquo;{sc.voiceoverLine}&rdquo;
                        </p>
                        <p className="text-xs text-[#006c49] dark:text-[#4EDEA3]">
                          <strong>On-screen text:</strong> {sc.onScreenText} ·{' '}
                          <strong>B-roll:</strong> {sc.bRollSuggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl p-3.5 bg-[#f8f9ff] dark:bg-[#0A0D14] space-y-2 text-xs">
                  <p className="font-bold">Generated Captions &amp; Hashtags</p>
                  <p>
                    <strong>Instagram:</strong> {reelResult.captions.instagram}
                  </p>
                  <p>
                    <strong>YouTube Shorts:</strong> {reelResult.captions.youtube}
                  </p>
                  <p className="text-[#4648d4] dark:text-[#d0bcff] font-medium">
                    {reelResult.hashtags.join(' ')}
                  </p>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* TAB B: IMAGE-TO-VIDEO */}
      {activeTab === 'image_to_video' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
            <h2 className="font-display text-lg font-bold">Image-to-Video Promo Studio</h2>

            <div>
              <label className="block text-xs font-semibold mb-2">
                Upload Product Image or Choose Sample
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <label className="min-h-[40px] px-3.5 py-2 rounded-xl border border-dashed border-[#4648d4]/50 dark:border-[#8B5CF6]/50 text-xs font-semibold text-[#4648d4] dark:text-[#d0bcff] inline-flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadI2VImage}
                    className="sr-only"
                  />
                </label>
                {[
                  { label: 'Headphones', url: SAMPLE_ASSETS.reelProduct },
                  { label: 'Matcha', url: SAMPLE_ASSETS.reelCoffee },
                  { label: 'Desk Rig', url: SAMPLE_ASSETS.postWorkspace },
                ].map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setI2vImage(s.url)}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold ${
                      i2vImage === s.url
                        ? 'border-[#4648d4] bg-[#eff4ff] dark:border-[#8B5CF6] dark:bg-[#8B5CF6]/20'
                        : 'border-slate-200 dark:border-white/10'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">Product / Subject Name</label>
              <input
                type="text"
                value={i2vProduct}
                onChange={(e) => setI2vProduct(e.target.value)}
                className="w-full min-h-[42px] rounded-xl px-3.5 text-sm bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Motion Effect</label>
                <select
                  value={i2vMotion}
                  onChange={(e) => setI2vMotion(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl px-3 text-xs bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10"
                >
                  <option>Ken Burns Zoom &amp; Kinetic Type</option>
                  <option>Parallax Depth Slide</option>
                  <option>Stop-Motion Pulse Reveal</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Format</label>
                <div className="flex gap-1.5">
                  {(['9:16', '1:1', '16:9'] as AspectRatio[]).map((ar) => (
                    <button
                      key={ar}
                      type="button"
                      onClick={() => setI2vFormat(ar)}
                      className={`flex-1 min-h-[42px] rounded-xl text-xs font-mono-num font-semibold ${
                        i2vFormat === ar
                          ? 'bg-[#4648d4] dark:bg-[#8B5CF6] text-white'
                          : 'bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10'
                      }`}
                    >
                      {ar}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">Campaign Goal</label>
              <input
                type="text"
                value={i2vGoal}
                onChange={(e) => setI2vGoal(e.target.value)}
                className="w-full min-h-[42px] rounded-xl px-3.5 text-sm bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10"
              />
            </div>

            {i2vError && (
              <div className="rounded-xl p-3 text-xs font-medium bg-[#ffdad6]/50 dark:bg-[#93000a]/30 text-[#ba1a1a] dark:text-[#ffb4ab]">
                {i2vError}
              </div>
            )}

            <button
              type="button"
              disabled={i2vLoading}
              onClick={handleGenerateImageToVideo}
              className="w-full min-h-[48px] rounded-full bg-[#4648d4] dark:bg-gradient-to-r dark:from-[#8B5CF6] dark:to-[#EC4899] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {i2vLoading ? 'Analyzing Product Image...' : 'Generate Motion Video Concept'}
              </span>
            </button>

            <div className="rounded-xl p-3 bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/70 dark:border-white/10 text-[11px] text-[#464554] dark:text-[#94A3B8]">
              <strong>Modular Video Render Slot:</strong> Gemini analyzes your product image and builds the motion storyboard; live cloud MP4 rendering (e.g., Veo / Runway) plugs into this provider slot once configured. Below is an interactive real-time motion preview.
            </div>
          </div>

          {/* Right Live Motion Preview + Concept Breakdown */}
          <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-lg font-bold">
                {i2vResult ? i2vResult.conceptTitle : 'Interactive Motion Preview'}
              </h3>
              <button
                type="button"
                onClick={() => setI2vPlaying((p) => !p)}
                className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#eff4ff] dark:bg-[#1A2035] text-[#4648d4] dark:text-[#d0bcff] text-xs font-semibold inline-flex items-center gap-1.5"
              >
                {i2vPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{i2vPlaying ? 'Pause Motion' : 'Play Motion Preview'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              <div className="sm:col-span-6">
                <div
                  className={`relative mx-auto rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/30 shadow-lg ${
                    i2vFormat === '9:16'
                      ? 'aspect-[9/16] max-w-[240px]'
                      : i2vFormat === '1:1'
                        ? 'aspect-square max-w-[280px]'
                        : 'aspect-video w-full'
                  }`}
                >
                  <img
                    src={i2vImage}
                    alt={i2vProduct}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-transform duration-[2200ms] ease-out ${
                      i2vPlaying
                        ? i2vSceneIdx % 2 === 0
                          ? 'scale-110 translate-x-1'
                          : 'scale-100 -translate-x-1'
                        : 'scale-100'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                  <div className="absolute bottom-4 left-3 right-3 text-white space-y-1">
                    <p className="text-[10px] font-mono-num uppercase tracking-wider text-white/80">
                      Scene {i2vSceneIdx + 1} ·{' '}
                      {i2vResult?.motionScenes?.[i2vSceneIdx]?.transitionType || i2vMotion}
                    </p>
                    <p className="font-display text-sm font-bold leading-snug">
                      {i2vResult?.motionScenes?.[i2vSceneIdx]?.headlineOverlay || i2vProduct}
                    </p>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-6 space-y-3">
                {i2vResult ? (
                  <>
                    <div className="rounded-xl p-3 bg-[#f8f9ff] dark:bg-[#0A0D14] text-xs space-y-1">
                      <p className="font-bold">Gemini Visual Analysis</p>
                      <p className="text-[#464554] dark:text-[#94A3B8]">{i2vResult.visualAnalysis}</p>
                    </div>
                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                      {i2vResult.motionScenes.map((ms, idx) => (
                        <button
                          key={ms.sceneNumber}
                          type="button"
                          onClick={() => setI2vSceneIdx(idx)}
                          className={`w-full text-left rounded-xl p-2.5 border text-xs transition-colors ${
                            i2vSceneIdx === idx
                              ? 'border-[#4648d4] bg-[#eff4ff] dark:border-[#8B5CF6] dark:bg-[#8B5CF6]/15'
                              : 'border-slate-200/70 dark:border-white/10 bg-[#f8f9ff] dark:bg-[#0A0D14]'
                          }`}
                        >
                          <p className="font-bold">
                            Scene {ms.sceneNumber} · {ms.transitionType} ({ms.durationSec}s)
                          </p>
                          <p className="text-[#464554] dark:text-[#94A3B8] mt-0.5">
                            {ms.motionInstruction}
                          </p>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onSendToScheduler({
                          title: i2vResult.conceptTitle,
                          caption: i2vResult.promotionalCaption,
                          hashtags: i2vResult.hashtags,
                          mediaUrl: i2vImage,
                          aspectRatio: i2vFormat,
                          platforms: ['instagram', 'facebook'],
                        })
                      }
                      className="w-full min-h-[42px] rounded-full bg-[#006c49] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                    >
                      <CalendarPlus className="w-4 h-4" />
                      <span>Schedule Promo Concept</span>
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-[#464554] dark:text-[#94A3B8] leading-relaxed">
                    Click <strong>Generate Motion Video Concept</strong> to let Gemini inspect your product image and generate timed camera movements, overlays, and ad copy.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB C: AI VIDEO TOOLS (TIMELINE, SUBTITLES, VOICEOVER, MUSIC, EXPORT) */}
      {activeTab === 'video_tools' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Timeline & Audio Controls */}
          <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold">{editorTitle}</h2>
                <p className="text-xs text-[#464554] dark:text-[#94A3B8]">
                  Templates, scene arrangement, timeline trimming, auto-subtitles &amp; audio cues
                </p>
              </div>
              <div className="flex items-center gap-1">
                {(['9:16', '1:1', '16:9'] as AspectRatio[]).map((ar) => (
                  <button
                    key={ar}
                    type="button"
                    onClick={() => setEditorFormat(ar)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono-num font-semibold ${
                      editorFormat === ar
                        ? 'bg-[#4648d4] dark:bg-[#8B5CF6] text-white'
                        : 'bg-[#f8f9ff] dark:bg-[#0A0D14] text-[#464554] dark:text-[#94A3B8]'
                    }`}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Templates */}
            <div>
              <label className="block text-xs font-semibold mb-2">Video Templates</label>
              <div className="flex flex-wrap gap-2">
                {VIDEO_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setEditorTemplate(tpl.id);
                      setEditorTitle(tpl.name);
                      setEditorFormat(tpl.format);
                      setEditorMedia(tpl.mediaUrl);
                      setScenes(tpl.scenes);
                      setPlayheadSec(0);
                    }}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border text-xs font-semibold ${
                      editorTemplate === tpl.id
                        ? 'border-[#4648d4] bg-[#eff4ff] text-[#4648d4] dark:border-[#8B5CF6] dark:bg-[#8B5CF6]/20 dark:text-[#d0bcff]'
                        : 'border-slate-200 dark:border-white/10'
                    }`}
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Capsule Timeline Scrubber & Trim */}
            <div className="rounded-xl p-4 bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/70 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-[#4648d4] dark:text-[#4cd7f6]" />
                  <span>Timeline Scrubber &amp; Trim</span>
                </span>
                <span className="font-mono-num">
                  {playheadSec.toFixed(1)}s / {totalTimelineDuration}s (Trim {trimStart}s–{trimEnd}s)
                </span>
              </div>

              {/* Playhead Slider */}
              <input
                type="range"
                min={0}
                max={totalTimelineDuration}
                step={0.25}
                value={playheadSec}
                onChange={(e) => setPlayheadSec(Number(e.target.value))}
                className="w-full accent-[#006c49] dark:accent-[#4EDEA3]"
                aria-label="Timeline playhead scrubber"
              />

              {/* Trim Controls */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] text-[#464554] dark:text-[#94A3B8] mb-1">
                    Trim In ({trimStart}s)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, trimEnd - 2)}
                    step={1}
                    value={trimStart}
                    onChange={(e) => setTrimStart(Number(e.target.value))}
                    className="w-full accent-[#4648d4] dark:accent-[#8B5CF6]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#464554] dark:text-[#94A3B8] mb-1">
                    Trim Out ({trimEnd}s)
                  </label>
                  <input
                    type="range"
                    min={Math.min(totalTimelineDuration, trimStart + 2)}
                    max={totalTimelineDuration}
                    step={1}
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(Number(e.target.value))}
                    className="w-full accent-[#4648d4] dark:accent-[#8B5CF6]"
                  />
                </div>
              </div>
            </div>

            {/* Scene Arrangement */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold">Scene Arrangement</label>
                <button
                  type="button"
                  onClick={() =>
                    setScenes((prev) => [
                      ...prev,
                      {
                        id: `sc_${Date.now()}`,
                        sceneNumber: prev.length + 1,
                        durationSec: 4,
                        visualDirection: 'Close-up detail shot',
                        cameraAngle: 'Eye-level',
                        voiceoverLine: 'Add your voiceover line here.',
                        onScreenText: 'New Scene Caption',
                        bRollSuggestion: 'Product detail',
                      },
                    ])
                  }
                  className="text-xs font-semibold text-[#4648d4] dark:text-[#d0bcff] inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Scene</span>
                </button>
              </div>

              <div className="space-y-2">
                {scenes.map((sc, idx) => (
                  <div
                    key={sc.id}
                    className="rounded-xl p-3 bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/70 dark:border-white/10 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold">
                        Scene {idx + 1} · {sc.durationSec}s
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveScene(idx, -1)}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 disabled:opacity-30"
                          aria-label="Move scene up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveScene(idx, 1)}
                          disabled={idx === scenes.length - 1}
                          className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 disabled:opacity-30"
                          aria-label="Move scene down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        {scenes.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setScenes((prev) =>
                                prev
                                  .filter((item) => item.id !== sc.id)
                                  .map((item, i) => ({ ...item, sceneNumber: i + 1 }))
                              )
                            }
                            className="p-1.5 rounded-lg text-[#ba1a1a] dark:text-[#ffb4ab] hover:bg-[#ffdad6]/30"
                            aria-label="Remove scene"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={sc.onScreenText}
                        onChange={(e) =>
                          setScenes((prev) =>
                            prev.map((item) =>
                              item.id === sc.id ? { ...item, onScreenText: e.target.value } : item
                            )
                          )
                        }
                        placeholder="On-screen subtitle / hook"
                        className="min-h-[36px] rounded-lg px-2.5 text-xs bg-white dark:bg-[#121624] border border-slate-200 dark:border-white/10"
                      />
                      <input
                        type="text"
                        value={sc.voiceoverLine}
                        onChange={(e) =>
                          setScenes((prev) =>
                            prev.map((item) =>
                              item.id === sc.id ? { ...item, voiceoverLine: e.target.value } : item
                            )
                          )
                        }
                        placeholder="Voiceover line"
                        className="min-h-[36px] rounded-lg px-2.5 text-xs bg-white dark:bg-[#121624] border border-slate-200 dark:border-white/10"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtitles, Voiceover & Music */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl p-3 bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/70 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="inline-flex items-center gap-1.5">
                    <Subtitles className="w-3.5 h-3.5" />
                    <span>Auto-Subtitles</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={subtitlesOn}
                    onChange={(e) => setSubtitlesOn(e.target.checked)}
                    className="accent-[#4648d4]"
                  />
                </div>
                <p className="text-[11px] text-[#464554] dark:text-[#94A3B8]">
                  Synced to timeline playhead
                </p>
              </div>

              <div className="rounded-xl p-3 bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/70 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="inline-flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5" />
                    <span>AI Voiceover</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={voiceoverOn}
                    onChange={(e) => setVoiceoverOn(e.target.checked)}
                    className="accent-[#4648d4]"
                  />
                </div>
                <select
                  value={voiceStyle}
                  onChange={(e) => setVoiceStyle(e.target.value)}
                  className="w-full rounded-lg px-2 py-1 text-[11px] bg-white dark:bg-[#121624] border border-slate-200 dark:border-white/10"
                >
                  <option>Warm Narrator</option>
                  <option>Energetic Creator</option>
                </select>
                <button
                  type="button"
                  onClick={handlePreviewVoiceover}
                  className="text-[11px] font-semibold text-[#4648d4] dark:text-[#d0bcff] hover:underline"
                >
                  Preview Speech
                </button>
              </div>

              <div className="rounded-xl p-3 bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/70 dark:border-white/10 space-y-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold">
                  <Music className="w-3.5 h-3.5" />
                  <span>Background Music</span>
                </span>
                <select
                  value={musicTrack}
                  onChange={(e) => setMusicTrack(e.target.value)}
                  className="w-full rounded-lg px-2 py-1 text-[11px] bg-white dark:bg-[#121624] border border-slate-200 dark:border-white/10"
                >
                  {MUSIC_TRACKS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleToggleMusicPreview}
                  className="text-[11px] font-semibold text-[#006c49] dark:text-[#4EDEA3] hover:underline"
                >
                  {audioPlaying ? 'Stop Tone Preview' : 'Test Audio Cue'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Preview & Export */}
          <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold">Video Canvas &amp; Export</h3>
              <button
                type="button"
                onClick={() => setEditorPlaying((p) => !p)}
                className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#4648d4] dark:bg-[#8B5CF6] text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                {editorPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{editorPlaying ? 'Pause' : 'Play'}</span>
              </button>
            </div>

            <div
              className={`relative mx-auto rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/30 ${
                editorFormat === '9:16'
                  ? 'aspect-[9/16] max-w-[250px]'
                  : editorFormat === '1:1'
                    ? 'aspect-square max-w-[290px]'
                    : 'aspect-video w-full'
              }`}
            >
              <img
                src={editorMedia}
                alt={editorTitle}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover transition-transform duration-500 ${
                  editorPlaying ? 'scale-105' : 'scale-100'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
              {subtitlesOn && activeEditorScene && (
                <div className="absolute bottom-5 left-3 right-3 text-center space-y-1">
                  <span className="inline-block px-3 py-1 rounded-lg bg-black/75 text-white text-xs font-bold">
                    {activeEditorScene.onScreenText}
                  </span>
                  <p className="text-[11px] text-white/85 line-clamp-2">
                    {activeEditorScene.voiceoverLine}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleExportStoryboard}
                className="flex-1 min-h-[44px] px-4 py-2 rounded-full border border-slate-200 dark:border-white/15 text-xs font-semibold inline-flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Blueprint</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onSendToScheduler({
                    title: editorTitle,
                    caption: scenes.map((s) => s.voiceoverLine).join(' '),
                    hashtags: ['#PostEase', '#ReelsStudio'],
                    mediaUrl: editorMedia,
                    aspectRatio: editorFormat,
                    platforms: ['instagram', 'youtube'],
                  })
                }
                className="flex-1 min-h-[44px] px-4 py-2 rounded-full bg-[#006c49] text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Send to Scheduler</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TAB D: AI MARKETING ASSISTANT */}
      {activeTab === 'marketing' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
            <h2 className="font-display text-lg font-bold">AI Marketing Assistant</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  ['captions', 'Captions'],
                  ['hashtags', 'Hashtags'],
                  ['ideas', 'Trending Ideas'],
                  ['ad_copy', 'Product Ads'],
                  ['calendar', '7-Day Calendar'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMktMode(id)}
                  className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                    mktMode === id
                      ? 'border-[#4648d4] bg-[#eff4ff] text-[#4648d4] dark:border-[#8B5CF6] dark:bg-[#8B5CF6]/20 dark:text-[#d0bcff]'
                      : 'border-slate-200 dark:border-white/10 text-[#464554] dark:text-[#94A3B8]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">
                Product, Niche or Campaign Brief
              </label>
              <textarea
                rows={3}
                value={mktTopic}
                onChange={(e) => setMktTopic(e.target.value)}
                className="w-full rounded-xl p-3 text-sm bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Brand Voice</label>
                <input
                  type="text"
                  value={mktVoice}
                  onChange={(e) => setMktVoice(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl px-3 text-xs bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Platform Focus</label>
                <select
                  value={mktPlatform}
                  onChange={(e) => setMktPlatform(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl px-3 text-xs bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10"
                >
                  <option>Instagram</option>
                  <option>YouTube</option>
                  <option>Facebook</option>
                  <option>WhatsApp Business</option>
                </select>
              </div>
            </div>

            {mktError && (
              <div className="rounded-xl p-3 text-xs font-medium bg-[#ffdad6]/50 dark:bg-[#93000a]/30 text-[#ba1a1a] dark:text-[#ffb4ab]">
                {mktError}
              </div>
            )}

            <button
              type="button"
              disabled={mktLoading}
              onClick={handleGenerateMarketing}
              className="w-full min-h-[48px] rounded-full bg-[#4648d4] dark:bg-gradient-to-r dark:from-[#8B5CF6] dark:to-[#EC4899] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Wand2 className="w-4 h-4" />
              <span>{mktLoading ? 'Generating Strategy...' : 'Generate with Gemini'}</span>
            </button>
          </div>

          <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
            {!mktResult ? (
              <div className="py-12 text-center space-y-2">
                <Wand2 className="w-8 h-8 mx-auto text-[#4648d4] dark:text-[#d0bcff]" />
                <h3 className="font-display text-base font-bold">
                  AI Marketing Strategy Output
                </h3>
                <p className="text-xs text-[#464554] dark:text-[#94A3B8] max-w-md mx-auto">
                  Select a marketing mode—Captions, Hashtags, Trending Ideas, Product Ads, or a 7-Day Content Calendar—and push any generated card straight into your Scheduler.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-[#0b1c30] dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-white/5">
                  {mktResult.summary}
                </p>
                <div className="space-y-3">
                  {mktResult.items.map((item, idx) => (
                    <div
                      key={`${item.label}_${idx}`}
                      className="rounded-xl p-4 bg-[#f8f9ff] dark:bg-[#0A0D14] border border-slate-200/70 dark:border-white/10 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#4648d4] dark:text-[#4cd7f6]">
                          {item.label} · {item.platform} · {item.format}
                        </span>
                        <span className="text-[11px] font-mono-num text-[#464554] dark:text-[#94A3B8]">
                          {item.bestTime}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{item.content}</p>
                      {item.hashtags?.length > 0 && (
                        <p className="text-[11px] font-medium text-[#4648d4] dark:text-[#d0bcff]">
                          {item.hashtags.join(' ')}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => copyText(`mkt_${idx}`, item.content)}
                          className="min-h-[34px] px-3 py-1 rounded-full border border-slate-200 dark:border-white/15 text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          {copiedId === `mkt_${idx}` ? (
                            <Check className="w-3 h-3 text-[#006c49]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === `mkt_${idx}` ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onSendToScheduler({
                              title: item.label,
                              caption: item.content,
                              hashtags: item.hashtags || [],
                              mediaUrl: SAMPLE_ASSETS.postWorkspace,
                              aspectRatio: '9:16',
                              platforms: ['instagram'],
                            })
                          }
                          className="min-h-[34px] px-3 py-1 rounded-full bg-[#4648d4] dark:bg-[#8B5CF6] text-white text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <CalendarPlus className="w-3 h-3" />
                          <span>Schedule Item</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
