---
Task ID: 1
Agent: Main Orchestrator
Task: Fix all lint errors and implement 5 major improvements

Work Log:
- Fixed sensei-chat/route.ts: unterminated string literal (multi-line string in single quotes)
- Fixed RichTextEditor.tsx: moved ToolbarBtn and Divider components outside render function
- Fixed DashboardView.tsx: added missing Send import from lucide-react
- Fixed DashboardView.tsx: removed synchronous setLoading(true) calls inside useEffect
- Created /api/generate-flashcards/route.ts: AI flashcard generation endpoint
- Improved /api/sensei-chat/route.ts: added conversation context (last 10 messages), markdown responses
- Improved /api/stats/route.ts: added dailyData, streak, todayMinutes, chatCount, masteredCards
- Rewrote AuthModal.tsx: removed plan selection step, direct register with SENSEI plan
- Rewrote DashboardView.tsx (655->1291 lines) with all 5 improvements
- Removed PricingSection from landing page
- Removed "Precos" link from HeaderZen nav
- Removed "Precos" from FooterZen footer links

Stage Summary:
- All 30 lint errors fixed, now 0 errors
- Server running on port 3000, responding 200
- Landing page verified via agent-browser
- 5 major improvements implemented:
  1. Rich text editor (Tiptap already installed, fixed lint issues)
  2. Plan restrictions removed (AuthModal, landing page, nav)
  3. Flashcards improved (AI generation, search, SM-2 badges, due dates)
  4. Sensei AI chat improved (markdown rendering, subject chips, clear chat, categories)
  5. Dashboard improved (weekly chart, streak, time-based greeting, better stats)
