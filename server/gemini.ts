import { GoogleGenAI, Type } from '@google/genai';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const err = new Error(
      'GEMINI_API_KEY is not configured. Add your Gemini API key in Settings > Secrets to run live AI Studio generation.'
    ) as Error & { status?: number };
    err.status = 503;
    throw err;
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function isGeminiConfigured(): boolean {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  return Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
}

export async function generateTextToReel(params: {
  topic: string;
  tone: string;
  durationSec: number;
  format: string;
  platform: string;
}) {
  const ai = getAiClient();
  const prompt = `Create a high-retention short-form social video blueprint for PostEase AI Reel Studio.
Topic: ${params.topic}
Tone: ${params.tone}
Target Duration: ${params.durationSec} seconds
Aspect Ratio: ${params.format}
Primary Platform: ${params.platform}

Generate a punchy opening hook, full spoken voiceover script, 4 to 5 concise storyboard scenes whose durations sum close to ${params.durationSec} seconds, visual b-roll suggestions, tailored captions for Instagram, YouTube Shorts, and Facebook, and 8 targeted hashtags.`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction:
        'You are an expert short-form social video director and social media strategist. Return practical, production-ready storyboards and captions without filler.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          hook: { type: Type.STRING },
          script: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNumber: { type: Type.INTEGER },
                durationSec: { type: Type.INTEGER },
                visualDirection: { type: Type.STRING },
                cameraAngle: { type: Type.STRING },
                voiceoverLine: { type: Type.STRING },
                onScreenText: { type: Type.STRING },
                bRollSuggestion: { type: Type.STRING },
              },
            },
          },
          captions: {
            type: Type.OBJECT,
            properties: {
              instagram: { type: Type.STRING },
              youtube: { type: Type.STRING },
              facebook: { type: Type.STRING },
            },
          },
          hashtags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          musicMood: { type: Type.STRING },
        },
      },
    },
  });

  return JSON.parse(response.text || '{}');
}

export async function generateImageToVideoConcept(params: {
  imageBase64: string;
  mimeType: string;
  productName: string;
  goal: string;
  format: string;
  motionStyle: string;
}) {
  const ai = getAiClient();

  const imagePart = {
    inlineData: {
      mimeType: params.mimeType || 'image/jpeg',
      data: params.imageBase64,
    },
  };

  const textPart = {
    text: `Analyze this product/brand image and design a promotional video concept for PostEase AI Studio.
Product / Subject: ${params.productName}
Campaign Goal: ${params.goal}
Aspect Ratio: ${params.format}
Preferred Motion Style: ${params.motionStyle}

Describe 4 dynamic motion scenes using camera transitions (zoom, pan, parallax, speed-ramp), synchronized kinetic headline overlays, voiceover lines, lighting/color notes, and a ready-to-publish social caption.`,
  };

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: { parts: [imagePart, textPart] },
    config: {
      systemInstruction:
        'You are a commercial motion designer. Inspect the image closely and craft concrete visual motion cues and ad copy.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          conceptTitle: { type: Type.STRING },
          visualAnalysis: { type: Type.STRING },
          recommendedAudioMood: { type: Type.STRING },
          promotionalCaption: { type: Type.STRING },
          hashtags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          motionScenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNumber: { type: Type.INTEGER },
                durationSec: { type: Type.INTEGER },
                transitionType: { type: Type.STRING },
                headlineOverlay: { type: Type.STRING },
                voiceoverLine: { type: Type.STRING },
                motionInstruction: { type: Type.STRING },
              },
            },
          },
        },
      },
    },
  });

  return JSON.parse(response.text || '{}');
}

export async function generateMarketingAssistance(params: {
  mode: 'captions' | 'hashtags' | 'ideas' | 'ad_copy' | 'calendar';
  topic: string;
  brandVoice: string;
  platform: string;
}) {
  const ai = getAiClient();

  const promptByMode: Record<string, string> = {
    captions: `Write 4 distinct high-converting ${params.platform} captions for: "${params.topic}". Brand voice: ${params.brandVoice}. Include hook, body, and call-to-action.`,
    hashtags: `Generate a structured hashtag strategy for "${params.topic}" on ${params.platform}. Group into Broad Discovery, Niche Community, and Branded/Intent tags.`,
    ideas: `Suggest 5 trending, original short-form reel/video content ideas for "${params.topic}" on ${params.platform}. Brand voice: ${params.brandVoice}. Explain why each hook works.`,
    ad_copy: `Create 3 high-converting product advertisement copy variations (Problem-Agitate-Solve, Social Proof, Direct Offer) for "${params.topic}" on ${params.platform}. Voice: ${params.brandVoice}.`,
    calendar: `Build a practical 7-day social media content calendar for "${params.topic}" across Instagram, Facebook, YouTube, and WhatsApp. Voice: ${params.brandVoice}.`,
  };

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: promptByMode[params.mode] || promptByMode.captions,
    config: {
      systemInstruction:
        'You are PostEase AI Marketing Strategist. Provide crisp, ready-to-publish items tailored to modern creators and SMEs.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                platform: { type: Type.STRING },
                format: { type: Type.STRING },
                content: { type: Type.STRING },
                hashtags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                bestTime: { type: Type.STRING },
              },
            },
          },
        },
      },
    },
  });

  return JSON.parse(response.text || '{}');
}
