import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.GROQ_API_KEY;
  if (!key) return NextResponse.json({ error: 'GROQ_API_KEY not set' });

  const models = ['groq/compound', 'groq/compound-mini', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b'];
  const results: any = {};

  for (const model of models) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Responda apenas: ok' }], max_tokens: 5 }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      results[model] = { status: res.status, reply: data.choices?.[0]?.message?.content, error: data.error?.message };
    } catch (err: any) { results[model] = { error: err.message }; }
  }

  return NextResponse.json({ results });
}
