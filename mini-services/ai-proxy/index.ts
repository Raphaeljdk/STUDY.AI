import ZAI from 'z-ai-web-dev-sdk';

const zai = new ZAI({
  baseUrl: 'https://internal-api.z.ai/v1',
  apiKey: 'Z.ai',
  chatId: 'chat-f6c57963-c06e-48ac-8ed6-6d9b5412a056',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMWM2MzI4MTMtMmYzZi00MmMxLTg2YzUtMGQ4ZmQyYWYzMjUyIiwiY2hhdF9pZCI6ImNoYXQtZjZjNTc5NjMtYzA2ZS00OGFjLThlZDYtNmQ5YjU0MTJhMDU2IiwicGxhdGZvcm0iOiJ6YWkifQ.omWZ85oH_mUYWoptr5ZBzXVx1MZOqMtTrkyabVQnJ9Q',
  userId: '1c632813-2f3f-42c1-86c5-0d8fd2af3252',
});

const PORT = 3003;

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
