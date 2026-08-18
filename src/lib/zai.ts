// @ts-nocheck — ZAI SDK constructor is private in types but works at runtime

// ═══════════════════════════════════════════
// ZAI SDK (sandbox only — internal-api.z.ai)
// Dynamic import to avoid crashing when package is unavailable
// Uses ZAI.create() factory method (reads .z-ai-config)
// ═══════════════════════════════════════════

let zaiInstance: any = null;
let zaiLoadFailed = false;

async function getZAI(): Promise<any> {
  if (zaiLoadFailed) return null;
  if (zaiInstance) return zaiInstance;
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    zaiInstance = await (ZAI as any).create();
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
const GROQ_MODEL_FAST = 'llama-3.1-8b-instant';

function getGroqApiKey(): string | null {
  return process.env.GROQ_API_KEY || null;
}

interface GroqOptions {
  jsonMode?: boolean;
  maxTokens?: number;
  temperature?: number;
  fast?: boolean;
}

async function groqChat(messages: { role: string; content: string }[], options: GroqOptions = {}): Promise<string> {
  const apiKey = getGroqApiKey();
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const { jsonMode = false, maxTokens = 2048, temperature = 0.7, fast = false } = options;

  const body: any = {
    model: fast ? GROQ_MODEL_FAST : GROQ_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  // Force JSON output — this is the key fix for all AI features
  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ═══════════════════════════════════════════
// Error classification
// ═══════════════════════════════════════════

function isNetworkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('fetch failed') ||
    msg.includes('connect') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('network') ||
    msg.includes('abort')
  );
}

function isRetryableError(err: unknown): boolean {
  if (isNetworkError(err)) return true;
  const msg = err instanceof Error ? err.message : '';
  return (
    msg.includes('429') || // rate limit
    msg.includes('503') || // service unavailable
    msg.includes('502') || // bad gateway
    msg.includes('500')    // internal server error from Groq
  );
}

// ═══════════════════════════════════════════
// Main AI call with automatic fallback + retry
// ═══════════════════════════════════════════

/**
 * Smart AI call with automatic fallback:
 * 1. AI_PROXY_URL -> proxy (sandbox ai-proxy service)
 * 2. ZAI SDK -> direct internal API (sandbox only)
 * 3. Groq -> public fallback (Vercel, Railway, etc.)
 *
 * Supports retry on transient errors.
 */
export async function aiChat(
  messages: { role: string; content: string }[],
  options: { maxTokens?: number; temperature?: number; fast?: boolean } = {}
): Promise<string> {
  const { maxTokens = 2048, temperature = 0.7, fast = false } = options;

  // 1. Try proxy if configured
  const proxyUrl = process.env.AI_PROXY_URL;
  if (proxyUrl) {
    try {
      const url = proxyUrl.replace(/\/$/, '') + '/chat';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, thinking: { type: 'disabled' } }),
        signal: AbortSignal.timeout(45000),
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

  // 3. Groq fallback with retry
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await groqChat(messages, { maxTokens, temperature, fast });
    } catch (err) {
      if (attempt === 0 && isRetryableError(err)) {
        console.warn(`[AI] Groq attempt ${attempt + 1} failed, retrying...`, err instanceof Error ? err.message : err);
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      throw err;
    }
  }

  // Should never reach here
  return groqChat(messages, { maxTokens, temperature, fast });
}

/**
 * AI call that forces valid JSON output using Groq's json_object response format.
 * This eliminates JSON parsing errors from AI responses.
 *
 * IMPORTANT: The system prompt MUST mention "JSON" for json_object mode to work.
 */
export async function aiChatJSON(
  messages: { role: string; content: string }[],
  options: { maxTokens?: number; temperature?: number; fast?: boolean } = {}
): Promise<string> {
  const { maxTokens = 2048, temperature = 0.5, fast = false } = options;

  // 1. Try proxy if configured (proxy doesn't support json mode, fall through to Groq)
  // Skip proxy for JSON mode — go directly to Groq which supports response_format

  // 2. ZAI SDK doesn't support json_object mode reliably
  // Skip to Groq directly

  // 3. Groq with json_object response format + retry
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await groqChat(messages, { jsonMode: true, maxTokens, temperature, fast });
    } catch (err) {
      if (attempt === 0 && isRetryableError(err)) {
        console.warn(`[AI-JSON] Groq attempt ${attempt + 1} failed, retrying...`, err instanceof Error ? err.message : err);
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      throw err;
    }
  }

  return groqChat(messages, { jsonMode: true, maxTokens, temperature, fast });
}

/**
 * Safe JSON parse helper — strips markdown fences and extracts JSON.
 * Used as fallback when aiChatJSON is not available.
 */
export function safeParseJSON(raw: string): any {
  // Try direct parse first
  try {
    return JSON.parse(raw);
  } catch {}

  // Strip markdown fences
  let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  // Try to find JSON object in the response
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/**
 * Get raw ZAI instance for direct usage (images, audio, etc.)
 */
export async function getRawZAI(): Promise<any> {
  return getZAI();
}
