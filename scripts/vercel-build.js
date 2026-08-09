/**
 * vercel-build.js
 *
 * Dual-schema Prisma build script.
 * On Vercel, DATABASE_URL may point to PostgreSQL, but the repo ships
 * an SQLite schema. This script detects the target DB and swaps the
 * schema before running `prisma generate`.
 *
 * Vercel calls this via the "vercel-build" npm script.
 */

const { execSync } = require('child_process');
const { readFileSync, writeFileSync, copyFileSync } = require('fs');
const { resolve } = require('path');

const dbUrl = process.env.DATABASE_URL || '';
const schemaPath = resolve(__dirname, '../prisma/schema.prisma');
const pgSchemaPath = resolve(__dirname, '../prisma/schema.postgresql.prisma');

const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

if (isPostgres) {
  console.log('[vercel-build] PostgreSQL DATABASE_URL detected – swapping schema');

  // Backup the SQLite schema
  copyFileSync(schemaPath, resolve(__dirname, '../prisma/schema.sqlite.prisma.bak'));

  // Overwrite schema.prisma with the PostgreSQL version
  copyFileSync(pgSchemaPath, schemaPath);

  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('[vercel-build] Prisma generate (PostgreSQL) succeeded');
  } finally {
    // Restore the original SQLite schema so the repo stays clean
    copyFileSync(
      resolve(__dirname, '../prisma/schema.sqlite.prisma.bak'),
      schemaPath
    );
    // Clean up backup
    try {
      require('fs').unlinkSync(resolve(__dirname, '../prisma/schema.sqlite.prisma.bak'));
    } catch {
      // ignore cleanup errors
    }
    console.log('[vercel-build] Original SQLite schema restored');
  }
} else {
  console.log('[vercel-build] SQLite DATABASE_URL detected – generating normally');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('[vercel-build] Prisma generate (SQLite) succeeded');
}
