import { PrismaClient } from '@prisma/client'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

// ═══════════════════════════════════════════════════════════════
// DATABASE URL NORMALIZATION
// The Prisma schema uses provider="sqlite", so the URL MUST
// start with "file:". If the env var points to PostgreSQL
// (e.g. on Vercel), we override it to use a local SQLite file.
// ═══════════════════════════════════════════════════════════════

function getNormalizedDbUrl(): string {
  const url = process.env.DATABASE_URL || ''

  if (url.startsWith('file:')) {
    const filePath = url.replace('file:', '')
    const dir = join(process.cwd(), filePath.substring(0, filePath.lastIndexOf('/')) || 'db')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    return url
  }

  const fallbackPath = process.env.NODE_ENV === 'production'
    ? '/tmp/studyai.db'
    : join(process.cwd(), 'db', 'custom.db')

  const dir = join(fallbackPath, '..')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  console.warn(
    `[db] DATABASE_URL is not file:. Falling back to file:${fallbackPath}`
  )

  return `file:${fallbackPath}`
}

const effectiveDbUrl = getNormalizedDbUrl()
process.env.DATABASE_URL = effectiveDbUrl

// ═══════════════════════════════════════════════════════════════
// RAW SQL SCHEMA — All CREATE TABLE IF NOT EXISTS statements
// This is the single source of truth for runtime table creation.
// Works everywhere (local dev, Vercel serverless) without Prisma CLI.
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

CREATE TRIGGER IF NOT EXISTS "User_updatedAt"
  AFTER UPDATE ON "User"
  FOR EACH ROW
  BEGIN
    UPDATE "User" SET "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE "id" = OLD."id";
  END;

CREATE TRIGGER IF NOT EXISTS "Subject_updatedAt"
  AFTER UPDATE ON "Subject"
  FOR EACH ROW
  BEGIN
    UPDATE "Subject" SET "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE "id" = OLD."id";
  END;

CREATE TRIGGER IF NOT EXISTS "Topic_updatedAt"
  AFTER UPDATE ON "Topic"
  FOR EACH ROW
  BEGIN
    UPDATE "Topic" SET "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE "id" = OLD."id";
  END;

CREATE TRIGGER IF NOT EXISTS "Task_updatedAt"
  AFTER UPDATE ON "Task"
  FOR EACH ROW
  BEGIN
    UPDATE "Task" SET "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE "id" = OLD."id";
  END;

CREATE TRIGGER IF NOT EXISTS "Goal_updatedAt"
  AFTER UPDATE ON "Goal"
  FOR EACH ROW
  BEGIN
    UPDATE "Goal" SET "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE "id" = OLD."id";
  END;

CREATE TRIGGER IF NOT EXISTS "CalendarEvent_updatedAt"
  AFTER UPDATE ON "CalendarEvent"
  FOR EACH ROW
  BEGIN
    UPDATE "CalendarEvent" SET "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE "id" = OLD."id";
  END;

CREATE TRIGGER IF NOT EXISTS "Notebook_updatedAt"
  AFTER UPDATE ON "Notebook"
  FOR EACH ROW
  BEGIN
    UPDATE "Notebook" SET "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE "id" = OLD."id";
  END;

CREATE TRIGGER IF NOT EXISTS "NotebookPage_updatedAt"
  AFTER UPDATE ON "NotebookPage"
  FOR EACH ROW
  BEGIN
    UPDATE "NotebookPage" SET "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE "id" = OLD."id";
  END;

CREATE TRIGGER IF NOT EXISTS "Flashcard_updatedAt"
  AFTER UPDATE ON "Flashcard"
  FOR EACH ROW
  BEGIN
    UPDATE "Flashcard" SET "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE "id" = OLD."id";
  END;

CREATE TRIGGER IF NOT EXISTS "UserMemory_updatedAt"
  AFTER UPDATE ON "UserMemory"
  FOR EACH ROW
  BEGIN
    UPDATE "UserMemory" SET "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE "id" = OLD."id";
  END;

CREATE TRIGGER IF NOT EXISTS "DiscoverItem_updatedAt"
  AFTER UPDATE ON "DiscoverItem"
  FOR EACH ROW
  BEGIN
    UPDATE "DiscoverItem" SET "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE "id" = OLD."id";
  END;

CREATE TRIGGER IF NOT EXISTS "Mission_updatedAt"
  AFTER UPDATE ON "Mission"
  FOR EACH ROW
  BEGIN
    UPDATE "Mission" SET "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE "id" = OLD."id";
  END;

CREATE TRIGGER IF NOT EXISTS "Roadmap_updatedAt"
  AFTER UPDATE ON "Roadmap"
  FOR EACH ROW
  BEGIN
    UPDATE "Roadmap" SET "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE "id" = OLD."id";
  END;
`

// ═══════════════════════════════════════════════════════════════
// AUTO TABLE CREATION
// Uses Prisma client extension ($extends) to ensure all tables
// exist before the FIRST query. Subsequent queries are zero-cost.
// ═══════════════════════════════════════════════════════════════

let _tablesReady = false
let _tablesPromise: Promise<void> | null = null
let _isCreatingTables = false

async function createTables(baseClient: PrismaClient): Promise<void> {
  const statements = SCHEMA_SQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  for (const sql of statements) {
    try {
      await baseClient.$executeRawUnsafe(sql)
    } catch (err: any) {
      // Log but continue — IF NOT EXISTS means most should be fine
      console.warn('[db] Table creation note:', err?.message?.substring(0, 100))
    }
  }

  console.log('[db] All tables ensured via raw SQL')
}

function ensureTables(baseClient: PrismaClient): Promise<void> {
  if (_tablesReady) return Promise.resolve()
  if (_isCreatingTables) return Promise.resolve()
  if (_tablesPromise) return _tablesPromise

  _isCreatingTables = true
  _tablesPromise = createTables(baseClient)
    .then(() => {
      _tablesReady = true
      _isCreatingTables = false
    })
    .catch((err) => {
      _isCreatingTables = false
      _tablesPromise = null // Allow retry on next query
      console.error('[db] Failed to create tables:', err)
    })

  return _tablesPromise
}

// ═══════════════════════════════════════════════════════════════
// PRISMA CLIENT (singleton with auto-table-creation via $extends)
// ═══════════════════════════════════════════════════════════════

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Base client (no extensions) — used for raw table creation
const _baseClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = _baseClient
}

// Extended client: auto-ensures tables before every Prisma query.
// The $extends query hook intercepts all model queries.
// Raw SQL in createTables() uses _baseClient directly (no hook).
//
// CRITICAL FIX: Prisma v6 + SQLite generates numeric millisecond timestamps
// (e.g. "1786364295199") for @default(now()) / @updatedAt instead of
// ISO 8601 strings, causing P2023. We inject ISO strings explicitly
// in create/update operations so Prisma never auto-generates them.

function convertDatesToISO(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (obj instanceof Date) return obj.toISOString()
  if (Array.isArray(obj)) return obj.map(convertDatesToISO)
  if (typeof obj === 'object') {
    const result: any = {}
    for (const key of Object.keys(obj)) {
      result[key] = convertDatesToISO(obj[key])
    }
    return result
  }
  return obj
}

const db = _baseClient.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query, operation }) {
        await ensureTables(_baseClient)

        const nowISO = new Date().toISOString()

        // --- INJECT ISO TIMESTAMPS FOR WRITE OPERATIONS ---

        // create: { data: { ... } }
        if (operation === 'create' && args.data) {
          if (!args.data.createdAt) args.data.createdAt = nowISO
          if (!args.data.updatedAt && 'updatedAt' in args.data === false) args.data.updatedAt = nowISO
        }

        // createMany: { data: [ { ... }, { ... } ] }
        if (operation === 'createMany' && Array.isArray(args.data)) {
          for (const item of args.data) {
            if (!item.createdAt) item.createdAt = nowISO
            if (!item.updatedAt && 'updatedAt' in item === false) item.updatedAt = nowISO
          }
        }

        // update / updateMany: { data: { ... } }
        if (operation === 'update' || operation === 'updateMany') {
          if (args.data) {
            args.data.updatedAt = nowISO
          }
        }

        // upsert: { create: { ... }, update: { ... } }
        if (operation === 'upsert') {
          if (args.create) {
            if (!args.create.createdAt) args.create.createdAt = nowISO
            if (!args.create.updatedAt && 'updatedAt' in args.create === false) args.create.updatedAt = nowISO
          }
          if (args.update) {
            args.update.updatedAt = nowISO
          }
        }

        // --- CONVERT ANY REMAINING Date OBJECTS TO ISO STRINGS ---
        args = convertDatesToISO(args)

        return query(args)
      },
    },
  },
})

export { db }
