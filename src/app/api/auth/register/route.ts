import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    // JSON parse safety
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Dados invalidos' },
        { status: 400 }
      );
    }

    const { name, email, password } = body;

    // Type validation
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Name trim check
    if (!name.trim() || !email.trim() || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Email normalization BEFORE findUnique
    const normalizedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim();

    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name: trimmedName,
        email: normalizedEmail,
        password: hashedPassword,
        plan: 'FREE',
      },
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
    });
  } catch (error: any) {
    const msg = error?.message || 'Unknown error';
    const code = error?.code || '';
    console.error('[Register] Full error:', msg, code, error?.meta);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: `${code || 'ERR'}: ${msg}` },
      { status: 500 }
    );
  }
}
