# Research Hub

## Current State
- AIChatPage.tsx: fetches all sources in parallel then renders all at once; input bar overlaps bottom nav causing scroll cutoff
- MemesTab.tsx: has Load More button but no infinite scroll; Giphy/Tenor return limited results
- ImagesTab.tsx: has Load More button but no infinite scroll; limited results per source
- VideosTab.tsx: fetches fixed small page sizes from Archive.org and other sources; Archive.org embed URLs may not be correct format for playback
- All tabs: fetch logic is inline in each component

## Requested Changes (Diff)

### Add
- Infinite scroll to GIFs/Memes tab (IntersectionObserver at bottom sentinel, auto-fetch next page)
- Infinite scroll to Images tab (same pattern)
- Infinite scroll to Videos tab with much higher result counts per page
- Streaming/progressive result rendering in AIChatPage (show each source's results as they arrive, not all at once)
- Archive.org video playback fix: use correct embed URL format `https://archive.org/embed/{identifier}` with proper iframe allow attributes

### Modify
- AIChatPage: fix input bar positioning so it is always visible and reachable (sticky bottom, proper padding above nav bar); render results progressively as each fetch resolves
- MemesTab: replace Load More button with IntersectionObserver infinite scroll; increase page size to 50 per source; bump Giphy/Tenor limits
- ImagesTab: replace Load More button with IntersectionObserver infinite scroll; increase page size and result counts
- VideosTab: increase Archive.org rows param to 50+, add infinite scroll, fix embed URL to use `https://archive.org/embed/{identifier}` format
- All Archive.org video/audio embeds: ensure iframe sandbox allows scripts and same-origin, add `allowfullscreen`

### Remove
- Load More buttons in MemesTab and ImagesTab (replaced by infinite scroll)

## Implementation Plan
1. Fix AIChatPage: sticky input bar above nav (pb-20 or similar), progressive rendering using Promise-based streaming (render each resolved promise immediately)
2. Fix VideosTab: increase Archive.org fetch rows to 50, fix embed URL format to `https://archive.org/embed/{identifier}`, add infinite scroll sentinel
3. Fix ImagesTab: add IntersectionObserver infinite scroll, remove Load More button, increase per-source limits
4. Fix MemesTab: add IntersectionObserver infinite scroll, remove Load More button, increase Giphy/Tenor/Imgflip limits
5. Ensure all Archive.org iframes have correct sandbox and allow attributes for playback
