# Research Hub

## Current State
The app has four tabs: Articles, Images, Videos, Films. Each tab receives a full array of results from the parent and renders all items at once. The ImagesTab has a basic lightbox that shows one image with close button but no prev/next navigation.

## Requested Changes (Diff)

### Add
- Load More button at the bottom of each tab (Articles, Images, Videos, Films) — starts with 12 items visible, each click loads 12 more
- Image lightbox left/right arrow navigation to scroll through all images in the current results
- Keyboard support for lightbox (ArrowLeft, ArrowRight, Escape)

### Modify
- ImagesTab: add lightboxIndex state (index into images array), replace single-image lightbox with indexed lightbox supporting prev/next navigation; add Load More button below grid
- ArticlesTab: slice articles to visibleCount, add Load More button below grid
- VideosTab: slice regularVideos to visibleCount, add Load More button below the regular videos grid
- FilmsTab: slice otherFilms to visibleCount, add Load More button below the films grid

### Remove
- Nothing removed

## Implementation Plan
1. ImagesTab: replace `lightbox: WikiImage | null` state with `lightboxIndex: number | null`; add prev/next arrow buttons in lightbox overlay; add keyboard event listener for ArrowLeft/ArrowRight/Escape; add visibleCount state (default 12) and Load More button
2. ArticlesTab: add visibleCount state (default 12), slice articles array, add Load More button
3. VideosTab: add visibleCount state (default 12), slice regularVideos, add Load More button
4. FilmsTab: add visibleCount state (default 12), slice otherFilms, add Load More button
