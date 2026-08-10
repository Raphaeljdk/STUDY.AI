import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

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

    // ═══════════════════════════════════════════════════════════════
    // CRITICAL: Use RAW SQL for INSERT to bypass Prisma v6 DateTime bug.
    // Prisma v6 + SQLite converts DateTime to numeric milliseconds
    // (e.g. "1786369187922") instead of ISO 8601 strings, causing P2023.
    // Raw SQL gives us full control over the value format.
    // ═══════════════════════════════════════════════════════════════
    const userId = randomUUID();
    const nowISO = new Date().toISOString();

    await db.$executeRawUnsafe(
      `INSERT INTO "User" ("id", "name", "email", "password", "role", "plan", "xp", "level", "currentStreak", "longestStreak", "totalStudyMinutes", "totalSessions", "totalTasksCompleted", "totalFlashcardsReviewed", "totalQuestionsAnswered", "reputation", "reputationLevel", "createdAt", "updatedAt")
       VALUES (?, ?, ?, ?, 'USER', 'FREE', 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 'Aprendiz', ?, ?)`,
      userId,
      trimmedName,
      normalizedEmail,
      hashedPassword,
      nowISO,
      nowISO
    );

    // Read back the created user using Prisma (read-only, no DateTime issue)
    const user = await db.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json(
        { error: 'Falha ao criar usuário' },
        { status: 500 }
      );
    }

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
