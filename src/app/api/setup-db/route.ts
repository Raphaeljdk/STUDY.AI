import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const results: string[] = [];

  try {
    // Add missing columns to User table
    const userCols = [
      { name: 'stripeCustomerId', type: 'TEXT' },
      { name: 'stripeSubscriptionId', type: 'TEXT' },
      { name: 'stripePriceId', type: 'TEXT' },
      { name: 'stripeCurrentPeriodEnd', type: 'TIMESTAMP(3)' },
    ];

    for (const col of userCols) {
      try {
        await db.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "${col.name}" ${col.type}`);
        results.push(`Added User.${col.name}`);
      } catch (e: any) {
        if (e?.message?.includes('already exists') || e?.code === '42701') {
          results.push(`User.${col.name} already exists (ok)`);
        } else {
          results.push(`User.${col.name}: ${e?.message || 'error'}`);
        }
      }
    }

    // Create NotebookPage table
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
        )
      `);
      results.push('NotebookPage table created/exists');
    } catch (e: any) {
      results.push(`NotebookPage: ${e?.message || 'error'}`);
    }

    // Create NotebookTag table
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "NotebookTag" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "color" TEXT NOT NULL DEFAULT '#6b7280',
          "notebookId" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      results.push('NotebookTag table created/exists');
    } catch (e: any) {
      results.push(`NotebookTag: ${e?.message || 'error'}`);
    }

    // Create DailyUsage table
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "DailyUsage" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "chatMessages" INTEGER NOT NULL DEFAULT 0,
          "flashcards" INTEGER NOT NULL DEFAULT 0,
          CONSTRAINT "DailyUsage_userId_date_key" UNIQUE ("userId", "date")
        )
      `);
      results.push('DailyUsage table created/exists');
    } catch (e: any) {
      results.push(`DailyUsage: ${e?.message || 'error'}`);
    }

    // Create indexes
    try {
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "NotebookPage_notebookId_idx" ON "NotebookPage"("notebookId")`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "NotebookTag_notebookId_idx" ON "NotebookTag"("notebookId")`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "NotebookTag_userId_idx" ON "NotebookTag"("userId")`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DailyUsage_userId_idx" ON "DailyUsage"("userId")`);
      results.push('Indexes created/verified');
    } catch (e: any) {
      results.push(`Indexes: ${e?.message || 'error'}`);
    }

    // Test: try to query User table
    try {
      await db.user.count();
      results.push('DB connection OK - User table accessible');
    } catch (e: any) {
      results.push(`DB test FAILED: ${e?.message || 'error'}`);
    }

    return NextResponse.json({ success: true, results });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
