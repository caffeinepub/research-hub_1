# Research Hub

## Current State
- Browser tab uses DuckDuckGo as default search and starts on an empty page
- Settings save button exists but is not working reliably
- AI Credits system is partially implemented
- Community Archive.org domain submission exists in Settings but needs wiring to display in search tabs
- Comics tab exists but search returns no results
- Archive.org content not reliably appearing in Videos, Audio, and Films tabs

## Requested Changes (Diff)

### Add
- AI Credits: daily limit for regular users (10 searches/day), unlimited for admin; credits earned via daily login, install, community participation; credits displayed on profile
- Community Archive.org domain submission: users can submit new collection IDs from Settings, visible to all tabs; admin can remove them

### Modify
- BrowserPage: Replace DuckDuckGo with Brave Search (`https://search.brave.com/search?q=`); start page should load `https://brave.com` by default when the tab is first opened; default address bar shows brave.com
- SettingsPage: Fix the save button so it properly saves all settings to localStorage and shows feedback
- ComicsTab: Fix Archive.org query to return real results (use correct API endpoint and collection IDs)
- AudioTab, VideosTab, FilmsTab: Fix Archive.org fetches to reliably return results (correct API params, error handling, sort by downloads)

### Remove
- Nothing removed

## Implementation Plan
1. BrowserPage: Change `resolveInput` default search to use `https://search.brave.com/search?q=`, replace DuckDuckGo quick engine with Brave, set initial `currentUrl` and `addressInput` to `https://brave.com` so it loads on mount
2. SettingsPage: Audit `handleSave` — ensure all state variables (theme, defaultTab, textSize, and new credits-related fields) are persisted; fix any ordering/closure issues; ensure button is always enabled
3. ComicsTab: Fix Archive.org search URL to use `https://archive.org/advancedsearch.php?q=subject:(comics)+AND+(collection:digitalcomicmuseum OR collection:comics_inbox)&fl[]=identifier,title,description,mediatype&rows=50&output=json`
4. AudioTab: Fix fetch to use `https://archive.org/advancedsearch.php?q=${query}&mediatype=audio&rows=50&output=json` and map results correctly
5. VideosTab/FilmsTab: Fix Archive.org video fetch with correct mediatype param and result mapping
6. AI Credits: implement `getCreditsBalance`, `useAICredit`, `claimDailyLogin`, `claimInstallReward` helpers in a shared `credits.ts` util; hook into AIChatPage to enforce daily limits; show remaining credits in AIChatPage header
