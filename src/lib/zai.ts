// @ts-nocheck — ZAI SDK constructor is private in types but works at runtime

// ═══════════════════════════════════════════════════════════════
// ENVIRONMENT DETECTION
// ═══════════════════════════════════════════════════════════════

// On Vercel/Railway, ZAI SDK is never available — skip it entirely.
// On Z.ai sandbox, ZAI SDK is the primary provider.
const IS_SANDBOX = !(process.env.VERCEL || process.env.RAILWAY || process.env.NODE_ENV === 'production');

// ═══════════════════════════════════════════════════════
// ZAI SDK (primary AI provider in Z.ai sandbox ONLY)
// ═══════════════════════════════════════════════════════

let zaiInstance: any = null;
let zaiLoadFailed = false;
let zaiReady = false;

async function getZAI(): Promise<any> {
  if (!IS_SANDBOX) return null; // Skip on Vercel/production entirely
  if (zaiReady) return zaiInstance;
  if (zaiLoadFailed) return null;
  try {
    const mod = await import('z-ai-web-dev-sdk');
    const ZAI = mod.default || mod.ZAI || mod;
    zaiInstance = await ZAI.create();
    zaiReady = true;
    console.log('[AI] ZAI SDK loaded successfully');
    return zaiInstance;
  } catch (err) {
    console.warn('[AI] ZAI SDK not available:', err instanceof Error ? err.message : err);
    zaiLoadFailed = true;
    return null;
  }
}

// ═══════════════════════════════════════════════════════
// Groq — primary provider for Vercel/Railway/production
// ═══════════════════════════════════════════════════════

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'groq/compound';
const GROQ_MODEL_FAST = 'groq/compound-mini';

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
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not set');
  }

  const { jsonMode = false, maxTokens = 2048, temperature = 0.7, fast = false } = options;

  const body: any = {
    model: fast ? GROQ_MODEL_FAST : GROQ_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

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

// ═══════════════════════════════════════════════════════
// AI Proxy fallback (mini-service on port 3003 — sandbox only)
// ═══════════════════════════════════════════════════════

async function proxyChat(messages: { role: string; content: string }[]): Promise<string> {
  const proxyUrl = process.env.AI_PROXY_URL;
  if (!proxyUrl) throw new Error('AI_PROXY_URL not set');

  const url = proxyUrl.replace(/\/$/, '') + '/chat';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal: AbortSignal.timeout(45000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Proxy error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Proxy returned failure');
  return data.reply || '';
}

// ═══════════════════════════════════════════════════════
// Error classification
// ═══════════════════════════════════════════════════════

function isRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes('timeout') ||
    lower.includes('fetch failed') ||
    lower.includes('econnrefused') ||
    lower.includes('enotfound') ||
    lower.includes('network') ||
    lower.includes('abort') ||
    lower.includes('429') ||
    lower.includes('503') ||
    lower.includes('502') ||
    lower.includes('500')
  );
}

// ═══════════════════════════════════════════════════════
// Main AI call — automatic environment-based routing
// ═══════════════════════════════════════════════════════

/**
 * Smart AI text call with automatic environment-based routing:
 *
 * PRODUCTION (Vercel/Railway):
 *   1. Groq (primary & only)
 *
 * SANDBOX (Z.ai local):
 *   1. ZAI SDK (primary)
 *   2. AI Proxy (if configured)
 *   3. Groq (fallback)
 */
export async function aiChat(
  messages: { role: string; content: string }[],
  options: { maxTokens?: number; temperature?: number; fast?: boolean } = {}
): Promise<string> {
  const { maxTokens = 2048, temperature = 0.7, fast = false } = options;

  // ─── PRODUCTION: Groq only ───
  if (!IS_SANDBOX) {
    const apiKey = getGroqApiKey();
    if (!apiKey) {
      throw new Error(
        'AI_UNAVAILABLE: GROQ_API_KEY não configurada. ' +
        'Defina GROQ_API_KEY nas variáveis de ambiente do Vercel.'
      );
    }
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await groqChat(messages, { maxTokens, temperature, fast });
      } catch (err) {
        if (attempt === 0 && isRetryableError(err)) {
          console.warn(`[AI] Groq attempt ${attempt + 1} failed, retrying...`);
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        throw err;
      }
    }
  }

  // ─── SANDBOX: ZAI SDK → Proxy → Groq ───
  // 1. Try ZAI SDK
  try {
    const zai = await getZAI();
    if (zai) {
      const completion = await zai.chat.completions.create({ messages });
      const reply = completion?.choices?.[0]?.message?.content;
      if (reply) return reply;
    }
  } catch (err) {
    console.warn('[AI] ZAI SDK failed:', err instanceof Error ? err.message : err);
  }

  // 2. Try proxy if configured
  if (process.env.AI_PROXY_URL) {
    try {
      return await proxyChat(messages);
    } catch (err) {
      console.warn('[AI] Proxy failed:', err instanceof Error ? err.message : err);
    }
  }

  // 3. Groq fallback with retry
  if (getGroqApiKey()) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await groqChat(messages, { maxTokens, temperature, fast });
      } catch (err) {
        if (attempt === 0 && isRetryableError(err)) {
          console.warn(`[AI] Groq attempt ${attempt + 1} failed, retrying...`);
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        throw err;
      }
    }
  }

  throw new Error(
    'AI_UNAVAILABLE: Nenhum provedor de IA disponível. ' +
    'No Z.ai sandbox, o ZAI SDK deve funcionar. ' +
    'Em produção (Vercel), defina GROQ_API_KEY nas variáveis de ambiente.'
  );
}

/**
 * AI call for structured JSON output.
 * PRODUCTION: Groq with json_object response format.
 * SANDBOX: ZAI SDK with prompt-based JSON, then Groq fallback.
 */
export async function aiChatJSON(
  messages: { role: string; content: string }[],
  options: { maxTokens?: number; temperature?: number; fast?: boolean } = {}
): Promise<string> {
  const { maxTokens = 2048, temperature = 0.5, fast = false } = options;

  // ─── PRODUCTION: Groq with json_object mode ───
  if (!IS_SANDBOX) {
    const apiKey = getGroqApiKey();
    if (!apiKey) {
      throw new Error(
        'AI_UNAVAILABLE: GROQ_API_KEY não configurada. ' +
        'Defina GROQ_API_KEY nas variáveis de ambiente do Vercel.'
      );
    }
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await groqChat(messages, { jsonMode: true, maxTokens, temperature, fast });
      } catch (err) {
        if (attempt === 0 && isRetryableError(err)) {
          console.warn(`[AI-JSON] Groq attempt ${attempt + 1} failed, retrying...`);
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        throw err;
      }
    }
  }

  // ─── SANDBOX: ZAI SDK → Proxy → Groq (json mode) ───
  // 1. Try ZAI SDK
  try {
    const zai = await getZAI();
    if (zai) {
      const completion = await zai.chat.completions.create({ messages });
      const reply = completion?.choices?.[0]?.message?.content;
      if (reply) return reply;
    }
  } catch (err) {
    console.warn('[AI-JSON] ZAI SDK failed:', err instanceof Error ? err.message : err);
  }

  // 2. Try proxy if configured
  if (process.env.AI_PROXY_URL) {
    try {
      return await proxyChat(messages);
    } catch (err) {
      console.warn('[AI-JSON] Proxy failed:', err instanceof Error ? err.message : err);
    }
  }

  // 3. Groq with json_object + retry
  if (getGroqApiKey()) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await groqChat(messages, { jsonMode: true, maxTokens, temperature, fast });
      } catch (err) {
        if (attempt === 0 && isRetryableError(err)) {
          console.warn(`[AI-JSON] Groq attempt ${attempt + 1} failed, retrying...`);
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        throw err;
      }
    }
  }

  throw new Error(
    'AI_UNAVAILABLE: Nenhum provedor de IA disponível para JSON. ' +
    'No Z.ai sandbox, o ZAI SDK deve funcionar. ' +
    'Em produção (Vercel), defina GROQ_API_KEY nas variáveis de ambiente.'
  );
}

/**
 * Safe JSON parse helper — strips markdown fences and extracts JSON.
 */
export function safeParseJSON(raw: string): any {
  if (!raw || typeof raw !== 'string') return null;

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

  // Also try arrays
  const arrStart = cleaned.indexOf('[');
  const arrEnd = cleaned.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd > arrStart && (arrStart < jsonStart || jsonStart === -1)) {
    const arrStr = cleaned.substring(arrStart, arrEnd + 1);
    try {
      return JSON.parse(arrStr);
    } catch {}
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
