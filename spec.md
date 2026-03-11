# Research Hub

## Current State
A comprehensive research platform with Articles, Images, Videos, Films, Audio, Discover, AI Search, and Browser tabs. Bottom nav has Search, Discover, and Browser. No user accounts, no community features, no memes/GIFs tab.

## Requested Changes (Diff)

### Add
- **Memes/GIFs/Stickers tab**: A new tab accessible from the main search area and bottom nav. Sources: Giphy (GIFs via public beta API), Tenor (GIFs), Imgflip (meme templates), Archive.org meme collections. Search by keyword. Click to copy URL or share into chat.
- **Community Chats page**: Accessible from bottom nav. Default public rooms: Science, History, Technology, Art, Nature, Space. Users can create custom rooms. Posts support text, images (file upload + URL paste), and GIF/meme links.
- **Login & Profiles**: Simple username + password authentication via backend. Profile shows username, avatar (initials-based), bio, research interests, and post history.
- **Bottom nav expansion**: Add "Chat" and "Profile" nav items.

### Modify
- **Bottom nav**: Extend from 3 items (Search, Discover, Browser) to 5 items (Search, Discover, Browser, Chat, Profile).
- **App.tsx routing**: Add routes/views for Chat, Profile pages.

### Remove
- Nothing removed.

## Implementation Plan
1. Select `authorization` component for user auth.
2. Generate Motoko backend: user profiles, chat rooms, chat messages.
3. Build frontend:
   - `MemesTab.tsx`: keyword search across Giphy, Tenor, Imgflip, Archive.org meme collections. Grid display with copy/share button.
   - `CommunityChatsPage.tsx`: room list sidebar + message thread. Support text, image URLs, file uploads, GIF embeds.
   - `ProfilePage.tsx`: view/edit profile (username, bio, research interests). Show own posts.
   - Auth modal (login/register) triggered when unauthenticated user tries to post or view profile.
   - Update `App.tsx` bottom nav to include Chat and Profile tabs.
   - Add Memes tab to the main results Tabs in search view.
