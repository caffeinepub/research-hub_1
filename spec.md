# Research Hub

## Current State

Version 8 is live with 4 tabs (Articles, Images, Videos, Films). Sources include Wikipedia, Internet Archive (multiple collections), NASA, Wikimedia Commons, Met Museum, Library of Congress, Europeana, Openverse, Smithsonian, Flickr Commons, PubMed, NSF, NIH/NLM, Open Library, HathiTrust, British Pathé, C-SPAN, DPLA, European Film Gateway, Vimeo CC, Archive Animation/Education/News/Feature Films/Open Source, and curated YouTube public domain films.

## Requested Changes (Diff)

### Add

**New video sources (all via Internet Archive collections or public embeds):**
- PBS NewsHour: Archive.org `collection:pbsnewshour`
- National Film Board of Canada: Archive.org `collection:nfb`
- UC Berkeley Webcasts: Archive.org `collection:ucberkeley`
- Democracy Now: Archive.org `collection:democracy_now`
- Classic TV / Vintage Television: Archive.org `collection:classic_tv`
- Classic Cartoons: Archive.org `collection:classic_cartoons`
- Sci-Fi/Horror Archive: Archive.org `collection:scifi_horror`
- MIT OpenCourseWare: Archive.org `collection:mitocw`
- TED/Educational talks: Archive.org `collection:tedtalks` 
- News & Public Affairs (expanded): Archive.org `collection:newsandpublicaffairs`

**New article sources:**
- arXiv: `https://export.arxiv.org/api/query?search_query=all:{query}&max_results=6`
- CrossRef: `https://api.crossref.org/works?query={query}&rows=6`
- DOAJ: `https://doaj.org/api/search/articles/{query}?pageSize=6`
- Science.gov: `https://www.science.gov/scigov/desktop/en/search.html` (search via OSTI API)

**New image sources:**
- Art Institute of Chicago: `https://api.artic.edu/api/v1/artworks/search?q={query}`
- Cleveland Museum of Art: `https://openaccess-api.clevelandart.org/api/artworks?q={query}`
- DPLA images: `https://api.dp.la/v2/items?q={query}&sourceResource.type=image`
- Rijksmuseum: `https://www.rijksmuseum.nl/api/en/collection?q={query}&key=0fiuZFh4`

### Modify

- Add new source badge colors for all new sources in VideosTab and FilmsTab
- Films tab: add NFB and Classic Cartoons to film results
- Update footer text to mention new sources

### Remove

- Nothing removed

## Implementation Plan

1. Add `fetchArxivArticles`, `fetchCrossRefArticles`, `fetchDoajArticles` functions to `useResearch.ts`
2. Add `fetchArtInstituteImages`, `fetchClevelandMuseumImages`, `fetchDplaImages`, `fetchRijksmuseumImages` functions
3. Add 10 new video source fetch functions for PBS, NFB, UC Berkeley, Democracy Now, Classic TV, Classic Cartoons, Sci-Fi/Horror, MIT OCW, TED, News & Public Affairs -- all via Archive.org advanced search
4. Wire all new sources into the `Promise.allSettled` parallel fetch block
5. Add new results to `articles`, `images`, `videos`, and `films` arrays
6. Add source badge colors for all new sources in `SOURCE_COLORS` maps in `VideosTab.tsx` and `FilmsTab.tsx`
7. Update footer text
