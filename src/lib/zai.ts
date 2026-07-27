import ZAI from 'z-ai-web-dev-sdk';

const ZAI_CONFIG = {
  baseUrl: 'https://internal-api.z.ai/v1',
  apiKey: 'Z.ai',
  chatId: 'chat-f6c57963-c06e-48ac-8ed6-6d9b5412a056',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMWM2MzI4MTMtMmYzZi00MmMxLTg2YzUtMGQ4ZmQyYWYzMjUyIiwiY2hhdF9pZCI6ImNoYXQtZjZjNTc5NjMtYzA2ZS00OGFjLThlZDYtNmQ5YjU0MTJhMDU2IiwicGxhdGZvcm0iOiJ6YWkifQ.omWZ85oH_mUYWoptr5ZBzXVx1MZOqMtTrkyabVQnJ9Q',
  userId: '1c632813-2f3f-42c1-86c5-0d8fd2af3252',
};

let zaiInstance: InstanceType<typeof ZAI> | null = null;

/**
 * ZAI AI Client - supports two modes:
 * 1. Direct mode: Uses ZAI SDK directly (works on z.ai platform)
 * 2. Proxy mode: Uses AI proxy via AI_PROXY_URL env var (works from Vercel/external)
 */
export async function getZAI(): Promise<InstanceType<typeof ZAI>> {
  if (!zaiInstance) {
    zaiInstance = new ZAI(ZAI_CONFIG);
  }
  return zaiInstance;
}

/**
 * AI proxy mode for Vercel - calls the z.ai proxy service
 */
export async function chatViaProxy(messages: { role: string; content: string }[]): Promise<string> {
  const proxyUrl = process.env.AI_PROXY_URL;
  if (!proxyUrl) {
    throw new Error('AI_PROXY_URL nao configurada no Vercel');
  }

  const url = proxyUrl.endsWith('/') ? `${proxyUrl}chat` : `${proxyUrl}/chat`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, thinking: { type: 'disabled' } }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI proxy error: ${res.status} ${err}`);
  }

  const data = await res.json();
  if (!data.success || !data.reply) {
    throw new Error(data.error || 'AI proxy retornou resposta vazia');
  }

  return data.reply;
}

/**
 * Smart AI call - tries direct first, falls back to proxy
 */
export async function aiChat(messages: { role: string; content: string }[]): Promise<string> {
  // If AI_PROXY_URL is set (Vercel), use proxy
  if (process.env.AI_PROXY_URL) {
    return chatViaProxy(messages);
  }

  // Otherwise use direct ZAI SDK (z.ai platform)
  const zai = await getZAI();
  const completion = await zai.chat.completions.create({
    messages,
    thinking: { type: 'disabled' },
  });
  return completion.choices?.[0]?.message?.content || '';
}
