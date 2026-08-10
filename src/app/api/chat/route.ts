import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, genId, nowISO } from '@/lib/db';

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Nao autorizado' }, { status: 401 }) };
  }
  const userId = (session.user as any)?.id;
  if (!userId) {
    return { error: NextResponse.json({ error: 'Sessao invalida' }, { status: 401 }) };
  }
  const userExists = db.user.findUnique({ where: { id: userId }, select: ['id'] });
  if (!userExists) {
    return { error: NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 }) };
  }
  return { userId };
}

export async function GET() {
  try {
    const auth = await requireUser();
    if ('error' in auth) return auth.error;
    const { userId } = auth;

    const messages = db.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if ('error' in auth) return auth.error;
    const { userId } = auth;

    // JSON parse safety
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { message, role } = body;

    // Type validation
    if (typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Mensagem e role obrigatorios' }, { status: 400 });
    }
    // Role whitelist: only allow 'user'
    if (role !== 'user') {
      return NextResponse.json({ error: 'Mensagem e role obrigatorios' }, { status: 400 });
    }
    // Content length limit
    if (message.length > 10000) {
      return NextResponse.json({ error: 'Mensagem muito longa' }, { status: 400 });
    }

    const chatMessage = db.chatMessage.create({
      data: { id: genId(), userId, role, content: message, createdAt: nowISO() },
    });

    return NextResponse.json({ message: chatMessage }, { status: 201 });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const auth = await requireUser();
    if ('error' in auth) return auth.error;
    const { userId } = auth;

    db.chatMessage.deleteMany({ where: { userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
