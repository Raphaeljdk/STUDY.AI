import { NextResponse } from 'next/server';
import { db, sqlite } from '@/lib/db';

export async function GET() {
  const results: string[] = [];

  try {
    // Add missing columns to User table (SQLite-specific: check if column exists first)
    const userCols = [
      { name: 'stripeCustomerId', type: 'TEXT' },
      { name: 'stripeSubscriptionId', type: 'TEXT' },
      { name: 'stripePriceId', type: 'TEXT' },
      { name: 'stripeCurrentPeriodEnd', type: 'TEXT' },
    ];

    // Get existing columns from SQLite table_info
    const tableInfo = (await sqlite.execute({ sql: `PRAGMA table_info("User")` })).rows as any[];
    const existingCols = new Set(tableInfo.map((r: any) => r.name));

    for (const col of userCols) {
      if (existingCols.has(col.name)) {
        results.push(`User.${col.name} already exists (ok)`);
      } else {
        try {
          await sqlite.execute({ sql: `ALTER TABLE "User" ADD COLUMN "${col.name}" ${col.type}` });
          results.push(`Added User.${col.name}`);
        } catch (e: any) {
          results.push(`User.${col.name}: ${e?.message || 'error'}`);
        }
      }
    }

    // The NotebookPage, NotebookTag, and DailyUsage tables are now created
    // automatically by db.ts SCHEMA_SQL, so we just verify they exist.
    const tables = ['NotebookPage', 'NotebookTag', 'DailyUsage'];
    for (const table of tables) {
      try {
        await sqlite.execute({ sql: `SELECT 1 FROM "${table}" LIMIT 1` });
        results.push(`${table} table exists (ok)`);
      } catch {
        results.push(`${table}: table not found`);
      }
    }

    // Create indexes if they don't exist
    const indexes = [
      `CREATE INDEX IF NOT EXISTS "NotebookPage_notebookId_idx" ON "NotebookPage"("notebookId")`,
      `CREATE INDEX IF NOT EXISTS "NotebookTag_notebookId_idx" ON "NotebookTag"("notebookId")`,
      `CREATE INDEX IF NOT EXISTS "NotebookTag_userId_idx" ON "NotebookTag"("userId")`,
      `CREATE INDEX IF NOT EXISTS "DailyUsage_userId_idx" ON "DailyUsage"("userId")`,
    ];

    try {
      for (const idx of indexes) {
        await sqlite.execute({ sql: idx });
      }
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
