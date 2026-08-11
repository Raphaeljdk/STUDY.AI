import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const results: string[] = [];

  try {
    // Verify tables exist by running a count query
    const tables = ['User', 'Subject', 'Task', 'Notebook', 'Flashcard', 'StudySession'];
    for (const table of tables) {
      try {
        const count = await db[table.charAt(0).toLowerCase() + table.slice(1) as keyof typeof db].count();
        results.push(`${table}: OK (${count} rows)`);
      } catch (e: any) {
        results.push(`${table}: ${e?.message || 'error'}`);
      }
    }

    results.push('DB connection OK');
    return NextResponse.json({ success: true, results });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
