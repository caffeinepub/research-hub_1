# Research Hub

## Current State
The app fetches search results from:
- Articles: Wikipedia Search API + Wikipedia REST Summary API
- Images: Wikimedia Commons
- Videos: Wikimedia Commons (video files)

All logic lives in `useResearch.ts`. Types are in `types/research.ts`. UI is split across `ArticlesTab`, `ImagesTab`, `VideosTab`, and `App.tsx`.

## Requested Changes (Diff)

### Add
- **Articles tab**: Project Gutenberg (Open Library search API), Internet Archive (search API for texts), PubMed Central (NCBI E-utilities API)
- **Images tab**: NASA Image and Video Library API, Metropolitan Museum of Art Open Access API, Library of Congress API, Europeana API
- **Videos tab**: Internet Archive video search, NASA Image and Video Library videos
- Source badge/label on each result card to indicate where it came from
- Updated types to include `source` field

### Modify
- `useResearch.ts`: run additional API calls in parallel, merge results by tab
- `ArticlesTab.tsx`: show source badge per article
- `ImagesTab.tsx`: show source badge per image
- `VideosTab.tsx`: show source badge per video
- `types/research.ts`: add `source` field to article, image, video types
- `App.tsx`: update footer text to reflect multi-source

### Remove
- Nothing removed

## Implementation Plan
1. Update types to include `source` field on all result types
2. Update `useResearch.ts` to call all new APIs in parallel and merge results
3. Add source badges in each tab component
4. Update App.tsx footer text
