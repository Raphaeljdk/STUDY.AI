import { NextResponse } from 'next/server';

// Rota temporária para diagnosticar problemas de IA em produção
export async function GET() {
  const isVercel = !!process.env.VERCEL;
  const hasGroqKey = !!process.env.GROQ_API_KEY;
  const groqKeyPrefix = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 8) + '...' : 'NOT SET';

  // 1. List available models
  let models: any = 'not_tested';
  if (hasGroqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json();
      models = {
        status: res.status,
        count: data.data?.length || 0,
        names: (data.data || []).map((m: any) => m.id).sort(),
      };
    } catch (err: any) {
      models = { error: err.message };
    }
  }

  // 2. Test with llama-3.1-70b-versatile
  let test70b: any = 'not_tested';
  if (hasGroqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({ model: 'llama-3.1-70b-versatile', messages: [{ role: 'user', content: 'Diga: ok' }], max_tokens: 5 }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      test70b = { status: res.status, ok: res.ok, reply: data.choices?.[0]?.message?.content, error: data.error?.message };
    } catch (err: any) { test70b = { error: err.message }; }
  }

  // 3. Test with llama-3.1-8b-instant
  let test8b: any = 'not_tested';
  if (hasGroqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: 'Diga: ok' }], max_tokens: 5 }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      test8b = { status: res.status, ok: res.ok, reply: data.choices?.[0]?.message?.content, error: data.error?.message };
    } catch (err: any) { test8b = { error: err.message }; }
  }

  return NextResponse.json({ environment: { isVercel, nodeEnv: process.env.NODE_ENV }, env_vars: { GROQ_API_KEY: groqKeyPrefix, NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET' }, models, test_llama3_1_70b: test70b, test_llama3_1_8b: test8b });
}
