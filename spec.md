# Research Hub

## Current State
A comprehensive research platform with tabs for Articles, Images, Videos, Films, Audio, GIFs/Memes, Comics, Archive.org, News, Datasets, Tools, AI Chat, Community, Messages, Profile, Settings, Admin. The app is live but has several persistent bugs.

## Requested Changes (Diff)

### Add
- Followers/following list on ProfilePage (visible on own profile and others')
- More news sources: AP News RSS, NPR, BBC, Reuters RSS, Science Daily, Ars Technica feeds
- AI Chat: smarter conversational replies with context-aware follow-up suggestions

### Modify
- **ArchiveTab**: Fix fetch to use JSONP-compatible URL or add `&callback=` workaround; ensure initial load always shows results; add better error display when blocked
- **ComicsTab**: The archive.org advancedsearch fetch may silently fail; add explicit console logs and ensure the initial auto-load fires correctly; fix `doSearch` not resetting properly
- **MemesTab**: Reddit fetch may fail CORS -- add fallback, ensure search re-fires on every new query (fix the debounce not resetting allItems before new results arrive causing stale display)
- **ProfilePage**: Add a Following/Followers section showing localStorage-stored friends list with clickable entries that navigate to their profiles
- **NewsTab**: Replace or supplement existing news fetches with more reliable open RSS/JSON sources: HackerNews (already working), plus Wikipedia current events, Wikimedia current events, ArXiv recent, NPR JSON API, and more
- **AIChatPage**: Improve AI responses -- when a Wikipedia summary is available, use it to give a direct answer; add follow-up suggestion chips after each answer; make the study mode more conversational

### Remove
- Nothing

## Implementation Plan

**Half 1 (this build):**
1. Fix ArchiveTab: use a proxy-friendly URL format and ensure initial load always fires, add retry logic
2. Fix ComicsTab: ensure `hasLoaded` ref doesn't block re-fetches, fix empty results bug
3. Fix MemesTab: ensure every new search clears stale results immediately before async fetch, fix debounce conflict with manual submit
4. Fix ProfilePage: add Friends/Following section with avatars and message buttons
5. Improve NewsTab: add AP News (via allorigins CORS proxy), NPR, more Guardian sections, BBC RSS via allorigins
6. Improve AIChatPage: smarter conversational replies, follow-up chips, better study mode responses
