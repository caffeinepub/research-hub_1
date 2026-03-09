# Research Hub

## Current State
Full research platform with articles, images, and video tabs. Videos currently pull from: Wikimedia Commons, Internet Archive, NASA, Prelinger Archives, British Pathé, C-SPAN Archive, Library of Congress, DPLA, European Film Gateway (via Europeana API), and Wikimedia Commons videos. The European Film Gateway source embeds `edmIsShownAt` (an external webpage URL) as the iframe `embedUrl`, which fails to play because most institutional sites block iframes. No "banned from YouTube" section exists.

## Requested Changes (Diff)

### Add
- `fetchYouTubeArchivedVideos`: searches Internet Archive `collection:youtube` — surfaces videos preserved from YouTube (removed/banned content hosted on IA)
- Additional IA collections: `collection:feature_films`, `collection:opensource_movies` for broader public domain movie coverage
- "Preserved from YouTube" labeled section at the top of the Videos tab whenever results are found for the current query
- New source badge color for "YouTube (Archived)" source

### Modify
- `fetchEuropeanFilmGateway`: switch from `edmIsShownAt` (webpage) to `edmIsShownBy` (direct media file URL) as the video `url`; only set `embedUrl` if the URL ends in a video extension or contains a known embeddable player domain; otherwise fall back to showing thumbnail + title-only card with no broken player
- `VideosTab`: render a distinct "Preserved from YouTube" subsection above the main grid when any results from that source are present; add source color for `YouTube (Archived)`

### Remove
- Nothing removed

## Implementation Plan
1. Fix `fetchEuropeanFilmGateway` in `useResearch.ts` — use `edmIsShownBy` field for media URL; remove `embedUrl` assignment for non-embeddable URLs
2. Add `fetchYouTubeArchivedVideos` function — queries `collection:youtube` on Archive.org
3. Add `fetchArchiveFeatureFilms` function — queries `collection:feature_films` on Archive.org  
4. Add `fetchArchiveOpenSourceMovies` function — queries `collection:opensource_movies`
5. Wire all new fetchers into the parallel `Promise.allSettled` block and merge results
6. Update `VideosTab.tsx` — add `YouTube (Archived)` badge color, render a "Preserved from YouTube" section at top of results when those videos are present
