import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, genId, nowISO } from '@/lib/db';

/**
 * POST /api/admin/bootstrap
 * 
 * Creates the FIRST admin user. This endpoint is only accessible when
 * NO admin users exist in the database (bootstrap / first-run scenario).
 * 
 * Body: { email, password, name? }
 */
export async function POST(request: Request) {
  try {
    // Check if any admin already exists
    const admins = await db.user.findMany({
      where: { role: 'ADMIN' },
      select: ['id'],
    });

    if (admins.length > 0) {
      return NextResponse.json(
        { error: 'Bootstrap desativado: ja existe um admin cadastrado' },
        { status: 403 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { email, password, name } = body;

    if (typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Email e senha obrigatorios' }, { status: 400 });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const finalName = typeof name === 'string' && name.trim() ? name.trim() : 'Administrador';

    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      // Promote existing user to admin
      const updated = await db.user.update({
        where: { email: normalizedEmail },
        data: { role: 'ADMIN', plan: 'SENSEI', updatedAt: nowISO() },
      });
      return NextResponse.json({
        success: true,
        message: 'Usuario existente promovido a ADMIN',
        user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role, plan: updated.plan },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: {
        id: genId(),
        name: finalName,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'ADMIN',
        plan: 'SENSEI',
        xp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        totalStudyMinutes: 0,
        totalSessions: 0,
        totalTasksCompleted: 0,
        totalFlashcardsReviewed: 0,
        totalQuestionsAnswered: 0,
        reputation: 0,
        reputationLevel: 'Aprendiz',
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin criado com sucesso via bootstrap',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan },
    });
  } catch (error: any) {
    console.error('[Admin Bootstrap] Error:', error?.message || error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
