import { NextResponse } from 'next/server';
import { aiChat } from '@/lib/zai';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Debug auth
    const email = 'groqtest@test.com';
    const user = await db.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'User not found', email });

    const match = await bcrypt.compare('groq123456', user.password);
    return NextResponse.json({
      found: true,
      id: user.id,
      name: user.name,
      passwordMatch: match,
      plan: user.plan,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST() {
  try {
    const reply = await aiChat([
      { role: 'user', content: 'Diga apenas: Sensei AI funcionou!' },
    ]);
    return NextResponse.json({ success: true, reply });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
