---
Task ID: 1
Agent: main
Task: Make the app downloadable (PWA - Progressive Web App)

Work Log:
- Investigated existing PWA infrastructure: manifest.json, sw.js, PWAInstallPrompt.tsx, useServiceWorker.ts, Providers.tsx all existed
- Found that the `public/icons/` directory was missing — no icon files at all
- Generated 8 icon sizes (72, 96, 128, 144, 152, 192, 384, 512) from studyai-logo.png using Sharp
- Generated apple-touch-icon.png (180x180) and favicon.ico (32x32)
- Updated service worker (v1 → v2) to use `Promise.allSettled` for graceful precache failures
- Enhanced PWAInstallPrompt component with iOS Safari support (step-by-step instructions)
- Created `PWAInstallButton` export — compact "Baixar App" button for sidebar
- Added PWAInstallButton to Sidebar footer section
- Fixed all ESLint `react-hooks/set-state-in-effect` errors using `useMemo` patterns
- Verified via agent-browser: manifest valid, all meta tags present, SW registered & activated, icons load correctly

Stage Summary:
- PWA is fully functional: manifest.json + 8 icon sizes + service worker v2 + install prompt + iOS fallback
- Users on Chrome/Edge/Android: automatic install banner after 3s + "Baixar App" button in sidebar
- Users on iOS Safari: manual instructions (Compartilhar → Adicionar à Tela de Início) after 5s + sidebar button
- Sidebar has a persistent "Baixar App" button that hides once installed
- All changes pass ESLint with zero errors

---
Task ID: 2
Agent: main
Task: Fix 4 bugs — Missions creation, Discover creation, Discover AI generate, Progress/Achievements

Work Log:
- **Bug 1 (Missions Creation Fails)**: Frontend sends `{subject, topic, timeAvailable}` but API expected `generateWithAI` flag and manual creation path required `title`+`steps`
  - Added `topic` TEXT column migration to Mission table in `src/lib/db.ts`
  - Rewrote `src/app/api/missions/route.ts` POST: detects `{subject, topic, timeAvailable}` as implicit AI generation
  - AI prompt generates rich step objects with `{id, title, emoji, durationMinutes, completed, description}` in Portuguese
  - POST response returns mission in frontend-expected format (with `totalTimeMinutes`, `currentMastery`, `targetMastery`, `steps[]`, etc.)
  - GET handler transforms DB fields to frontend-expected: `startMastery`→`currentMastery`, `endMastery`→`targetMastery`, `estimatedMinutes`→`totalTimeMinutes`, parses `steps` JSON string

- **Bug 2 & 3 (Discover Creation & AI Generate Fails)**: API inserts `summary`, `subject`, `difficulty`, `duration`, `emoji` but these columns don't exist
  - Added 5 column migrations to DiscoverItem table: `summary` TEXT, `subject` TEXT, `difficulty` TEXT DEFAULT 'medio', `duration` INTEGER, `emoji` TEXT DEFAULT '💡'

- **Bug 4 (Progress/Achievements not working)**: Achievements API references `a.key` and `a.title` but these columns don't exist
  - Added 2 column migrations to Achievement table: `key` TEXT DEFAULT '', `title` TEXT DEFAULT ''

Stage Summary:
- All 4 bugs fixed with zero ESLint errors
- 8 new migration ALTER TABLE statements added to `ensureSchema()` in `src/lib/db.ts`
- `src/app/api/missions/route.ts` fully rewritten — POST auto-detects AI generation from frontend format, GET maps DB fields to frontend interface

---
Task ID: 2
Agent: main
Task: Fix 4 bugs - Missions creation, Discover generation, Discover columns, Progress/Achievements

Work Log:
- Investigated all 4 reported issues
- **Bug 1 - Missions**: Frontend sends `{subject, topic, timeAvailable}` but API expected `{generateWithAI: true, title, steps}`. Also DB Mission table lacked `topic` column, and API response format didn't match frontend Mission interface.
  - Fix: Added `topic` column migration to Mission table
  - Rewrote POST handler to detect `{subject, topic, timeAvailable}` as implicit AI generation
  - AI prompt now generates rich step objects with `{id, title, emoji, durationMinutes, completed, description}`
  - GET handler now parses steps JSON and maps DB fields to frontend-expected names
- **Bug 2 - Discover creation**: API tried to insert `summary`, `subject`, `difficulty`, `duration`, `emoji` into DiscoverItem table which lacked those columns
  - Fix: Added 5 ALTER TABLE migrations for DiscoverItem
- **Bug 3 - Discover 'ajuste'**: Same root cause as Bug 2
  - Fix: Same migrations fix this
- **Bug 4 - Progress**: Achievements API referenced `a.key` and `a.title` which don't exist in Achievement table (only has `name`)
  - Fix: Added `key` and `title` column migrations to Achievement table

Stage Summary:
- All 4 bugs fixed with 8 new column migrations in db.ts
- Missions API completely rewritten (POST + GET)
- ESLint passes clean
- Changes: `src/lib/db.ts`, `src/app/api/missions/route.ts`
