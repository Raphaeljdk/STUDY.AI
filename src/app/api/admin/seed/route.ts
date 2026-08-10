import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { db, genId, nowISO } from '@/lib/db';

export async function POST(request: Request) {
  try {
    // Auth + admin role check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    if ((session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    const adminId = (session.user as any)?.id;
    if (!adminId) {
      return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 });
    }
    // Verify admin user exists
    const adminExists = await db.user.findUnique({ where: { id: adminId }, select: ['id', 'role'] });
    if (!adminExists || adminExists.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // JSON parse safety
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { email, password, name } = body;

    // Type validation
    if (typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 });
    }
    if (typeof password !== 'string' || !password) {
      return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 });
    }

    // Email normalization BEFORE check
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      // Se já existe, atualiza para admin
      const updated = await db.user.update({
        where: { email: normalizedEmail },
        data: { role: 'ADMIN', updatedAt: nowISO() },
      });
      return NextResponse.json({
        success: true,
        message: 'Usuário atualizado para ADMIN',
        user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role },
      });
    }

    const finalName = typeof name === 'string' && name.trim() ? name.trim() : 'Administrador';
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: {
        id: genId(),
        name: finalName,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'ADMIN',
        plan: 'SENSEI',
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin criado com sucesso',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan },
    });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
