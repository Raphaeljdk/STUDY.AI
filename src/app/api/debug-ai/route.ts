import { NextResponse } from 'next/server';

// Rota temporária para diagnosticar problemas de IA em produção
// REMOVER depois de tudo funcionar!
export async function GET() {
  const isVercel = !!process.env.VERCEL;
  const nodeEnv = process.env.NODE_ENV;
  const hasGroqKey = !!process.env.GROQ_API_KEY;
  const groqKeyPrefix = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 8) + '...' : 'NOT SET';
  const hasPostgres = !!process.env.POSTGRES_URL;
  const hasAuthSecret = !!process.env.NEXTAUTH_SECRET;

  let groqTest: any = 'not_tested';
  if (hasGroqKey) {
    try {
      const start = Date.now();
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'Responda apenas: ok' }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const elapsed = Date.now() - start;
      const data = await res.json();
      groqTest = {
        status: res.status,
        ok: res.ok,
        elapsed_ms: elapsed,
        response: data.choices?.[0]?.message?.content || null,
        error: data.error?.message || null,
      };
    } catch (err: any) {
      groqTest = { error: err.message };
    }
  }

  return NextResponse.json({
    environment: { isVercel, nodeEnv },
    env_vars: {
      GROQ_API_KEY: hasGroqKey ? groqKeyPrefix : 'NOT SET',
      POSTGRES_URL: hasPostgres ? 'SET' : 'NOT SET',
      NEXTAUTH_SECRET: hasAuthSecret ? 'SET' : 'NOT SET',
    },
    groq_test: groqTest,
  });
}
