import ZAI from 'z-ai-web-dev-sdk';

const PORT = 3003;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let zai: any;

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    // CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const url = new URL(req.url);

    // Health check
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', port: PORT });
    }

    // Chat completions proxy
    if (url.pathname === '/chat' && req.method === 'POST') {
      try {
        const body = await req.json();
        const { messages, thinking } = body;

        if (!messages || !Array.isArray(messages)) {
          return Response.json({ error: 'messages array is required' }, { status: 400 });
        }

        // Lazy init ZAI using factory method (constructor is private)
        if (!zai) {
          zai = await ZAI.create();
        }

        const completion = await zai.chat.completions.create({
          messages,
          thinking: thinking || { type: 'disabled' },
        });

        return Response.json({
          reply: completion.choices?.[0]?.message?.content || '',
          success: true,
        });
      } catch (err: any) {
        console.error('AI Proxy error:', err.message);
        return Response.json({ error: err.message, success: false }, { status: 500 });
      }
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  },
});

console.log(`AI Proxy running on port ${PORT}`);
