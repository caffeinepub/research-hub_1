# Research Hub

## Current State
- Single-page app with bottom nav (Search, Discover)
- Discover is rendered inline on the same page, not a real separate page
- Articles show raw HTML tags (like `<span>`) in snippets -- snippets are not being stripped of HTML
- Article expansion shows fullSummary inline (collapsed/expanded toggle) but does not open a dedicated page
- Discover section shows article/image/audio/video cards but they are not interactive (no tap/click handlers, images are not clickable, articles cannot be read)
- Audio and videos tabs are present but source coverage issues persist
- No full article reading page exists

## Requested Changes (Diff)

### Add
- **Discover Page**: Make Discover a true separate full-screen page/view (not just an inline section). It should have its own layout with a search bar at the top so users can type and search directly from Discover.
- **Article Detail Page**: Clicking any article (in Articles tab OR Discover) opens a full-screen article detail view. This view shows: full title, source badge, full article text with images rendered inline (fetched from Wikipedia API using prop/action), scrollable content, back button to return.
- **HTML Stripping**: Strip all HTML tags from article snippets and fullSummary before displaying. Use a DOMParser or regex to remove `<span>`, `<b>`, `<i>` etc.
- **Discover Interactivity**: In Discover view, every article card is clickable (opens article detail), every image is clickable (opens lightbox), every audio card has a play button, every video card has a play button.
- **Discover Search Bar**: Discover page has its own search input at the top so users can search without going back to Search tab.

### Modify
- **ArticlesTab**: Article cards should be clickable to open the article detail page (not just the inline expand). The inline expand stays as a quick preview but also add a button to open full page.
- **Discover section in App.tsx**: Replace with a proper routed or state-based full page view with its own search bar and interactive cards.
- **HTML in snippets**: Strip HTML entities and tags from `article.snippet` and `article.fullSummary` everywhere they are displayed.
- **Article full content**: When opening a full article, fetch the full Wikipedia page HTML and render it properly (using dangerouslySetInnerHTML with sanitized content, or parse the extract). For non-Wikipedia sources, show the fullSummary text.

### Remove
- The non-interactive static article/image cards in the current Discover inline view.

## Implementation Plan
1. Create `src/frontend/src/components/DiscoverPage.tsx` -- full-screen Discover page with its own search bar, and interactive grid sections for Articles, Images, Audio, Videos (clickable cards).
2. Create `src/frontend/src/components/ArticleDetailPage.tsx` -- full-screen article reader. Accepts a WikiArticle, strips HTML, fetches full Wikipedia page extract (for Wikipedia source), displays images inline, scrollable.
3. Update `App.tsx` to manage a view state: `search | discover | article-detail`. Bottom nav switches between search and discover. Clicking an article anywhere pushes to `article-detail` view with a back button.
4. Update `ArticlesTab.tsx` to strip HTML tags from snippets before display, and make the whole card clickable to open article detail.
5. Update `useResearch.ts` -- add a `fetchFullArticle(pageid)` function that calls Wikipedia's REST API for full page extract with images.
6. Strip HTML in snippets via utility function `stripHtml(html: string): string`.
