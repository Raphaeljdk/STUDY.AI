import { PrismaClient } from '@prisma/client'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { execSync } from 'child_process'

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
// AUTO SCHEMA PUSH (creates tables if database is empty)
// ═══════════════════════════════════════════════════════════════

let schemaPushed = false

function ensureSchema(): void {
  if (schemaPushed) return
  try {
    execSync('npx prisma db push --accept-data-loss --skip-generate 2>&1', {
      stdio: 'pipe',
      timeout: 30000,
      cwd: process.cwd(),
    })
    schemaPushed = true
    console.log('[db] Schema ensured via prisma db push')
  } catch (err: any) {
    // Log but don't crash — the tables might already exist
    const msg = err?.stdout?.toString() || err?.message || String(err)
    console.warn('[db] prisma db push note:', msg.substring(0, 200))
    schemaPushed = true // Don't retry
  }
}

// ═══════════════════════════════════════════════════════════════
// PRISMA CLIENT (singleton)
// ═══════════════════════════════════════════════════════════════

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

ensureSchema()

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
