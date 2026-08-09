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
    // Already a valid SQLite URL — ensure directory exists
    const filePath = url.replace('file:', '')
    const dir = join(process.cwd(), filePath.substring(0, filePath.lastIndexOf('/')) || 'db')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    return url
  }

  // URL is NOT file: (e.g. postgresql:// on Vercel)
  // Override to use SQLite so the generated client works
  const fallbackPath = process.env.NODE_ENV === 'production'
    ? '/tmp/studyai.db'     // Vercel writable directory
    : join(process.cwd(), 'db', 'custom.db')  // local dev

  const dir = join(fallbackPath, '..')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  console.warn(
    `[db] DATABASE_URL is "${url.substring(0, 30)}..." but Prisma schema uses SQLite. ` +
    `Falling back to file:${fallbackPath}`
  )

  return `file:${fallbackPath}`
}

// Override DATABASE_URL at module load time so all Prisma calls use it
const effectiveDbUrl = getNormalizedDbUrl()
process.env.DATABASE_URL = effectiveDbUrl

// ═══════════════════════════════════════════════════════════════
// PRISMA CLIENT (singleton)
// ═══════════════════════════════════════════════════════════════

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}