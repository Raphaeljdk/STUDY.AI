import { NextResponse } from 'next/server';
import { aiChat } from '@/lib/zai';

export async function GET() {
  try {
    const reply = await aiChat([
      { role: 'user', content: 'Diga apenas: Sensei AI funcionou!' },
    ]);
    return NextResponse.json({ success: true, reply, provider: 'groq-fallback' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
