import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import {
  hashPassword,
  loadDb,
  sanitizeUser,
  saveDb,
  verifyPassword,
  type StoredUser,
} from './server/store.ts';
import {
  generateImageToVideoConcept,
  generateMarketingAssistance,
  generateTextToReel,
  isGeminiConfigured,
} from './server/gemini.ts';
import type { PlatformId, ScheduledPost, SocialAccount, Workspace } from './src/types/postease.ts';

const PORT = 3000;
const UPLOADS_DIR = path.resolve(process.cwd(), 'data', 'uploads');

function getSessionToken(req: express.Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/postease_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function getAuthenticatedUser(req: express.Request): StoredUser | null {
  const token = getSessionToken(req);
  if (!token) return null;
  const db = loadDb();
  const userId = db.sessions[token];
  if (!userId) return null;
  return db.users.find((u) => u.id === userId) || null;
}

function setSessionCookie(res: express.Response, token: string) {
  res.cookie('postease_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 14,
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  app.use('/uploads', express.static(UPLOADS_DIR));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      geminiConfigured: isGeminiConfigured(),
    });
  });

  app.get('/api/bootstrap', (req, res) => {
    const db = loadDb();
    const user = getAuthenticatedUser(req);

    const integrations = {
      geminiConfigured: isGeminiConfigured(),
      metaConfigured: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
      youtubeConfigured: Boolean(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET),
      whatsappConfigured: Boolean(
        process.env.WHATSAPP_CLOUD_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
      ),
    };

    if (!user) {
      return res.json({
        authenticated: false,
        user: null,
        workspaces: [],
        accounts: [],
        posts: [],
        notifications: [],
        integrations,
      });
    }

    return res.json({
      authenticated: true,
      user: sanitizeUser(user),
      workspaces: db.workspaces,
      accounts: db.accounts,
      posts: db.posts,
      notifications: db.notifications,
      integrations,
    });
  });

  app.post('/api/auth/demo-login', (_req, res) => {
    const db = loadDb();
    const demoUser = db.users[0];
    const token = crypto.randomBytes(24).toString('hex');
    db.sessions[token] = demoUser.id;
    saveDb(db);
    setSessionCookie(res, token);
    res.json({
      token,
      user: sanitizeUser(demoUser),
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const db = loadDb();
    const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase().trim());
    if (!user || !verifyPassword(String(password), user.passwordHash, user.passwordSalt)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const token = crypto.randomBytes(24).toString('hex');
    db.sessions[token] = user.id;
    saveDb(db);
    setSessionCookie(res, token);
    res.json({ token, user: sanitizeUser(user) });
  });

  app.post('/api/auth/signup', (req, res) => {
    const { name, email, password, accountType, handle, bio } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const db = loadDb();
    const existing = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const { hash, salt } = hashPassword(String(password));
    const userId = `usr_${crypto.randomBytes(6).toString('hex')}`;
    const cleanHandle =
      handle && String(handle).trim()
        ? String(handle).startsWith('@')
          ? String(handle).trim()
          : `@${String(handle).trim()}`
        : `@${String(name).toLowerCase().replace(/[^a-z0-9]/g, '') || 'creator'}`;

    const newUser: StoredUser = {
      id: userId,
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      handle: cleanHandle,
      avatarUrl: '/src/assets/images/creator_avatar_main_1794724057123.jpg',
      accountType: accountType || 'Content Creator',
      bio: bio || 'Creating & scheduling multi-platform content with PostEase.',
      language: 'English',
      theme: 'light',
      planId: 'free',
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

    db.users.push(newUser);
    const token = crypto.randomBytes(24).toString('hex');
    db.sessions[token] = userId;
    saveDb(db);
    setSessionCookie(res, token);
    res.status(201).json({ token, user: sanitizeUser(newUser) });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body || {};
    if (!email || !String(email).includes('@')) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }
    res.json({
      ok: true,
      message: `If an account exists for ${String(email).trim()}, a password reset link has been queued (demo notification).`,
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = getSessionToken(req);
    if (token) {
      const db = loadDb();
      delete db.sessions[token];
      saveDb(db);
    }
    res.clearCookie('postease_session', { path: '/' });
    res.json({ ok: true });
  });

  app.patch('/api/auth/profile', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });

    const db = loadDb();
    const idx = db.users.findIndex((u) => u.id === user.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found.' });

    const allowed = [
      'name',
      'handle',
      'accountType',
      'bio',
      'language',
      'theme',
      'planId',
      'notifications',
      'onboardingCompleted',
    ] as const;

    const updated = { ...db.users[idx] };
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        (updated as Record<string, unknown>)[key] = req.body[key];
      }
    }
    db.users[idx] = updated;
    saveDb(db);
    res.json({ user: sanitizeUser(updated) });
  });

  // Workspaces & Team Collaboration
  app.post('/api/workspaces', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });
    const { name, industry, isClientWorkspace, clientBrandName } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Workspace name is required.' });
    }
    const db = loadDb();
    const newWs: Workspace = {
      id: `ws_${crypto.randomBytes(5).toString('hex')}`,
      name: String(name).trim(),
      industry: String(industry || 'Digital Brand').trim(),
      isClientWorkspace: Boolean(isClientWorkspace),
      clientBrandName: clientBrandName ? String(clientBrandName).trim() : undefined,
      members: [
        {
          id: `mem_${crypto.randomBytes(4).toString('hex')}`,
          name: user.name,
          email: user.email,
          role: 'Owner',
          avatarUrl: user.avatarUrl,
          status: 'active',
        },
      ],
    };
    db.workspaces.push(newWs);
    saveDb(db);
    res.status(201).json({ workspace: newWs });
  });

  app.post('/api/workspaces/:id/members', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });
    const { name, email, role } = req.body || {};
    if (!name || !email) {
      return res.status(400).json({ error: 'Member name and email are required.' });
    }
    const db = loadDb();
    const ws = db.workspaces.find((w) => w.id === req.params.id);
    if (!ws) return res.status(404).json({ error: 'Workspace not found.' });

    ws.members.push({
      id: `mem_${crypto.randomBytes(4).toString('hex')}`,
      name: String(name).trim(),
      email: String(email).trim(),
      role: role || 'Editor',
      status: 'invited',
    });
    saveDb(db);
    res.status(201).json({ workspace: ws });
  });

  // OAuth Account Connection (never accepts raw passwords!)
  app.post('/api/accounts/oauth-connect', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });
    const { workspaceId, platform, accountName, handle } = req.body || {};
    if (!workspaceId || !platform || !accountName) {
      return res.status(400).json({ error: 'Workspace, platform, and account label are required.' });
    }

    const db = loadDb();
    const existing = db.accounts.find(
      (a) => a.workspaceId === workspaceId && a.platform === platform
    );

    const scopesByPlatform: Record<PlatformId, string[]> = {
      instagram: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights'],
      facebook: ['pages_manage_posts', 'pages_read_engagement', 'publish_video'],
      youtube: ['youtube.upload', 'youtube.readonly'],
      whatsapp: ['whatsapp_business_messaging', 'whatsapp_business_management'],
    };

    const capsByPlatform: Record<
      PlatformId,
      { officialSupported: string[]; manualOrUnsupported: string[] }
    > = {
      instagram: {
        officialSupported: ['Reels', 'Feed Posts', 'Business Stories', 'Insights'],
        manualOrUnsupported: ['Interactive Story Stickers', 'Personal Accounts'],
      },
      facebook: {
        officialSupported: ['Page Posts', 'Page Reels', 'Page Stories'],
        manualOrUnsupported: ['Personal Timeline', 'Third-Party Groups'],
      },
      youtube: {
        officialSupported: ['YouTube Shorts', '16:9 Videos', 'Scheduled publishAt'],
        manualOrUnsupported: ['Licensed Shorts Music Overlay'],
      },
      whatsapp: {
        officialSupported: ['Business Cloud API Template Messages'],
        manualOrUnsupported: ['WhatsApp Status (Manual Mobile Handoff Only)'],
      },
    };

    if (existing) {
      existing.connected = true;
      existing.connectionMode = 'demo_oauth';
      existing.accountName = String(accountName).trim();
      existing.handle = String(handle || accountName).trim();
      existing.lastSyncedAt = new Date().toISOString();
      saveDb(db);
      return res.json({ account: existing });
    }

    const pId = platform as PlatformId;
    const newAccount: SocialAccount = {
      id: `acc_${crypto.randomBytes(5).toString('hex')}`,
      workspaceId,
      platform: pId,
      accountName: String(accountName).trim(),
      handle: String(handle || `@${String(accountName).toLowerCase().replace(/\s+/g, '')}`).trim(),
      followers: Math.floor(1800 + Math.random() * 14000),
      connected: true,
      connectionMode: 'demo_oauth',
      oauthScopes: scopesByPlatform[pId] || [],
      lastSyncedAt: new Date().toISOString(),
      apiCapabilities: capsByPlatform[pId],
    };

    db.accounts.push(newAccount);
    saveDb(db);
    res.status(201).json({ account: newAccount });
  });

  app.post('/api/accounts/:id/disconnect', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });
    const db = loadDb();
    const acc = db.accounts.find((a) => a.id === req.params.id);
    if (!acc) return res.status(404).json({ error: 'Account not found.' });
    acc.connected = false;
    acc.connectionMode = 'disconnected';
    saveDb(db);
    res.json({ account: acc });
  });

  // Posts CRUD & Scheduling
  app.post('/api/posts', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });

    const body = req.body || {};
    if (!body.workspaceId || !body.title || !Array.isArray(body.platforms) || body.platforms.length === 0) {
      return res.status(400).json({ error: 'Title and at least one target platform are required.' });
    }

    const db = loadDb();
    const isWhatsAppStatus =
      body.platforms.includes('whatsapp') && body.contentTypes?.whatsapp === 'wa_status_prep';

    const newPost: ScheduledPost = {
      id: `post_${crypto.randomBytes(5).toString('hex')}`,
      workspaceId: body.workspaceId,
      title: String(body.title).trim(),
      platforms: body.platforms,
      contentTypes: body.contentTypes || {},
      captions: body.captions || {},
      hashtags: Array.isArray(body.hashtags) ? body.hashtags : [],
      mediaUrl: body.mediaUrl || undefined,
      mediaType: body.mediaType || 'none',
      aspectRatio: body.aspectRatio || '9:16',
      scheduledDate: body.scheduledDate || new Date().toISOString().slice(0, 10),
      scheduledTime: body.scheduledTime || '18:00',
      status: body.status || 'scheduled',
      publishMode: isWhatsAppStatus ? 'manual_handoff' : 'demo_simulation',
      statusNote: isWhatsAppStatus
        ? 'Prepared for manual WhatsApp Status handoff (no official Status API)'
        : body.status === 'draft'
          ? 'Saved as draft'
          : body.status === 'pending_approval'
            ? 'Submitted for workspace approval'
            : 'Queued in Demonstration Mode (connect live OAuth credentials for live dispatch)',
      createdBy: user.name,
      updatedAt: new Date().toISOString(),
    };

    db.posts.unshift(newPost);
    saveDb(db);
    res.status(201).json({ post: newPost });
  });

  app.patch('/api/posts/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });
    const db = loadDb();
    const idx = db.posts.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Post not found.' });

    db.posts[idx] = {
      ...db.posts[idx],
      ...req.body,
      id: db.posts[idx].id,
      updatedAt: new Date().toISOString(),
    };
    saveDb(db);
    res.json({ post: db.posts[idx] });
  });

  app.post('/api/posts/:id/publish-now', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });
    const db = loadDb();
    const idx = db.posts.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Post not found.' });

    const post = db.posts[idx];
    const hasManualOnly =
      post.platforms.length === 1 &&
      post.platforms[0] === 'whatsapp' &&
      post.contentTypes?.whatsapp === 'wa_status_prep';

    if (hasManualOnly) {
      return res.status(400).json({
        error:
          'WhatsApp Status does not support automated API publishing. Use "Copy Status Kit" to share manually from your phone.',
      });
    }

    db.posts[idx] = {
      ...post,
      status: 'published',
      publishMode: 'demo_simulation',
      statusNote: 'Dispatched in Demonstration Mode (connect live Meta/YouTube OAuth keys for live API posting)',
      metrics: post.metrics || { views: 420, likes: 38, comments: 4, shares: 9 },
      updatedAt: new Date().toISOString(),
    };

    db.notifications.unshift({
      id: `notif_${crypto.randomBytes(4).toString('hex')}`,
      title: 'Demo publish complete',
      message: `"${post.title}" was marked Published in Demonstration Mode.`,
      timeLabel: 'Just now',
      read: false,
      category: 'publish',
    });

    saveDb(db);
    res.json({ post: db.posts[idx] });
  });

  app.post('/api/posts/:id/approve', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });
    const db = loadDb();
    const idx = db.posts.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Post not found.' });

    const action = req.body?.action === 'reject' ? 'draft' : 'scheduled';
    db.posts[idx] = {
      ...db.posts[idx],
      status: action,
      approvedBy: action === 'scheduled' ? user.name : undefined,
      statusNote:
        action === 'scheduled'
          ? `Approved by ${user.name} · Scheduled for dispatch`
          : `Returned to draft by ${user.name}`,
      updatedAt: new Date().toISOString(),
    };
    saveDb(db);
    res.json({ post: db.posts[idx] });
  });

  app.delete('/api/posts/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });
    const db = loadDb();
    const before = db.posts.length;
    db.posts = db.posts.filter((p) => p.id !== req.params.id);
    if (db.posts.length === before) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    saveDb(db);
    res.json({ ok: true });
  });

  app.post('/api/notifications/mark-read', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });
    const db = loadDb();
    db.notifications = db.notifications.map((n) => ({ ...n, read: true }));
    saveDb(db);
    res.json({ notifications: db.notifications });
  });

  // Media upload endpoint (saves base64 data URI cleanly to disk)
  app.post('/api/upload', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });

    const { filename, dataUrl } = req.body || {};
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      return res.status(400).json({ error: 'Invalid media payload.' });
    }

    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: 'Malformed base64 media URI.' });
    }

    const mimeType = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.byteLength > 10 * 1024 * 1024) {
      return res.status(413).json({ error: 'File exceeds 10 MB upload limit.' });
    }

    const ext = mimeType.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'bin';
    const safeBase = String(filename || 'media')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-z0-9_-]/gi, '_')
      .slice(0, 32);
    const storedName = `${safeBase}_${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, storedName), buffer);

    res.status(201).json({
      url: `/uploads/${storedName}`,
      mimeType,
      mediaType: mimeType.startsWith('video/') ? 'video' : 'image',
    });
  });

  // Gemini AI Endpoints
  app.post('/api/ai/text-to-reel', async (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });
    const { topic, tone, durationSec, format, platform } = req.body || {};
    if (!topic || !String(topic).trim()) {
      return res.status(400).json({ error: 'Please enter a reel topic or prompt.' });
    }
    try {
      const result = await generateTextToReel({
        topic: String(topic).trim(),
        tone: String(tone || 'Energetic & Helpful'),
        durationSec: Number(durationSec || 30),
        format: String(format || '9:16'),
        platform: String(platform || 'Instagram Reels'),
      });
      res.json({ result });
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      res.status(e.status || 500).json({ error: e.message || 'AI generation failed.' });
    }
  });

  app.post('/api/ai/image-to-video', async (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });
    const { imageDataUrl, imagePath, productName, goal, format, motionStyle } = req.body || {};
    if (!productName) {
      return res.status(400).json({ error: 'Product or subject name is required.' });
    }

    try {
      let base64 = '';
      let mimeType = 'image/jpeg';

      if (imageDataUrl && typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:')) {
        const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64 = match[2];
        }
      } else if (imagePath && typeof imagePath === 'string') {
        const cleanRel = imagePath.replace(/^\/+/, '');
        const resolved = path.resolve(process.cwd(), cleanRel);
        if (resolved.startsWith(process.cwd()) && fs.existsSync(resolved)) {
          base64 = fs.readFileSync(resolved).toString('base64');
          mimeType = resolved.endsWith('.png') ? 'image/png' : 'image/jpeg';
        }
      }

      if (!base64) {
        return res.status(400).json({ error: 'Please select or upload a product image first.' });
      }

      const result = await generateImageToVideoConcept({
        imageBase64: base64,
        mimeType,
        productName: String(productName).trim(),
        goal: String(goal || 'Product Launch & Awareness'),
        format: String(format || '9:16'),
        motionStyle: String(motionStyle || 'Ken Burns Zoom & Kinetic Type'),
      });
      res.json({ result });
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      res.status(e.status || 500).json({ error: e.message || 'Image-to-video concepting failed.' });
    }
  });

  app.post('/api/ai/marketing-assistant', async (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });
    const { mode, topic, brandVoice, platform } = req.body || {};
    if (!topic || !String(topic).trim()) {
      return res.status(400).json({ error: 'Please enter a topic, product, or campaign brief.' });
    }
    try {
      const result = await generateMarketingAssistance({
        mode: mode || 'captions',
        topic: String(topic).trim(),
        brandVoice: String(brandVoice || 'Warm, modern, and direct'),
        platform: String(platform || 'Instagram'),
      });
      res.json({ result });
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      res.status(e.status || 500).json({ error: e.message || 'Marketing assistant failed.' });
    }
  });

  // Vite or static serving
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PostEase server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start PostEase server:', err);
  process.exit(1);
});
