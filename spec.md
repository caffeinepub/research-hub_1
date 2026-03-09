# Research Hub

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Homepage with a prominent search bar at the top
- Search queries Wikipedia REST API and Wikimedia Commons via HTTP outcalls from the backend
- Results displayed in three separate tabs: Articles, Images, Videos
- Articles tab: shows Wikipedia article summaries with titles, expandable full text, and thumbnail images
- Images tab: shows public domain images from Wikimedia Commons in a grid layout, viewable inline
- Videos tab: shows videos from Wikimedia Commons, embeddable and watchable directly on the site
- Video player appears only when a video result is selected/searched
- No external links -- all content rendered within the app
- Open to all users, no authentication required
- All topics covered (no subject restriction)

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: HTTP outcalls to Wikipedia API (`https://en.wikipedia.org/w/api.php`) for article search and summaries
2. Backend: HTTP outcalls to Wikimedia Commons API for image and video search
3. Backend expose query functions: `searchArticles(query: Text)`, `searchImages(query: Text)`, `searchVideos(query: Text)`
4. Frontend: Search bar component at top of page
5. Frontend: Tabbed results layout (Articles / Images / Videos)
6. Frontend: Article card with title, summary, and thumbnail
7. Frontend: Image grid with lightbox/inline viewer
8. Frontend: Video player component that renders when videos are present in results
9. No auth gates -- fully public access
