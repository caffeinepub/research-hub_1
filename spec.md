# Research Hub

## Current State
Version 28 is live with 28 tabs/features. Key relevant files:
- `fetchVideos.ts` — `fetchEuropeanFilmGateway` uses Europeana API, sets `embedUrl` only for `.mp4/webm/ogg` or `player` URLs, otherwise uses page URL in `<video>` tag which fails
- `fetchImages.ts` — `fetchDeviantArtImages` uses openverse source=deviantart; no Reddit image source exists for the Images tab
- `fetchAudio.ts` — 14 Archive.org audio collections, all look structurally correct
- `fetchVideos.ts` — Archive.org video fetches use correct `/advancedsearch.php` endpoint
- `VideosTab.tsx`, `FilmsTab.tsx` — `VideoPlayer`/`FilmPlayer` renders `<iframe>` if `embedUrl`, else `<video>` tag (breaks for page URLs)
- `ImagesTab.tsx` — has full lightbox with left/right navigation, `SOURCE_COLORS` does not include DeviantArt or Reddit entries
- `useResearch.ts` — source-filtered search not implemented; query is passed verbatim to all sources

## Requested Changes (Diff)

### Add
- Reddit image source in `fetchImages.ts` using Reddit's public JSON search API
- Source-filtered search logic in `useResearch.ts`: detect source keywords (DeviantArt, Reddit, NASA, etc.) in query, strip them, run normal search but filter results to that source only
- `DeviantArt` and `Reddit` entries in `SOURCE_COLORS` in `ImagesTab.tsx`

### Modify
- `fetchEuropeanFilmGateway` in `fetchVideos.ts`: improve embed detection; for items where no direct playable URL exists, set `embedUrl: undefined` and add a `pageUrl` field so the player can show a "Watch on Film Gateway" fallback button
- `FilmPlayer` in `FilmsTab.tsx`: when `film.embedUrl` is undefined AND `film.url` is not a direct video file, show a thumbnail + "Watch on European Film Gateway" button (opens in new tab) instead of a broken `<video>` tag
- `VideoPlayer` in `VideosTab.tsx`: same fallback for non-playable page URLs (check if URL ends with video extension or contains `archive.org/embed`, `youtube-nocookie`, `vimeo`, `player`)
- `ImagesTab.tsx` SOURCE_COLORS: add DeviantArt and Reddit entries so badges show colored labels
- `useResearch.ts` `search()`: add source keyword parsing — if query contains a known source name (case-insensitive), strip it from the search query and after results are assembled, filter `images`/`videos`/`audio` arrays to only that source

### Remove
- Nothing removed

## Implementation Plan
1. `fetchImages.ts`: Add `fetchRedditImages(query)` using `https://www.reddit.com/search.json?q={query}&type=link&limit=25&restrict_sr=false` (Reddit's unauthenticated JSON endpoint); extract post image URLs from `url_overridden_by_dest` for image posts
2. `fetchVideos.ts`: Fix `fetchEuropeanFilmGateway` — use `edmIsShownBy` for direct video URL, mark `embedUrl` only if it passes a strict check (ends with `.mp4`/`.webm`/`.ogg` or host includes `player`/`embed`). Add `pageUrl` field to `WikiVideo` type for fallback link.
3. `FilmsTab.tsx` & `VideosTab.tsx`: Update `FilmPlayer`/`VideoPlayer` — if `embedUrl` exists use iframe, else if URL ends with video extension use `<video>`, else show fallback card with thumbnail and external link button
4. `ImagesTab.tsx`: Add DeviantArt and Reddit to `SOURCE_COLORS`
5. `useResearch.ts`: Parse source keyword from query before searching. Known source aliases: `deviantart` → "DeviantArt", `reddit` → "Reddit", `nasa` → "NASA", `wikimedia` / `commons` → "Wikimedia Commons", `archive` → "Internet Archive", `flickr` → "Flickr Commons", `smithsonian` → "Smithsonian", etc. After search, if sourceFilter is set, filter images/videos/audio to matching source. Also add `fetchRedditImages` to the search waterfall.
