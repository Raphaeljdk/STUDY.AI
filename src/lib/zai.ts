// @ts-nocheck — ZAI SDK constructor is private in types but works at runtime
// We bypass TypeScript to pass config directly, avoiding .z-ai-config file dependency

import ZAI from 'z-ai-web-dev-sdk';
import type { ZAIConfig } from 'z-ai-web-dev-sdk';

const ZAI_CONFIG: ZAIConfig = {
  baseUrl: 'https://internal-api.z.ai/v1',
  apiKey: 'Z.ai',
  chatId: 'chat-f6c57963-c06e-48ac-8ed6-6d9b5412a056',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMWM2MzI4MTMtMmYzZi00MmMxLTg2YzUtMGQ4ZmQyYWYzMjUyIiwiY2hhdF9pZCI6ImNoYXQtZjZjNTc5NjMtYzA2ZS00OGFjLThlZDYtNmQ5YjU0MTJhMDU2IiwicGxhdGZvcm0iOiJ6YWkifQ.omWZ85oH_mUYWoptr5ZBzXVx1MZOqMtTrkyabVQnJ9Q',
  userId: '1c632813-2f3f-42c1-86c5-0d8fd2af3252',
};

let zaiInstance: any = null;

function getZAI(): any {
  if (!zaiInstance) {
    // Bypass TypeScript's private constructor check — works at runtime
    zaiInstance = new (ZAI as any)(ZAI_CONFIG);
  }
  return zaiInstance;
}

/**
 * Smart AI call — tries proxy first if AI_PROXY_URL is set, otherwise direct SDK
 */
export async function aiChat(messages: { role: string; content: string }[]): Promise<string> {
  const proxyUrl = process.env.AI_PROXY_URL;

  if (proxyUrl) {
    const url = proxyUrl.replace(/\/$/, '') + '/chat';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, thinking: { type: 'disabled' } }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Proxy error ${res.status}: ${errText}`);
    }
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Proxy returned failure');
    return data.reply || '';
  }

  // Direct ZAI SDK (bypasses file-based config)
  const zai = getZAI();
  const completion = await zai.chat.completions.create({
    messages,
    thinking: { type: 'disabled' },
  });
  return completion.choices?.[0]?.message?.content || '';
}

/**
 * Get raw ZAI instance for direct usage (images, audio, etc.)
 */
export function getRawZAI(): any {
  return getZAI();
}
