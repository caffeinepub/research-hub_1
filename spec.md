# Research Hub

## Current State
Research Hub is a full-stack research platform (Version 60+) with tabs for Articles, Images, Videos, Films, Audio, GIFs/Memes, Literature, News, Datasets, Tools, Community, Messages, Archive, Browser, AI Chat, Settings, Admin. Key issues: community reply inputs don't work, news page is basic/non-interactive, GIF/sticker picker is broken, login buttons (Apple/Google) do nothing, users can't post images in community posts.

## Requested Changes (Diff)

### Add
- News page full redesign: professional news site layout, full article reader with images, search bar, news videos/reels/clips section, user-created posts with custom hashtags, forum-style comments
- GIF/sticker sources from public internet databases (Giphy, Tenor, open sticker packs)
- Image posting in community posts and replies
- Music Tools page (second half -- deferred)

### Modify
- Community: fix reply text input (currently unresponsive), fix post creation with image upload
- Auth modal: Apple and Google sign-in buttons must trigger actual login flow (simulate OAuth since no real OAuth is available -- store session as apple/google user)
- GIFs/Memes tab: fix sticker picker to load from Giphy stickers API, fix GIF search reliability
- News tab: complete redesign with professional layout, article cards with images, full-text reader, embedded video clips, search, hashtags, user post creation

### Remove
- Placeholder/broken sticker UI that does nothing on tap

## Implementation Plan
1. Rewrite `NewsTab.tsx` -- professional grid layout, article cards with thumbnail images, in-app full article reader, video clips row, search bar, hashtag chips, user post creation modal
2. Fix `CommunityChatsPage.tsx` -- ensure reply textarea is properly wired (onChange + onKeyDown), image attachment button using file input
3. Fix `AuthModal.tsx` -- Apple and Google buttons create a local session with provider name stored
4. Fix `MemesTab.tsx` -- sticker picker loads Giphy stickers endpoint, GIF search uses debounced fetch with fallback
5. Validate and deploy first half
