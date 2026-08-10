import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { randomUUID } from 'crypto'

// ═══════════════════════════════════════════════════════════════
// DATABASE PATH
// ═══════════════════════════════════════════════════════════════

function getDbPath(): string {
  // In production (Vercel), use /tmp/ which is writable
  if (process.env.NODE_ENV === 'production') {
    return '/tmp/studyai.db'
  }
  // Local dev
  const dir = join(process.cwd(), 'db')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, 'custom.db')
}

const DB_PATH = getDbPath()

// ═══════════════════════════════════════════════════════════════
// RAW SQL SCHEMA
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
  "learningStyle" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  "updatedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "Achievement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "icon" TEXT NOT NULL DEFAULT 'trophy',
  "xpReward" INTEGER NOT NULL DEFAULT 0,
  "category" TEXT NOT NULL DEFAULT 'general',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS "Achievement_key_key" ON "Achievement"("key");

CREATE TABLE IF NOT EXISTS "Subject" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT NOT NULL DEFAULT '#6366f1',
  "icon" TEXT NOT NULL DEFAULT 'book',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  "updatedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Subject_userId_idx" ON "Subject"("userId");

CREATE TABLE IF NOT EXISTS "Topic" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "subjectId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "mastery" REAL NOT NULL DEFAULT 0,
  "totalQuestions" INTEGER NOT NULL DEFAULT 0,
  "correctAnswers" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  "updatedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Topic_subjectId_idx" ON "Topic"("subjectId");

CREATE TABLE IF NOT EXISTS "Task" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "subjectId" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "dueDate" TEXT,
  "estimatedMinutes" INTEGER,
  "actualMinutes" INTEGER,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  "updatedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "Task_userId_idx" ON "Task"("userId");
CREATE INDEX IF NOT EXISTS "Task_status_idx" ON "Task"("status");

CREATE TABLE IF NOT EXISTS "Goal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL DEFAULT 'DAILY',
  "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  "targetValue" INTEGER,
  "currentValue" INTEGER NOT NULL DEFAULT 0,
  "unit" TEXT,
  "subjectId" TEXT,
  "startDate" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  "targetDate" TEXT,
  "completedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  "updatedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "Goal_userId_idx" ON "Goal"("userId");
CREATE INDEX IF NOT EXISTS "Goal_status_idx" ON "Goal"("status");

CREATE TABLE IF NOT EXISTS "CalendarEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL DEFAULT 'STUDY_SESSION',
  "date" TEXT NOT NULL,
  "endDate" TEXT,
  "subjectId" TEXT,
  "isAllDay" INTEGER NOT NULL DEFAULT 0,
  "color" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  "updatedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "CalendarEvent_userId_idx" ON "CalendarEvent"("userId");
CREATE INDEX IF NOT EXISTS "CalendarEvent_date_idx" ON "CalendarEvent"("date");

CREATE TABLE IF NOT EXISTS "XPTransaction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "source" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "XPTransaction_userId_idx" ON "XPTransaction"("userId");
CREATE INDEX IF NOT EXISTS "XPTransaction_createdAt_idx" ON "XPTransaction"("createdAt");

CREATE TABLE IF NOT EXISTS "UserAchievement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "achievementId" TEXT NOT NULL,
  "unlockedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");
CREATE INDEX IF NOT EXISTS "UserAchievement_userId_idx" ON "UserAchievement"("userId");

CREATE TABLE IF NOT EXISTS "StreakRecord" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "streak" INTEGER NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "StreakRecord_userId_date_key" ON "StreakRecord"("userId", "date");
CREATE INDEX IF NOT EXISTS "StreakRecord_userId_idx" ON "StreakRecord"("userId");

CREATE TABLE IF NOT EXISTS "Notebook" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL DEFAULT '',
  "color" TEXT NOT NULL DEFAULT '#c0392b',
  "icon" TEXT NOT NULL DEFAULT 'book',
  "userId" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  "updatedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
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
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  "updatedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY ("notebookId") REFERENCES "Notebook"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "NotebookPage_notebookId_idx" ON "NotebookPage"("notebookId");

CREATE TABLE IF NOT EXISTS "NotebookTag" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#6b7280',
  "notebookId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY ("notebookId") REFERENCES "Notebook"("id") ON DELETE CASCADE
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
  "nextReview" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  "updatedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY ("notebookId") REFERENCES "Notebook"("id") ON DELETE SET NULL
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
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "StudySession_userId_idx" ON "StudySession"("userId");

CREATE TABLE IF NOT EXISTS "ChatMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "DailyUsage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "date" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  "chatMessages" INTEGER NOT NULL DEFAULT 0,
  "flashcards" INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "DailyUsage_userId_date_key" ON "DailyUsage"("userId", "date");
CREATE INDEX IF NOT EXISTS "DailyUsage_userId_idx" ON "DailyUsage"("userId");

CREATE TABLE IF NOT EXISTS "UserMemory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'general',
  "content" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'conversation',
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  "updatedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "UserMemory_userId_idx" ON "UserMemory"("userId");

CREATE TABLE IF NOT EXISTS "DiscoverItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "summary" TEXT,
  "subject" TEXT,
  "difficulty" TEXT NOT NULL DEFAULT 'medio',
  "duration" INTEGER,
  "emoji" TEXT NOT NULL DEFAULT '💡',
  "tags" TEXT,
  "isPublic" INTEGER NOT NULL DEFAULT 1,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "saves" INTEGER NOT NULL DEFAULT 0,
  "userId" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  "updatedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "DiscoverSave" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "discoverItemId" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("discoverItemId") REFERENCES "DiscoverItem"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "DiscoverSave_userId_discoverItemId_key" ON "DiscoverSave"("userId", "discoverItemId");
CREATE INDEX IF NOT EXISTS "DiscoverSave_userId_idx" ON "DiscoverSave"("userId");

CREATE TABLE IF NOT EXISTS "Battle" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "totalQuestions" INTEGER NOT NULL DEFAULT 5,
  "correctAnswers" INTEGER NOT NULL DEFAULT 0,
  "confidenceAvg" REAL NOT NULL DEFAULT 0,
  "duration" INTEGER NOT NULL DEFAULT 60,
  "xpEarned" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
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
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  "updatedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Mission_userId_idx" ON "Mission"("userId");
CREATE INDEX IF NOT EXISTS "Mission_status_idx" ON "Mission"("status");

CREATE TABLE IF NOT EXISTS "PreTest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "subjectId" TEXT,
  "topic" TEXT NOT NULL,
  "initialScore" REAL NOT NULL,
  "finalScore" REAL,
  "questions" TEXT NOT NULL,
  "answers" TEXT,
  "completedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
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
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  "updatedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Roadmap_userId_idx" ON "Roadmap"("userId");
`

// ═══════════════════════════════════════════════════════════════
// DATABASE SINGLETON (better-sqlite3 — synchronous, no ORM)
// ═══════════════════════════════════════════════════════════════

const globalForDb = globalThis as unknown as { _sqliteDb: Database.Database | undefined }

const sqlite: Database.Database =
  globalForDb._sqliteDb ?? new Database(DB_PATH, { fileMustExist: false })

if (!globalForDb._sqliteDb) {
  globalForDb._sqliteDb = sqlite
  // Enable WAL mode for better concurrent read performance
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  // Create all tables
  const statements = SCHEMA_SQL.split(';').map(s => s.trim()).filter(s => s.length > 0)
  for (const sql of statements) {
    try { sqlite.exec(sql) } catch (e: any) { /* table/index already exists */ }
  }
  console.log(`[db] SQLite ready at ${DB_PATH}`)
}

// ═══════════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════════

export const nowISO = () => new Date().toISOString()
export const genId = () => randomUUID()

// Convert SQLite row (snake_case integers for booleans) to JS object
function rowToObj(row: any): any {
  if (!row) return null
  const obj: any = { ...row }
  // SQLite stores booleans as 0/1
  for (const key of Object.keys(obj)) {
    if (obj[key] === 0 && ['isActive', 'isAllDay', 'isAI', 'isPublic'].includes(key)) {
      // Keep as 0/1 for now — let the API routes handle boolean conversion if needed
    }
  }
  return obj
}

function rowsToObjs(rows: any[]): any[] {
  return rows.map(rowToObj)
}

// ═══════════════════════════════════════════════════════════════
// QUERY BUILDER — Prisma-compatible API using better-sqlite3
// ═══════════════════════════════════════════════════════════════

/**
 * Build WHERE clause from Prisma-style where object.
 * Supports: equality, { gte, lte, gt, lt, contains, in, not, notIn, startsWith }, AND, OR
 */
export function buildWhere(where: Record<string, any>, params: any[] = [], tablePrefix = ''): string {
  if (!where || Object.keys(where).length === 0) return '1=1'

  const clauses: string[] = []

  for (const [key, value] of Object.entries(where)) {
    const col = tablePrefix ? `${tablePrefix}."${key}"` : `"${key}"`

    if (key === 'AND' && Array.isArray(value)) {
      const andClauses = value.map((w: any) => buildWhere(w, params, tablePrefix))
      clauses.push(`(${andClauses.join(' AND ')})`)
    } else if (key === 'OR' && Array.isArray(value)) {
      const orClauses = value.map((w: any) => buildWhere(w, params, tablePrefix))
      clauses.push(`(${orClauses.join(' OR ')})`)
    } else if (key === 'NOT' && typeof value === 'object' && value !== null) {
      clauses.push(`NOT (${buildWhere(value, params, tablePrefix)})`)
    } else if (value === null || value === undefined) {
      clauses.push(`${col} IS NULL`)
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Comparison operators
      for (const [op, opVal] of Object.entries(value)) {
        switch (op) {
          case 'gte': clauses.push(`${col} >= ?`); params.push(opVal); break
          case 'gt': clauses.push(`${col} > ?`); params.push(opVal); break
          case 'lte': clauses.push(`${col} <= ?`); params.push(opVal); break
          case 'lt': clauses.push(`${col} < ?`); params.push(opVal); break
          case 'contains': clauses.push(`${col} LIKE ?`); params.push(`%${opVal}%`); break
          case 'startsWith': clauses.push(`${col} LIKE ?`); params.push(`${opVal}%`); break
          case 'endsWith': clauses.push(`${col} LIKE ?`); params.push(`%${opVal}`); break
          case 'in':
            if (Array.isArray(opVal) && opVal.length > 0) {
              clauses.push(`${col} IN (${opVal.map(() => '?').join(', ')})`)
              params.push(...opVal)
            } else {
              clauses.push('1=0') // empty IN = no results
            }
            break
          case 'notIn':
            if (Array.isArray(opVal) && opVal.length > 0) {
              clauses.push(`${col} NOT IN (${opVal.map(() => '?').join(', ')})`)
              params.push(...opVal)
            }
            break
          case 'not': clauses.push(`${col} != ?`); params.push(opVal); break
          case 'equals': clauses.push(`${col} = ?`); params.push(opVal); break
          case 'neq': clauses.push(`${col} != ?`); params.push(opVal); break
          default: clauses.push(`${col} = ?`); params.push(opVal)
        }
      }
    } else {
      // Simple equality — convert booleans to 0/1 for SQLite
      const paramValue = typeof value === 'boolean' ? (value ? 1 : 0) : value;
      clauses.push(`${col} = ?`)
      params.push(paramValue)
    }
  }

  return clauses.length > 0 ? clauses.join(' AND ') : '1=1'
}

/** Build ORDER BY clause from Prisma-style orderBy */
function buildOrderBy(orderBy: any): string {
  if (!orderBy) return ''
  if (typeof orderBy === 'string') return `ORDER BY "${orderBy}" ASC`
  if (Array.isArray(orderBy)) {
    return 'ORDER BY ' + orderBy.map((o: any) => {
      const key = typeof o === 'string' ? o : Object.keys(o)[0]
      const dir = typeof o === 'string' ? 'ASC' : (o[key] === 'desc' ? 'DESC' : 'ASC')
      return `"${key}" ${dir}`
    }).join(', ')
  }
  // Single object: { field: 'asc' | 'desc' }
  const key = Object.keys(orderBy)[0]
  const dir = orderBy[key] === 'desc' ? 'DESC' : 'ASC'
  return `ORDER BY "${key}" ${dir}`
}

// ═══════════════════════════════════════════════════════════════
// MODEL CLASS — Provides Prisma-like API for each table
// ═══════════════════════════════════════════════════════════════

export class Model {
  constructor(public table: string) {}

  findUnique({ where, select }: { where: Record<string, any>; select?: string[] } = {} as any): any {
    const params: any[] = []
    const sel = select && select.length > 0 ? select.map(s => `"${s}"`).join(', ') : '*'
    const whereClause = buildWhere(where, params)
    const row = sqlite.prepare(`SELECT ${sel} FROM "${this.table}" WHERE ${whereClause} LIMIT 1`).get(...params)
    return rowToObj(row)
  }

  findFirst({ where, orderBy, select }: any = {}): any {
    const params: any[] = []
    const sel = select && select.length > 0 ? select.map(s => `"${s}"`).join(', ') : '*'
    const whereClause = buildWhere(where, params)
    const orderClause = orderBy ? ' ' + buildOrderBy(orderBy) : ''
    const row = sqlite.prepare(`SELECT ${sel} FROM "${this.table}" WHERE ${whereClause}${orderClause} LIMIT 1`).get(...params)
    return rowToObj(row)
  }

  findMany({ where, select, orderBy, take, skip, distinct }: any = {}): any[] {
    const params: any[] = []
    let sel = select && select.length > 0 ? select.map((s: string) => `"${s}"`).join(', ') : '*'
    if (distinct) sel = `DISTINCT ${sel}`
    const whereClause = buildWhere(where, params)
    const orderClause = orderBy ? ' ' + buildOrderBy(orderBy) : ''
    const limitClause = take ? ` LIMIT ${take}` : ''
    const offsetClause = skip ? ` OFFSET ${skip}` : ''
    const rows = sqlite.prepare(`SELECT ${sel} FROM "${this.table}" WHERE ${whereClause}${orderClause}${limitClause}${offsetClause}`).all(...params)
    return rowsToObjs(rows)
  }

  create({ data }: { data: Record<string, any> }): any {
    const keys = Object.keys(data)
    const values = Object.values(data)
    const placeholders = keys.map(() => '?').join(', ')
    const cols = keys.map(k => `"${k}"`).join(', ')
    sqlite.prepare(`INSERT INTO "${this.table}" (${cols}) VALUES (${placeholders})`).run(...values)
    // Return the created row
    return this.findUnique({ where: { id: data.id } })
  }

  update({ where, data }: { where: Record<string, any>; data: Record<string, any> }): any {
    const params: any[] = []
    const setClause = Object.keys(data).map(k => { params.push(data[k]); return `"${k}" = ?` }).join(', ')
    const whereClause = buildWhere(where, params)
    sqlite.prepare(`UPDATE "${this.table}" SET ${setClause} WHERE ${whereClause}`).run(...params)
    return this.findUnique({ where })
  }

  updateMany({ where, data }: { where: Record<string, any>; data: Record<string, any> }): { count: number } {
    const params: any[] = []
    const setClause = Object.keys(data).map(k => { params.push(data[k]); return `"${k}" = ?` }).join(', ')
    const whereClause = buildWhere(where, params)
    const result = sqlite.prepare(`UPDATE "${this.table}" SET ${setClause} WHERE ${whereClause}`).run(...params)
    return { count: result.changes }
  }

  delete({ where }: { where: Record<string, any> }): any {
    const row = this.findUnique({ where })
    if (!row) return null
    const params: any[] = []
    const whereClause = buildWhere(where, params)
    sqlite.prepare(`DELETE FROM "${this.table}" WHERE ${whereClause}`).run(...params)
    return row
  }

  deleteMany({ where }: { where?: Record<string, any> } = {}): { count: number } {
    const params: any[] = []
    const whereClause = buildWhere(where || {}, params)
    const result = sqlite.prepare(`DELETE FROM "${this.table}" WHERE ${whereClause}`).run(...params)
    return { count: result.changes }
  }

  count({ where }: { where?: Record<string, any> } = {}): number {
    const params: any[] = []
    const whereClause = buildWhere(where || {}, params)
    const row = sqlite.prepare(`SELECT COUNT(*) as count FROM "${this.table}" WHERE ${whereClause}`).get(...params) as any
    return row?.count ?? 0
  }

  /** Raw SQL execution */
  exec(sql: string, ...params: any[]) {
    return sqlite.prepare(sql).run(...params)
  }

  /** Raw SQL query */
  query(sql: string, ...params: any[]) {
    return rowsToObjs(sqlite.prepare(sql).all(...params))
  }

  /** Raw SQL query - single row */
  queryOne(sql: string, ...params: any[]) {
    return rowToObj(sqlite.prepare(sql).get(...params))
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTED MODELS (drop-in Prisma replacement)
// Usage: import { db } from '@/lib/db'
//        db.user.findUnique({ where: { id: '...' } })
//        db.user.create({ data: { name: '...', email: '...' } })
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
}

// Also export the raw sqlite instance for advanced queries
export { sqlite }
