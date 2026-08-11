import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, genId, nowISO } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const messages = await db.chatMessage.findMany({
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
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

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

    const chatMessage = await db.chatMessage.create({
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
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    await db.chatMessage.deleteMany({ where: { userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
