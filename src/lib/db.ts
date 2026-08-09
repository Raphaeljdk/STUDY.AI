import { PrismaClient } from '@prisma/client'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

// Ensure the db directory exists (for SQLite local dev)
if (process.env.DATABASE_URL?.startsWith('file:')) {
  const dbDir = join(process.cwd(), 'db')
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Create the Prisma client with error handling.
 * If the DATABASE_URL is missing or the client cannot be instantiated
 * (e.g. protocol mismatch on Vercel), we log the error but still
 * export the client so that TypeScript types work across the codebase.
 *
 * Individual API routes should wrap DB calls in try/catch to handle
 * runtime connection failures gracefully.
 */
function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    console.warn(
      '[db] DATABASE_URL is not set. Database features will not work. ' +
      'Set DATABASE_URL in your .env file.'
    )
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

let _prisma: PrismaClient

try {
  _prisma = globalForPrisma.prisma ?? createPrismaClient()
} catch (err) {
  console.error('[db] Failed to initialise PrismaClient:', err)
  // Re-throw so the build fails loudly rather than silently degrading
  throw err
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = _prisma
}

export const db = _prisma
