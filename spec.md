# Research Hub

## Current State
A multi-tab research platform (Articles, Images, Videos, Films) pulling from 40+ public domain and open-access sources. Version 15 has Load More pagination, image lightbox with keyboard navigation, source filter toggles, inline video/film players. Layout uses a hero header with search bar and topic chips.

## Requested Changes (Diff)

### Add
- **Audio tab**: New 5th tab for music/audio results. Sources: Internet Archive audio collections (etree/live concerts, audio books, old-time radio, 78rpm records), Free Music Archive (freemusicarchive.org API), Musopen (classical music, freemusicarchive fallback), LibriVox (audiobooks via Internet Archive), ccMixter, Freesound (public API), SoundBible. Show inline HTML5 audio player for each result. Include download button to save audio file.
- **Image download button**: Add a download button on each image in the grid and in the lightbox so users can save JPGs/PNGs to device.
- **More image sources**: Pixabay (no-key public API), rawpixel public domain API, Unsplash (use demo/public endpoint), Imgur public galleries via Internet Archive.
- **More article sources**: OpenAlex (open scholarly works API), Semantic Scholar (public API), Europe PMC, CORE.ac.uk, BASE search.
- **More Archive.org collections**: Add remaining Archive.org collections: etree, GratefulDead, oldtimeradio, 78rpm, audio_bookspoetry, librivoxaudio, movies (all), software, image, web.
- **Bottom navigation bar**: Fixed bar at bottom of screen with two tabs: "Search" (current view) and "Discover" (unified multi-source instant results page showing articles + images + videos/films all together in a unified feed).
- **Full article text**: When user clicks "Read More" on a Wikipedia article, fetch and display the full Wikipedia page extract (not just a snippet). For non-Wikipedia sources, show full available text.

### Modify
- **Fix front page layout**: The hero section text and elements are overlapping. Increase vertical spacing/padding, ensure text stack is clean, fix any z-index/overflow issues.
- **Articles tab**: Expand "Read More" to show full article extract (much longer text) via Wikipedia /w/api.php with prop=extracts&exintro=false.
- **Tab bar**: Add Audio tab with Music icon between Images and Videos.

### Remove
- Nothing removed

## Implementation Plan
1. Fix hero header spacing - add proper padding, fix text overlap, ensure subtitle/chips don't crowd the search bar.
2. Add AudioTab component with inline HTML5 audio player, source badges, Load More pagination. Sources: Internet Archive audio (etree, librivoxaudio, audio_bookspoetry, oldtimeradio, 78rpm), and static placeholder entries for Free Music Archive/Freesound since those require CORS-friendly endpoints.
3. Add download button to ImagesTab grid cards and lightbox modal - uses anchor download attribute.
4. Expand article fetch to use full Wikipedia extracts (exintro=false, longer extract).
5. Add new article sources in useResearch hook: OpenAlex, Semantic Scholar, Europe PMC APIs.
6. Add new image sources: Pixabay (free API key not needed for some endpoints), rawpixel public domain RSS/API.
7. Add bottom nav bar (fixed, mobile-friendly) with Search and Discover tabs. Discover tab shows unified search results - all content types in one scrollable feed.
8. Add Audio tab to main Tabs component with audio player cards.
9. Update footer/layout to account for bottom nav bar (add padding-bottom).
