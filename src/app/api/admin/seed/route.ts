import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      // Se já existe, atualiza para admin
      const updated = await db.user.update({
        where: { email },
        data: { role: 'ADMIN' },
      });
      return NextResponse.json({
        success: true,
        message: 'Usuário atualizado para ADMIN',
        user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: {
        name: name || 'Administrador',
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'ADMIN',
        plan: 'SENSEI',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin criado com sucesso',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
