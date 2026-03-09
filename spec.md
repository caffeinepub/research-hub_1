# Research Hub

## Current State
The app fetches articles, images, and videos from multiple public domain sources. Videos come from: Wikimedia Commons, Internet Archive, NASA, Prelinger Archives. Images come from: Wikimedia Commons, NASA, Met Museum, Library of Congress, Europeana, Openverse, Smithsonian. Flickr Commons is listed in project context as a source but is NOT currently implemented in useResearch.ts -- this is the bug to fix.

Search is exact-match only with no fallback for low/no results.

## Requested Changes (Diff)

### Add
- **New video sources:**
  - Library of Congress films (LOC video search API)
  - Digital Public Library of America (DPLA) videos
  - C-SPAN public domain archive
  - European Film Gateway
  - British Pathe newsreels (via Internet Archive collection: britishpathe)
  - Wikimedia Commons videos already exist but should ensure good coverage
- **Flickr Commons images** -- fix missing implementation; use Flickr API with `license=7,8,9,10` (public domain/no known copyright) via `https://www.flickr.com/services/rest/?method=flickr.photos.search&license=7,8,9,10&text={query}&format=json&nojsoncallback=1&per_page=12&extras=url_s,url_m,title,owner_name`
- **Fuzzy/similar search fallback** -- after primary search, if any tab returns fewer than 3 results, automatically retry with a broadened query (split multi-word query, use first significant word, or append related terms). Apply to all three tabs. Show a subtle "Showing related results for..." note when fuzzy fallback is used.

### Modify
- `useResearch.ts`: add all new video fetch functions, fix Flickr fetch function, add fuzzy fallback logic
- `VideosTab.tsx`: add source badge colors for new sources (LOC, DPLA, C-SPAN, European Film Gateway, British Pathe)
- `ImagesTab.tsx`: add source badge color for Flickr Commons
- `SearchResults` or app level: display a small "Related results shown" notice when fuzzy fallback triggered

### Remove
- Nothing removed

## Implementation Plan
1. In `useResearch.ts`:
   - Add `fetchFlickrImages(query)` -- calls Flickr public API with public domain license filter
   - Add `fetchLocVideos(query)` -- calls LOC API filtered to moving-image media type
   - Add `fetchDPLAVideos(query)` -- calls DPLA API filtered to moving image
   - Add `fetchBritishPatheVideos(query)` -- Internet Archive advanced search with collection:britishpathe
   - Add `fetchCspanVideos(query)` -- Internet Archive collection:c-span or CSPAN archive
   - Add `fetchEuropeanFilmGatewayVideos(query)` -- Internet Archive or EFG API if CORS-accessible
   - Wire all new sources into the main `search()` function via `Promise.allSettled`
   - Add fuzzy fallback: after results are assembled, if videos < 3 OR images < 3, run a second pass with broadened query (first word of query, or common synonyms), merge unique results
   - Track whether fuzzy fallback was used and expose a `fuzzyQuery` state
2. In `VideosTab.tsx` and `ImagesTab.tsx`: add badge color entries for all new sources
3. In `App.tsx` or relevant parent: if `fuzzyQuery` is set and results are sparse, show a small dismissible notice
