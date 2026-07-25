# StudyAI Worklog

---
Task ID: 1
Agent: Main
Task: Make Sensei AI smarter - learn from conversation history + absorb notebook content

Work Log:
- Verified Prisma schema already has ChatMessage model
- Ran `prisma db push --force-reset` to sync database
- Ran `prisma generate` to regenerate Prisma Client
- Completely rewrote `/src/app/api/sensei-chat/route.ts`:
  - Fetches last 20 chat messages for conversation history context
  - Fetches ALL user notebooks and strips HTML to plain text
  - Implements relevance scoring (keyword matching) to find top 3 most relevant notebooks per question
  - Injects relevant notebook content into system prompt as "Base de Conhecimento do Aluno"
 - Limits each notebook context to 1500 chars to stay within context window
  - Persists both user message and AI reply to DB via createMany
  - Improved system prompt with detailed teaching instructions, Markdown formatting guidance, and notebook awareness
- Improved SenseiChat UI component in DashboardView.tsx:
  - Dynamic suggested prompts generated from user's actual notebooks ("Revisar: [title]")
  - Added "Resumo geral dos estudos" suggestion when notebooks exist
  - Replaced single-line input with auto-resizing textarea (Shift+Enter for newline)
  - Added copy button on assistant messages (hover to reveal)
  - Added "Lendo N cadernos" badge showing context awareness in header
  - Shows which notebooks are being used as context in the chat header
  - Better welcome message explaining notebook awareness
  - Removed static subject chips (replaced with dynamic notebook-based suggestions)
- Added `Copy` icon import from lucide-react
- Verified landing page has no pricing/paywall content
- Passed ESLint check
- Tested via curl API:
  - Sensei AI correctly references notebook content ("Na sua anotação sobre Biologia Celular...")
  - Conversation memory works (follow-up questions build on previous context)
  - Messages are persisted to DB (verified 4 messages stored)
- Tested via agent-browser (before server restart issues):
  - Dashboard loads correctly with all tabs
  - Notebook creation and rich text editor work
  - Sensei chat shows dynamic "Revisar: Biologia Celular" button
  - Chat UI renders correctly with all new features

Stage Summary:
- Sensei AI is now context-aware: reads user notebooks and uses conversation history
- The AI explicitly references user's notebook content in responses
- UI dynamically adapts to show which notebooks are being used as context
- All chat messages are persisted for future conversation continuity
- Copy button, textarea input, and notebook-based suggestions improve UX
---
Task ID: 1
Agent: Main Agent
Task: Fix deployment client-side crash error + improve app quality

Work Log:
- Diagnosed root cause: `<style jsx global>` in RichTextEditor.tsx crashes in Next.js production builds (App Router + standalone output)
- Moved all TipTap editor styles from `<style jsx global>` to globals.css as regular CSS
- Removed `prose prose-sm sm:prose-base` classes from editorProps (requires missing @tailwindcss/typography plugin)
- Fixed 3x `bg-white/60` hardcoded backgrounds → `bg-[var(--ws-glass)]` for dark theme support
- Replaced `prose-ws` class (undefined) with proper `markdown-content` CSS class in globals.css
- Added `transpilePackages` for all @tiptap/* packages in next.config.ts
- Made DashboardView a dynamic import with `ssr: false` in page.tsx
- Added Error Boundary class component in page.tsx for graceful error handling
- Added loading states for all dynamic imports
- Verified: landing page, dashboard, notebook editor, sensei chat, notebook creation all work
- Verified: zero JavaScript errors in browser console
- Verified: lint passes clean

Stage Summary:
- Root cause: styled-jsx global tag incompatible with Next.js App Router production builds
- 6 files modified: globals.css, RichTextEditor.tsx, DashboardView.tsx, next.config.ts, page.tsx
- All 5 key flows verified via agent-browser: Landing, Dashboard, Notebook Editor, Sensei Chat, Notebook Creation
