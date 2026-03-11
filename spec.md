# Research Hub

## Current State
Full-stack research platform with: universal search bar, browser tab (Brave Search), AI chat, community/forums, comics tab, admin page (passcode TRX), settings, news, datasets, tools, images, videos, audio, memes/GIFs tabs. Community chat has been rebuilt multiple times but users still can't type/send messages reliably. Comics don't display results. Admin page has basic moderation but no real login/profile. Browser is functional but basic.

## Requested Changes (Diff)

### Add
- Universal search redesigned as Google-style browser form: large centered search bar on homepage, autocomplete suggestions, search results page with grouped results by type (like Google's tabs for Images, Videos, Articles), breadcrumb navigation back to homepage
- Browser improvements: back/forward navigation buttons, URL bar with loading indicator, browser history (recent sites), bookmark favorites, keyboard shortcut (Enter to load), better fallback for blocked sites, quick-access buttons for popular open-access sites
- Comics: more sources (Comic Book Plus, Readcomiconline public domain, Archive.org comics, Digital Comic Museum), comics reader with page flip, save/bookmark comics, comment on comics, comics search that actually returns results, comic series/strip browsing
- Comment on images/photos with text
- Share button on content items (copies link or shares)

### Modify
- Universal search homepage: replace current homepage layout with Google-style centered search with logo above, search bar, and suggestion chips below -- when a search is submitted, show full results page
- UniversalSearchResults: improve layout with type tabs at top (All, Articles, Images, Videos, Audio, Comics, News) so user can filter the unified results
- ComicsTab: complete rewrite with working API calls to Archive.org, Comic Book Plus RSS, and Digital Comic Museum; proper pagination; in-app reader
- BrowserPage: add navigation controls, history, bookmarks, better UX
- AdminPage: add admin login system (passcode TRX), admin profile display, ability to ban users for specific time periods (1h, 24h, 7d, permanent), mute users from specific forums, view all community activity

### Remove
- Nothing removed

## Implementation Plan

### Half 1
1. **App.tsx homepage** -- Replace current homepage with Google-style centered search. Large logo + search bar + topic chips. When searching, navigate to universal results view.
2. **UniversalSearchResults.tsx** -- Add horizontal type-filter tabs (All / Articles / Images / Videos / Audio / GIFs / Comics / News). Results filtered by selected tab.
3. **BrowserPage.tsx** -- Add back/forward history stack, URL bar improvements, loading spinner, bookmarks (localStorage), recent sites list, popular site shortcuts.
4. **ComicsTab.tsx** -- Complete rewrite: fetch from Archive.org comics collection (correct API), Comic Book Plus (RSS/feed), Digital Comic Museum. Add in-app reader with page navigation, save to localStorage, comment section per comic.

### Half 2
5. **CommunityChatsPage.tsx** -- Full Reddit-style rebuild: threads with upvotes/downvotes, nested comments, user flair, create post modal, search within community, sort by Hot/New/Top, real localStorage-backed user posts (no fake static data).
6. **AdminPage.tsx** -- Admin login screen (passcode TRX), admin profile page showing username "Admin", ban system with time periods (1h/24h/7d/permanent), mute system per forum, view all posts/users, unban/unmute controls.
7. **ImagesTab.tsx** -- Add comment section on image lightbox view, share button.
8. **AuthModal.tsx / ProfilePage.tsx** -- Admin profile badge when logged in as admin.
