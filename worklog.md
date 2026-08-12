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
