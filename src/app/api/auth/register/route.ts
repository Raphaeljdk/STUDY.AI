import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

// Ensure DB schema is up-to-date (creates tables/columns if missing)
async function ensureDBSchema() {
  try {
    await db.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT`);
    await db.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT`);
    await db.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripePriceId" TEXT`);
    await db.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeCurrentPeriodEnd" TIMESTAMP(3)`);
  } catch {
    // Columns might already exist or table structure different - continue anyway
  }
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "NotebookPage" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "notebookId" TEXT NOT NULL,
        "pageNumber" INTEGER NOT NULL DEFAULT 1,
        "canvasData" TEXT,
        "textContent" TEXT NOT NULL DEFAULT '',
        "paperStyle" TEXT NOT NULL DEFAULT 'blank',
        "paperColor" TEXT NOT NULL DEFAULT '#ffffff',
        "lineColor" TEXT NOT NULL DEFAULT '#d1d5db',
        "width" INTEGER NOT NULL DEFAULT 1200,
        "height" INTEGER NOT NULL DEFAULT 1600,
        "layers" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`);
  } catch { /* ignore */ }
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "NotebookTag" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "color" TEXT NOT NULL DEFAULT '#6b7280',
        "notebookId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`);
  } catch { /* ignore */ }
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DailyUsage" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "chatMessages" INTEGER NOT NULL DEFAULT 0,
        "flashcards" INTEGER NOT NULL DEFAULT 0
      )`);
  } catch { /* ignore */ }
}

export async function POST(request: Request) {
  try {
    // Ensure DB schema is up-to-date before any operations
    await ensureDBSchema();

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

    const { name, email, password, plan } = body;

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

    // Always create as FREE - premium is handled via Stripe, not registration
    const userPlan = 'FREE' as const;

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name: trimmedName,
        email: normalizedEmail,
        password: hashedPassword,
        plan: userPlan,
      },
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
    });
  } catch (error: any) {
    console.error('[Register] Full error:', error?.message, error?.code, error?.meta);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
