# Research Hub

## Current State
Research Hub is a multi-tab research platform with Articles, Images, Videos, Films, Audio, Discover, AI Chat, GIFs & Memes, Browser, Dictionary, Study, Community, and Profile sections. The app has a dark theme (dark navy backgrounds).

Known issues:
- Input/textarea text is nearly invisible (dark color on dark background) in AI Chat, Community chat, Homework Help, Dictionary, and Memes search bar
- Bottom nav has 8 items crammed in a fixed-width row — items are too small and no scrolling
- GIF/Memes tab search doesn't visually update when user types a new term — keeps showing initial load results; Archive images missing from results
- No Comics/Books section for reading public domain comics
- Homework Help gives generic "here are resources" responses instead of truly explaining concepts

## Requested Changes (Diff)

### Add
- Comics tab in bottom nav: browse and read public domain comics from Archive.org (comics collection), Digital Comic Museum, Comic Book Plus, and Marvel/DC public domain
- Comics reader: click a comic to open an inline reader with page-by-page navigation
- Comics search bar: search by title, character, publisher, era

### Modify
- **Input text colors**: All Input and Textarea components used in the app need explicit white/light text color (oklch ~0.95) so typed text is visible on dark backgrounds — affects AIChatPage (input at bottom), CommunityChatsPage (textarea), HomeworkHelpPage (textarea), DictionaryTab (input), MemesTab (input)
- **Bottom nav**: Change from `flex items-stretch h-16` fixed row to `overflow-x-auto` scrollable row with `flex-shrink-0` on each button, so all 8 nav items are accessible by swiping
- **GIF search**: Fix so that submitting a new search term clears old results and shows new ones. Add better fallback: if Giphy/Tenor return empty, fall back to Archive.org image search for the term. Improve Archive image URL construction.
- **Homework Help / Study**: Make it act more like a real study partner — for math show step-by-step working, for other subjects give a real explanation paragraph before showing resources, use encouraging tone, break down answers clearly

### Remove
- Nothing

## Implementation Plan
1. Fix all input/textarea text colors to `color: "oklch(0.95 0.02 240)"` in AIChatPage, CommunityChatsPage, HomeworkHelpPage, DictionaryTab, MemesTab
2. Make bottom nav scrollable: wrap nav items in `overflow-x-auto` div, add `flex-shrink-0` to each button, use `min-w-[60px]` per item
3. Fix GIF search: ensure `doSearch` clears `allItems` before setting new results; fix Archive image URLs to use `https://archive.org/services/img/${identifier}`; add direct image search fallback from Openverse
4. Fix Homework Help: expand `buildAssistantText` to return real subject explanations with bullet points; for science/history/english/writing give a 3-4 sentence explanation before resources
5. Add ComicsTab component: fetch from Archive.org comics collection (`collection:comics` or `collection:digitalcomicmuseum`), display covers in grid, click opens inline comic reader using Archive.org embed or page images
6. Add Comics nav item to bottom nav (BookImage icon, label "Comics")
7. Wire ComicsTab into App.tsx view routing
