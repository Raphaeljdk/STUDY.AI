import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

function isAdmin(session: any): session is { user: { id: string; role: 'ADMIN' } } {
  return session?.user?.role === 'ADMIN';
}

function isPrismaRecordNotFound(error: any): boolean {
  return (
    error?.code === 'P2025' ||
    error?.name === 'PrismaClientKnownRequestError' && error?.code === 'P2025'
  );
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const users = await db.user.findMany({
      select: { id: true, name: true, email: true, role: true, plan: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    const adminId = session.user.id;

    // JSON parse safety
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { userId, plan, role } = body;
    if (typeof userId !== 'string' || !userId.trim()) {
      return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 });
    }

    const validPlans = ['FREE', 'PREMIUM', 'SENSEI', 'ADMIN_PLAN'] as const;
    const validRoles = ['USER', 'ADMIN'] as const;

    const data: any = {};
    if (typeof plan === 'string' && (validPlans as readonly string[]).includes(plan)) data.plan = plan;
    if (typeof role === 'string' && (validRoles as readonly string[]).includes(role)) data.role = role;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 });
    }

    // Self-demotion protection: admin cannot change their own role to non-ADMIN
    if (userId === adminId && data.role !== undefined && data.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Você não pode rebaixar sua própria conta de administrador' },
        { status: 403 }
      );
    }

    // Last admin protection on PATCH: changing role from ADMIN to non-ADMIN
    if (data.role !== undefined && data.role !== 'ADMIN') {
      const targetUser = await db.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (!targetUser) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }
      if (targetUser.role === 'ADMIN') {
        const adminCount = await db.user.count({ where: { role: 'ADMIN' } });
        if (adminCount <= 1) {
          return NextResponse.json(
            { error: 'Não é possível rebaixar o último administrador' },
            { status: 403 }
          );
        }
      }
    }

    try {
      const updated = await db.user.update({
        where: { id: userId },
        data,
        select: { id: true, name: true, email: true, role: true, plan: true },
      });

      return NextResponse.json({ user: updated });
    } catch (updateError: any) {
      if (isPrismaRecordNotFound(updateError)) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }
      throw updateError;
    }
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    const adminId = session.user.id;

    // JSON parse safety
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { userId } = body;
    if (typeof userId !== 'string' || !userId.trim()) {
      return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 });
    }

    // Impede admin de deletar a si mesmo
    if (userId === adminId) {
      return NextResponse.json({ error: 'Você não pode deletar a si mesmo' }, { status: 400 });
    }

    // Last admin protection on DELETE: cannot delete the last admin
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    if (targetUser.role === 'ADMIN') {
      const adminCount = await db.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Não é possível deletar o último administrador' },
          { status: 403 }
        );
      }
    }

    try {
      await db.user.delete({ where: { id: userId } });
      return NextResponse.json({ success: true });
    } catch (deleteError: any) {
      if (isPrismaRecordNotFound(deleteError)) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }
      throw deleteError;
    }
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
