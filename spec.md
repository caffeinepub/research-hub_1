# Research Hub

## Current State
- Full-featured research platform with Articles, Images, Audio, Videos, Films, GIFs/Memes, Discover, Browser, Community Chat, and Profile tabs
- BrowserPage uses an iframe to load URLs; works for open-access sites but blocked by many major sites
- Bottom nav has: Search, Discover, Browser, Chat (Community Chats), Profile
- No AI Research Chat component exists yet
- Community Chat page exists (CommunityChatsPage.tsx)
- Chat nav item currently routes to CommunityChatsPage

## Requested Changes (Diff)

### Add
- New `AIChatPage` component: conversational research assistant UI
  - Chat input bar at bottom
  - Messages list showing user questions and AI responses
  - AI responses show curated results from all databases (articles, images, videos, audio) fetched using the existing `useResearch` hook
  - Each response includes a text summary + result cards (articles, images, etc.)
  - Suggested follow-up topic chips after each response
  - Bot avatar / user avatar differentiation
- New bottom nav item "AI" (replacing or alongside Chat) using a Sparkles/Bot icon
- Browser improvements:
  - When a site blocks embedding, show a clear error/fallback UI with "Open in New Tab" button
  - Add a search engine selector (DuckDuckGo, Wikipedia, Archive.org)
  - Search bar in browser is also connected: typing a query in browser searches via DuckDuckGo in the iframe

### Modify
- `App.tsx`: add `ai` as a NavKey, add AIChatPage view rendering, update BottomNav to include AI tab
- `BrowserPage.tsx`: add iframe error detection (onError), show fallback card when sites block embedding
- Bottom nav: replace or relabel Chat to show both Community and AI options, or add 6th item

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/components/AIChatPage.tsx` — full conversational AI research assistant
2. Update `App.tsx` — add `ai` NavKey, render AIChatPage, add AI to BottomNav
3. Update `BrowserPage.tsx` — add iframe load error fallback UI with open-in-new-tab, add quick search engine shortcuts
