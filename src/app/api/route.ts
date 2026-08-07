import { NextResponse } from "next/server";
import { db } from '@/lib/db';

export async function GET() {
  const health: Record<string, string | boolean | null> = {
    status: 'ok',
    env_node_env: process.env.NODE_ENV || null,
    env_database_url_set: !!process.env.DATABASE_URL,
    env_nextauth_secret_set: !!process.env.NEXTAUTH_SECRET,
    env_groq_key_set: !!process.env.GROQ_API_KEY,
  };

  // Test DB connection
  try {
    const count = await db.user.count();
    health.db_connected = true;
    health.db_user_count = count;
  } catch (err: any) {
    health.db_connected = false;
    health.db_error = err?.message || 'Unknown';
  }

  return NextResponse.json(health);
}
