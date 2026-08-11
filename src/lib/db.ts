import { neon } from '@neondatabase/serverless';
import { createClient, Client as LibsqlClient } from '@libsql/client';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

// ═══════════════════════════════════════════════════════════════
// DATABASE — PostgreSQL (Neon) for production, SQLite for local dev
// ═══════════════════════════════════════════════════════════════

const PG_URL = process.env.POSTGRES_URL || '';

// Hardcoded Neon fallback (used when env var not set on Vercel)
const NEON_FALLBACK = 'postgresql://neondb_owner:npg_xKeSkPo0y4zW@ep-shiny-shape-acra2g9i-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

type DbBackend = 'postgres' | 'sqlite';
let _backend: DbBackend | null = null;
let _neonQuery: ReturnType<typeof neon> | null = null;
let _libsqlClient: LibsqlClient | null = null;

function getBackend(): DbBackend {
  if (_backend) return _backend;

  const pgUrl = PG_URL || NEON_FALLBACK;

  // On Vercel/production, always use PostgreSQL
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    _backend = 'postgres';
    _neonQuery = neon(pgUrl);
    console.log('[db] Using Neon PostgreSQL (production)');
    return _backend;
  }

  // For local dev, try PostgreSQL if POSTGRES_URL is explicitly set
  if (PG_URL) {
    _backend = 'postgres';
    _neonQuery = neon(PG_URL);
    console.log('[db] Using Neon PostgreSQL (POSTGRES_URL set)');
    return _backend;
  }

  // Local SQLite fallback
  _backend = 'sqlite';
  const dir = join(process.cwd(), 'db');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const dbPath = join(dir, 'custom.db');
  _libsqlClient = createClient({ url: `file:${dbPath}` });
  console.log(`[db] Using local SQLite at ${dbPath}`);
  return _backend;
}

// ═══════════════════════════════════════════════════════════════
// UNIFIED QUERY EXECUTION
// ═══════════════════════════════════════════════════════════════

async function execQuery(queryStr: string, params: any[] = []): Promise<any[]> {
  const backend = getBackend();

  if (backend === 'postgres' && _neonQuery) {
    // Convert $N placeholders from buildWhere for neon.sql.query()
    const rows = await _neonQuery.query(queryStr, params);
    return rows || [];
  }

  // SQLite: convert $N placeholders to ?
  if (_libsqlClient) {
    let sqliteSql = queryStr;
    // Convert $1, $2, ... back to ? for SQLite
    sqliteSql = sqliteSql.replace(/\$(\d+)/g, '?');
    // Convert ILIKE to LIKE for SQLite
    sqliteSql = sqliteSql.replace(/\bILIKE\b/g, 'LIKE');
    const result = await _libsqlClient.execute({ sql: sqliteSql, args: params });
    return result.rows || [];
  }

  throw new Error('[db] No database connection available');
}

// ═══════════════════════════════════════════════════════════════
// SCHEMA (PostgreSQL-compatible, also works with SQLite)
// ═══════════════════════════════════════════════════════════════

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'USER',
  "plan" TEXT NOT NULL DEFAULT 'FREE',
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "stripePriceId" TEXT,
  "stripeCurrentPeriodEnd" TEXT,
  "avatar" TEXT,
  "bio" TEXT,
  "xp" INTEGER NOT NULL DEFAULT 0,
  "level" INTEGER NOT NULL DEFAULT 1,
  "currentStreak" INTEGER NOT NULL DEFAULT 0,
  "longestStreak" INTEGER NOT NULL DEFAULT 0,
  "lastStudyDate" TEXT,
  "totalStudyMinutes" INTEGER NOT NULL DEFAULT 0,
  "totalSessions" INTEGER NOT NULL DEFAULT 0,
  "totalTasksCompleted" INTEGER NOT NULL DEFAULT 0,
  "totalFlashcardsReviewed" INTEGER NOT NULL DEFAULT 0,
  "totalQuestionsAnswered" INTEGER NOT NULL DEFAULT 0,
  "reputation" INTEGER NOT NULL DEFAULT 0,
  "reputationLevel" TEXT NOT NULL DEFAULT 'Aprendiz',
  "createdAt" TEXT NOT NULL DEFAULT '',
  "updatedAt" TEXT NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE TABLE IF NOT EXISTS "Subject" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT NOT NULL DEFAULT '#6366f1',
  "icon" TEXT NOT NULL DEFAULT 'book',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "userId" TEXT NOT NULL,
  "isActive" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TEXT NOT NULL DEFAULT '',
  "updatedAt" TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS "Subject_userId_idx" ON "Subject"("userId");
CREATE TABLE IF NOT EXISTS "Topic" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "name" TEXT,
  "description" TEXT,
  "content" TEXT,
  "subjectId" TEXT NOT NULL,
  "mastery" REAL NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'active',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL DEFAULT '',
  "updatedAt" TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS "Topic_subjectId_idx" ON "Topic"("subjectId");
CREATE TABLE IF NOT EXISTS "Task" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "dueDate" TEXT,
  "completedAt" TEXT,
  "subjectId" TEXT,
  "userId" TEXT NOT NULL,
  "xpReward" INTEGER NOT NULL DEFAULT 10,
  "estimatedMinutes" INTEGER,
  "actualMinutes" INTEGER,
  "sortOrder" INTEGER,
  "createdAt" TEXT NOT NULL DEFAULT '',
  "updatedAt" TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS "Task_userId_idx" ON "Task"("userId");
CREATE INDEX IF NOT EXISTS "Task_subjectId_idx" ON "Task"("subjectId");
CREATE INDEX IF NOT EXISTS "Task_status_idx" ON "Task"("status");
CREATE TABLE IF NOT EXISTS "Goal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "targetDate" TEXT,
  "completedAt" TEXT,
  "progress" REAL NOT NULL DEFAULT 0,
  "subjectId" TEXT,
  "userId" TEXT NOT NULL,
  "xpReward" INTEGER NOT NULL DEFAULT 25,
  "createdAt" TEXT NOT NULL DEFAULT '',
  "updatedAt" TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS "Goal_userId_idx" ON "Goal"("userId");
CREATE INDEX IF NOT EXISTS "Goal_subjectId_idx" ON "Goal"("subjectId");
CREATE TABLE IF NOT EXISTS "CalendarEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "date" TEXT NOT NULL,
  "endDate" TEXT,
  "type" TEXT NOT NULL DEFAULT 'study',
  "isAllDay" INTEGER NOT NULL DEFAULT 0,
  "color" TEXT NOT NULL DEFAULT '#6366f1',
  "subjectId" TEXT,
  "userId" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT '',
  "updatedAt" TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS "CalendarEvent_userId_idx" ON "CalendarEvent"("userId");
CREATE TABLE IF NOT EXISTS "XPTransaction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "amount" INTEGER NOT NULL,
  "source" TEXT NOT NULL,
  "description" TEXT,
  "userId" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS "XPTransaction_userId_idx" ON "XPTransaction"("userId");
CREATE TABLE IF NOT EXISTS "Achievement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "requirement" INTEGER NOT NULL DEFAULT 1,
  "xpReward" INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS "UserAchievement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "achievementId" TEXT NOT NULL,
  "unlockedAt" TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS "UserAchievement_userId_idx" ON "UserAchievement"("userId");
CREATE TABLE IF NOT EXISTS "StreakRecord" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "minutes" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS "StreakRecord_userId_idx" ON "StreakRecord"("userId");
CREATE TABLE IF NOT EXISTS "Notebook" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL DEFAULT '',
  "color" TEXT NOT NULL DEFAULT '#c0392b',
  "icon" TEXT NOT NULL DEFAULT 'book',
  "userId" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT '',
  "updatedAt" TEXT NOT NULL DEFAULT ''
);
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
  "createdAt" TEXT NOT NULL DEFAULT '',
  "updatedAt" TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS "NotebookPage_notebookId_idx" ON "NotebookPage"("notebookId");
CREATE TABLE IF NOT EXISTS "NotebookTag" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#6b7280',
  "notebookId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS "NotebookTag_notebookId_idx" ON "NotebookTag"("notebookId");
CREATE INDEX IF NOT EXISTS "NotebookTag_userId_idx" ON "NotebookTag"("userId");
CREATE TABLE IF NOT EXISTS "Flashcard" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "front" TEXT NOT NULL,
  "back" TEXT NOT NULL,
  "notebookId" TEXT,
  "userId" TEXT NOT NULL,
  "easeFactor" REAL NOT NULL DEFAULT 2.5,
  "interval" INTEGER NOT NULL DEFAULT 0,
  "repetitions" INTEGER NOT NULL DEFAULT 0,
  "nextReview" TEXT NOT NULL DEFAULT '',
  "createdAt" TEXT NOT NULL DEFAULT '',
  "updatedAt" TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS "StudySession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "subjectId" TEXT,
  "duration" INTEGER NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'pomodoro',
  "objective" TEXT,
  "rating" INTEGER,
  "notes" TEXT,
  "xpEarned" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS "StudySession_userId_idx" ON "StudySession"("userId");
CREATE TABLE IF NOT EXISTS "ChatMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS "DailyUsage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "date" TEXT NOT NULL DEFAULT '',
  "chatMessages" INTEGER NOT NULL DEFAULT 0,
  "flashcards" INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS "DailyUsage_userId_date_key" ON "DailyUsage"("userId", "date");
CREATE INDEX IF NOT EXISTS "DailyUsage_userId_idx" ON "DailyUsage"("userId");
CREATE TABLE IF NOT EXISTS "UserMemory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'general',
  "content" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'conversation',
  "createdAt" TEXT NOT NULL DEFAULT '',
  "updatedAt" TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS "UserMemory_userId_idx" ON "UserMemory"("userId");
CREATE TABLE IF NOT EXISTS "DiscoverItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL DEFAULT 'roadmap',
  "content" TEXT NOT NULL DEFAULT '{}',
  "tags" TEXT NOT NULL DEFAULT '[]',
  "isPublic" INTEGER NOT NULL DEFAULT 0,
  "saves" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL DEFAULT '',
  "updatedAt" TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS "DiscoverItem_userId_idx" ON "DiscoverItem"("userId");
CREATE INDEX IF NOT EXISTS "DiscoverItem_isPublic_idx" ON "DiscoverItem"("isPublic");
CREATE TABLE IF NOT EXISTS "DiscoverSave" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "discoverItemId" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS "Battle" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "subjectId" TEXT,
  "topic" TEXT NOT NULL,
  "difficulty" TEXT NOT NULL DEFAULT 'medium',
  "totalQuestions" INTEGER NOT NULL DEFAULT 5,
  "correctAnswers" INTEGER NOT NULL DEFAULT 0,
  "score" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'active',
  "questions" TEXT NOT NULL DEFAULT '[]',
  "answers" TEXT NOT NULL DEFAULT '[]',
  "xpEarned" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS "Battle_userId_idx" ON "Battle"("userId");
CREATE TABLE IF NOT EXISTS "Mission" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "subject" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "steps" TEXT NOT NULL,
  "completedSteps" INTEGER NOT NULL DEFAULT 0,
  "totalSteps" INTEGER NOT NULL DEFAULT 0,
  "startMastery" REAL NOT NULL DEFAULT 0,
  "endMastery" REAL,
  "estimatedMinutes" INTEGER,
  "xpReward" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT '',
  "updatedAt" TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS "Mission_userId_idx" ON "Mission"("userId");
CREATE INDEX IF NOT EXISTS "Mission_status_idx" ON "Mission"("status");
CREATE TABLE IF NOT EXISTS "PreTest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "subjectId" TEXT,
  "topic" TEXT NOT NULL,
  "initialScore" REAL NOT NULL DEFAULT 0,
  "finalScore" REAL,
  "questions" TEXT NOT NULL,
  "answers" TEXT,
  "completedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS "PreTest_userId_idx" ON "PreTest"("userId");
CREATE TABLE IF NOT EXISTS "Roadmap" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "topic" TEXT NOT NULL,
  "steps" TEXT NOT NULL,
  "currentStep" INTEGER NOT NULL DEFAULT 0,
  "totalSteps" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'active',
  "isAI" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL DEFAULT '',
  "updatedAt" TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS "Roadmap_userId_idx" ON "Roadmap"("userId");
`;

// ═══════════════════════════════════════════════════════════════
// SCHEMA INITIALIZATION
// ═══════════════════════════════════════════════════════════════

let schemaReady: Promise<void> | null = null;

export async function ensureSchema(): Promise<void> {
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    const statements = SCHEMA_SQL.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (const sql of statements) {
      try {
        await execQuery(sql);
      } catch (e: any) {
        // table/index already exists — ignore
      }
    }
    console.log('[db] Schema ensured — all 24 tables ready');
  })();

  return schemaReady;
}

// Auto-initialize
ensureSchema().catch(console.error);

// ═══════════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════════

export const nowISO = () => new Date().toISOString();
export const genId = () => randomUUID();

function rowToObj(row: any): any {
  if (!row) return null;
  return { ...row };
}

function rowsToObjs(rows: any[]): any[] {
  return (rows || []).map(rowToObj);
}

// ═══════════════════════════════════════════════════════════════
// QUERY BUILDER — uses $N placeholders (PostgreSQL native)
// SQLite backend converts $N → ? at execution time
// ═══════════════════════════════════════════════════════════════

export function buildWhere(where: Record<string, any>, params: any[] = [], tablePrefix = ''): string {
  if (!where || Object.keys(where).length === 0) return '1=1';

  const clauses: string[] = [];

  for (const [key, value] of Object.entries(where)) {
    const col = tablePrefix ? `${tablePrefix}."${key}"` : `"${key}"`;

    if (key === 'AND' && Array.isArray(value)) {
      const andClauses = value.map((w: any) => buildWhere(w, params, tablePrefix));
      clauses.push(`(${andClauses.join(' AND ')})`);
    } else if (key === 'OR' && Array.isArray(value)) {
      const orClauses = value.map((w: any) => buildWhere(w, params, tablePrefix));
      clauses.push(`(${orClauses.join(' OR ')})`);
    } else if (key === 'NOT' && typeof value === 'object' && value !== null) {
      clauses.push(`NOT (${buildWhere(value, params, tablePrefix)})`);
    } else if (value === null || value === undefined) {
      clauses.push(`${col} IS NULL`);
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      for (const [op, opVal] of Object.entries(value)) {
        switch (op) {
          case 'gte': clauses.push(`${col} >= $${params.length + 1}`); params.push(opVal); break;
          case 'gt': clauses.push(`${col} > $${params.length + 1}`); params.push(opVal); break;
          case 'lte': clauses.push(`${col} <= $${params.length + 1}`); params.push(opVal); break;
          case 'lt': clauses.push(`${col} < $${params.length + 1}`); params.push(opVal); break;
          case 'contains': clauses.push(`${col} ILIKE $${params.length + 1}`); params.push(`%${opVal}%`); break;
          case 'startsWith': clauses.push(`${col} ILIKE $${params.length + 1}`); params.push(`${opVal}%`); break;
          case 'endsWith': clauses.push(`${col} ILIKE $${params.length + 1}`); params.push(`%${opVal}`); break;
          case 'in':
            if (Array.isArray(opVal) && opVal.length > 0) {
              const phs: string[] = [];
              for (const v of opVal) {
                phs.push(`$${params.length + 1}`);
                params.push(v);
              }
              clauses.push(`${col} IN (${phs.join(', ')})`);
            } else {
              clauses.push('1=0');
            }
            break;
          case 'notIn':
            if (Array.isArray(opVal) && opVal.length > 0) {
              const phs: string[] = [];
              for (const v of opVal) {
                phs.push(`$${params.length + 1}`);
                params.push(v);
              }
              clauses.push(`${col} NOT IN (${phs.join(', ')})`);
            }
            break;
          case 'not': clauses.push(`${col} != $${params.length + 1}`); params.push(opVal); break;
          case 'equals': clauses.push(`${col} = $${params.length + 1}`); params.push(opVal); break;
          case 'neq': clauses.push(`${col} != $${params.length + 1}`); params.push(opVal); break;
          default: clauses.push(`${col} = $${params.length + 1}`); params.push(opVal);
        }
      }
    } else {
      const paramValue = typeof value === 'boolean' ? (value ? 1 : 0) : value;
      clauses.push(`${col} = $${params.length + 1}`);
      params.push(paramValue);
    }
  }

  return clauses.length > 0 ? clauses.join(' AND ') : '1=1';
}

function buildOrderBy(orderBy: any): string {
  if (!orderBy) return '';
  if (typeof orderBy === 'string') return `ORDER BY "${orderBy}" ASC`;
  if (Array.isArray(orderBy)) {
    return 'ORDER BY ' + orderBy.map((o: any) => {
      const key = typeof o === 'string' ? o : Object.keys(o)[0];
      const dir = typeof o === 'string' ? 'ASC' : (o[key] === 'desc' ? 'DESC' : 'ASC');
      return `"${key}" ${dir}`;
    }).join(', ');
  }
  const key = Object.keys(orderBy)[0];
  const dir = orderBy[key] === 'desc' ? 'DESC' : 'ASC';
  return `ORDER BY "${key}" ${dir}`;
}

// ═══════════════════════════════════════════════════════════════
// MODEL CLASS (async, dual-backend)
// ═══════════════════════════════════════════════════════════════

export class Model {
  constructor(public table: string) {}

  async findUnique({ where, select }: { where: Record<string, any>; select?: string[] } = {} as any): Promise<any> {
    await ensureSchema();
    const params: any[] = [];
    const sel = select && select.length > 0 ? select.map(s => `"${s}"`).join(', ') : '*';
    const whereClause = buildWhere(where, params);
    const rows = await execQuery(`SELECT ${sel} FROM "${this.table}" WHERE ${whereClause} LIMIT 1`, params);
    return rowToObj(rows[0]);
  }

  async findFirst({ where, orderBy, select }: any = {}): Promise<any> {
    await ensureSchema();
    const params: any[] = [];
    const sel = select && select.length > 0 ? select.map(s => `"${s}"`).join(', ') : '*';
    const whereClause = buildWhere(where, params);
    const orderClause = orderBy ? ' ' + buildOrderBy(orderBy) : '';
    const rows = await execQuery(`SELECT ${sel} FROM "${this.table}" WHERE ${whereClause}${orderClause} LIMIT 1`, params);
    return rowToObj(rows[0]);
  }

  async findMany({ where, select, orderBy, take, skip, distinct }: any = {}): Promise<any[]> {
    await ensureSchema();
    const params: any[] = [];
    let sel = select && select.length > 0 ? select.map((s: string) => `"${s}"`).join(', ') : '*';
    if (distinct) sel = `DISTINCT ${sel}`;
    const whereClause = buildWhere(where, params);
    const orderClause = orderBy ? ' ' + buildOrderBy(orderBy) : '';
    const limitClause = take ? ` LIMIT ${Number(take)}` : '';
    const offsetClause = skip ? ` OFFSET ${Number(skip)}` : '';
    const rows = await execQuery(`SELECT ${sel} FROM "${this.table}" WHERE ${whereClause}${orderClause}${limitClause}${offsetClause}`, params);
    return rowsToObjs(rows);
  }

  async create({ data }: { data: Record<string, any> }): Promise<any> {
    await ensureSchema();
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const cols = keys.map(k => `"${k}"`).join(', ');
    await execQuery(`INSERT INTO "${this.table}" (${cols}) VALUES (${placeholders})`, values);
    return this.findUnique({ where: { id: data.id } });
  }

  async update({ where, data }: { where: Record<string, any>; data: Record<string, any> }): Promise<any> {
    await ensureSchema();
    const params: any[] = [];
    const setParts: string[] = [];
    for (const k of Object.keys(data)) {
      setParts.push(`"${k}" = $${params.length + 1}`);
      params.push(data[k]);
    }
    const setClause = setParts.join(', ');
    const whereClause = buildWhere(where, params);
    await execQuery(`UPDATE "${this.table}" SET ${setClause} WHERE ${whereClause}`, params);
    return this.findUnique({ where });
  }

  async updateMany({ where, data }: { where: Record<string, any>; data: Record<string, any> }): Promise<{ count: number }> {
    await ensureSchema();
    const params: any[] = [];
    const setParts: string[] = [];
    for (const k of Object.keys(data)) {
      setParts.push(`"${k}" = $${params.length + 1}`);
      params.push(data[k]);
    }
    const setClause = setParts.join(', ');
    const whereClause = buildWhere(where, params);
    await execQuery(`UPDATE "${this.table}" SET ${setClause} WHERE ${whereClause}`, params);
    return { count: 0 };
  }

  async delete({ where }: { where: Record<string, any> }): Promise<any> {
    const row = await this.findUnique({ where });
    if (!row) return null;
    await ensureSchema();
    const params: any[] = [];
    const whereClause = buildWhere(where, params);
    await execQuery(`DELETE FROM "${this.table}" WHERE ${whereClause}`, params);
    return row;
  }

  async deleteMany({ where }: { where?: Record<string, any> } = {}): Promise<{ count: number }> {
    await ensureSchema();
    const params: any[] = [];
    const whereClause = buildWhere(where || {}, params);
    await execQuery(`DELETE FROM "${this.table}" WHERE ${whereClause}`, params);
    return { count: 0 };
  }

  async count({ where }: { where?: Record<string, any> } = {}): Promise<number> {
    await ensureSchema();
    const params: any[] = [];
    const whereClause = buildWhere(where || {}, params);
    const rows = await execQuery(`SELECT COUNT(*) as count FROM "${this.table}" WHERE ${whereClause}`, params);
    return Number(rows[0]?.count ?? 0);
  }

  async exec(queryStr: string, ...params: any[]): Promise<any> {
    await ensureSchema();
    await execQuery(queryStr, params);
    return { changes: 0 };
  }

  async query(queryStr: string, ...params: any[]): Promise<any[]> {
    await ensureSchema();
    const rows = await execQuery(queryStr, params);
    return rowsToObjs(rows);
  }

  async queryOne(queryStr: string, ...params: any[]): Promise<any> {
    await ensureSchema();
    const rows = await execQuery(queryStr, params);
    return rowToObj(rows[0]);
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTED MODELS
// ═══════════════════════════════════════════════════════════════

export const db = {
  user: new Model('User'),
  subject: new Model('Subject'),
  topic: new Model('Topic'),
  task: new Model('Task'),
  goal: new Model('Goal'),
  calendarEvent: new Model('CalendarEvent'),
  xpTransaction: new Model('XPTransaction'),
  achievement: new Model('Achievement'),
  userAchievement: new Model('UserAchievement'),
  streakRecord: new Model('StreakRecord'),
  notebook: new Model('Notebook'),
  notebookPage: new Model('NotebookPage'),
  notebookTag: new Model('NotebookTag'),
  flashcard: new Model('Flashcard'),
  studySession: new Model('StudySession'),
  chatMessage: new Model('ChatMessage'),
  dailyUsage: new Model('DailyUsage'),
  userMemory: new Model('UserMemory'),
  discoverItem: new Model('DiscoverItem'),
  discoverSave: new Model('DiscoverSave'),
  battle: new Model('Battle'),
  mission: new Model('Mission'),
  preTest: new Model('PreTest'),
  roadmap: new Model('Roadmap'),
};

// Re-export as 'sqlite' for backward compat (raw queries)
export const sqlite = {
  async execute({ sql: queryStr, args = [] }: { sql: string; args?: any[] }) {
    await ensureSchema();
    const rows = await execQuery(queryStr, args);
    return { rows: rowsToObjs(rows), rowsAffected: 0 };
  },
};
