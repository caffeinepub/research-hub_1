# Research Hub

## Current State
Research Hub is a comprehensive research platform (Version 61+) with tabs for Articles, Images, Videos, Films, Audio, GIFs/Memes, Literature (Comics+Books), Datasets, News, Tools, Community, Messages, Archive, Browser, Settings, Admin. App has landing page, auth modal with Apple/Google sign-in, and "by MEGATRX design" branding.

## Requested Changes (Diff)

### Add
- **Music Tools page** (new tab in nav): guitar/ukulele/bass/other instrument tuner using device microphone frequency detection, metronome with BPM control and tap tempo, chord chart viewer for guitar/ukulele/piano, music note reference, music sheet search (via IMSLP/open sources), video search for how-to-play music tutorials
- **AI Chat history**: conversation persists per session, scrollable history
- **AI study partner mode**: AI responds conversationally, keeps context between messages, answers questions about the app, solves problems step by step

### Modify
- **News Tab complete redesign**: professional news site layout (like BBC/Reuters), full article reader in-app with images, working search, more sources (Reuters, AP, BBC, NPR, HackerNews, Reddit, Wikipedia Current Events), live news section, news videos embeddable inline, user can post own news with hashtags, comment/reply on news posts, show article images on cards
- **AI Chat**: smarter conversational responses, knows app features, chat history across messages, built-in calculator, study partner toggle, follow-up suggestions, no more Wikipedia-only responses
- **News article cards**: show thumbnail images, full title, source, date; tapping opens full article reader in-app

### Remove
- Nothing removed

## Implementation Plan
1. Create `MusicToolsPage.tsx` with:
   - Instrument tuner (Web Audio API, frequency detection via microphone)
   - Metronome with BPM slider, tap tempo button, visual beat indicator
   - Chord chart viewer with guitar/ukulele/piano chord diagrams
   - Music note reference chart
   - Music sheets search (IMSLP embed + open music sheet sources)
   - Video search for music tutorials (YouTube-style search redirecting to Archive.org/Dailymotion)
2. Redesign `NewsTab.tsx`:
   - Professional grid layout with hero article + sidebar
   - Article cards with images, full title, description, source badge, date
   - Working search that queries multiple APIs
   - Full in-app article reader modal with image support
   - News videos section with inline players
   - User post creation with hashtag support
   - Comment/reply thread per article
   - Category tabs (Top, Science, Tech, World, Health, Sports, Local)
   - Live refresh button
3. Improve `AIChatPage.tsx`:
   - Persistent chat history (localStorage)
   - Conversational context (last N messages sent to AI logic)
   - App knowledge base (FAQ about Research Hub features)
   - Calculator built-in
   - Study partner mode toggle
   - Better response logic: greet back, answer directly, only search Wikipedia for factual queries
4. Add Music tab to `App.tsx` nav
