---
Task ID: 1
Agent: main
Task: Improve canvas editor text typing to work like Canva on PC

Work Log:
- Read existing CanvasEditor.tsx - found it used FabricText with basic click-to-create + requestAnimationFrame for enterEditing
- Created TextFormattingBar.tsx component with Canva-like floating toolbar (font family, font size, bold/italic/underline/strikethrough, text alignment, line height, text color)
- Rewrote CanvasEditor.tsx: replaced FabricText with Textbox (fabric.js v7) for proper word-wrapping and inline editing
- Added text formatting state (TextFormat) that syncs with active text objects
- Added floating TextFormattingBar that appears above selected text objects
- Text creation now uses setTimeout(50ms) for reliable focus + explicitly focuses fabric's hidden textarea
- Auto-switches back to select tool after creating text (Canva behavior)
- Added keyboard shortcuts: Ctrl+B/I/U inside text editing, Enter to edit selected text, Escape to exit, Delete to remove
- Added empty text cleanup (removes textbox if user exits without typing)
- Removed duplicate "Adicionar texto" button from EditorToolbar
- Fixed all lint errors (moved ToggleBtn outside render, removed unused effect)
- Verified: lint passes clean, page compiles 200, no runtime errors, Textbox import verified

Stage Summary:
- Text tool now works like Canva: click to place text box, immediately type with keyboard on PC
- Floating formatting bar appears when text is selected (font, size, bold, italic, underline, strikethrough, alignment, line height, color)
- Double-click existing text to edit it
- Keyboard shortcuts for formatting (Ctrl+B/I/U) work while editing
- Empty text boxes are auto-cleaned
