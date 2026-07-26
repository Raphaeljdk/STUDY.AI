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

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
