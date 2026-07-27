import { NextResponse } from 'next/server';
import { aiChat } from '@/lib/zai';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) return NextResponse.json({ error: 'No NEXTAUTH_SECRET' }, { status: 500 });

    // Find user
    const user = await db.user.findUnique({ where: { email: 'groqtest@test.com' } });
    if (!user) return NextResponse.json({ error: 'User not found' });

    // Create JWT token (NextAuth compatible)
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 },
      secret,
      { algorithm: 'HS256' }
    );

    const res = NextResponse.json({ success: true, name: user.name });
    // Set NextAuth session cookie
    const domain = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).hostname : undefined;
    res.cookies.set('next-auth.session-token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      domain,
    });
    return res;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST() {
  try {
    const reply = await aiChat([
      { role: 'system', content: 'Voce e o Sensei AI. Responda de forma sabia e inspiradora em portugues. Maximo 2 frases.' },
      { role: 'user', content: 'Ola Sensei!' },
    ]);
    return NextResponse.json({ success: true, reply });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
