// @ts-nocheck — ZAI SDK constructor is private in types but works at runtime

import type { ZAIConfig } from 'z-ai-web-dev-sdk';

// ═══════════════════════════════════════════
// ZAI SDK (sandbox only — internal-api.z.ai)
// Dynamic import to avoid crashing when package is unavailable
// ═══════════════════════════════════════════

const ZAI_CONFIG: ZAIConfig = {
  baseUrl: 'https://internal-api.z.ai/v1',
  apiKey: 'Z.ai',
  chatId: 'chat-f6c57963-c06e-48ac-8ed6-6d9b5412a056',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMWM2MzI4MTMtMmYzZi00MmMxLTg2YzUtMGQ4ZmQyYWYzMjUyIiwiY2hhdF9pZCI6ImNoYXQtZjZjNTc5NjMtYzA2ZS00OGFjLThlZDYtNmQ5YjU0MTJhMDU2IiwicGxhdGZvcm0iOiJ6YWkifQ.omWZ85oH_mUYWoptr5ZBzXVx1MZOqMtTrkyabVQnJ9Q',
  userId: '1c632813-2f3f-42c1-86c5-0d8fd2af3252',
};

let zaiInstance: any = null;
let zaiLoadFailed = false;

async function getZAI(): Promise<any> {
  if (zaiLoadFailed) return null;
  if (zaiInstance) return zaiInstance;
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    zaiInstance = new (ZAI as any)(ZAI_CONFIG);
    return zaiInstance;
  } catch (err) {
    console.warn('[AI] z-ai-web-dev-sdk not available, skipping:', err instanceof Error ? err.message : err);
    zaiLoadFailed = true;
    return null;
  }
}

// ═══════════════════════════════════════════
// Groq fallback (public API — works on Vercel/Railway)
// ═══════════════════════════════════════════

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function getGroqApiKey(): string | null {
  return process.env.GROQ_API_KEY || null;
}

async function groqChat(messages: { role: string; content: string }[]): Promise<string> {
  const apiKey = getGroqApiKey();
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ═══════════════════════════════════════════
// Main AI call with automatic fallback
// ═══════════════════════════════════════════

function isNetworkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('fetch failed') ||
    msg.includes('connect') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('network')
  );
}

/**
 * Smart AI call with automatic fallback:
 * 1. AI_PROXY_URL -> proxy (sandbox ai-proxy service)
 * 2. ZAI SDK -> direct internal API (sandbox only)
 * 3. Groq -> public fallback (Vercel, Railway, etc.)
 */
export async function aiChat(messages: { role: string; content: string }[]): Promise<string> {
  // 1. Try proxy if configured
  const proxyUrl = process.env.AI_PROXY_URL;
  if (proxyUrl) {
    try {
      const url = proxyUrl.replace(/\/$/, '') + '/chat';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, thinking: { type: 'disabled' } }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Proxy error ${res.status}: ${errText}`);
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Proxy returned failure');
      return data.reply || '';
    } catch (err) {
      if (!isNetworkError(err)) throw err;
      console.warn('[AI] Proxy failed, falling back...');
    }
  }

  // 2. Try ZAI SDK (works inside Z.ai sandbox)
  try {
    const zai = await getZAI();
    if (zai) {
      const completion = await zai.chat.completions.create({
        messages,
        thinking: { type: 'disabled' },
      });
      const reply = completion.choices?.[0]?.message?.content;
      if (reply) return reply;
    }
  } catch (err) {
    if (!isNetworkError(err)) throw err;
    console.warn('[AI] ZAI SDK unreachable, using Groq fallback...');
  }

  // 3. Groq fallback (works everywhere)
  return groqChat(messages);
}

/**
 * Get raw ZAI instance for direct usage (images, audio, etc.)
 */
export async function getRawZAI(): Promise<any> {
  return getZAI();
}
