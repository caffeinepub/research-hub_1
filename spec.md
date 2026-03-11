# Research Hub

## Current State
- CommunityChatsPage has forum posts, channels, thread views, but NO clickable user profiles and NO friend/follow system
- MemesTab has doSearch and a form, but results may not refresh properly when a new search is submitted
- GifPickerPanel in CommunityChatsPage has a search input + Go button, but users report it doesn't work
- No profile modal or friend request UI anywhere in Community

## Requested Changes (Diff)

### Add
- Clickable user avatars/names throughout CommunityChatsPage (in PostCard, ThreadView replies, Members list) that open a UserProfileModal
- UserProfileModal: shows username, avatar, join date, post count, and a "Send Friend Request" / "Friends" button
- Friends state stored in localStorage per user
- "Members" tab/section in Community showing all authors who have posted, each clickable
- Fix GIF picker in chat: ensure search input value state is properly tied, onKeyDown Enter fires search, and Go button fires search
- Fix MemesTab: ensure the form onSubmit properly triggers doSearch with current query value

### Modify
- Community page layout: cleaner 3-panel design — left sidebar (channels), center feed, right panel ("Members" showing active users)
- PostCard and ThreadView: make author name/avatar a clickable button that opens UserProfileModal
- GifPickerPanel: fix controlled input and search trigger
- MemesTab: ensure query state is read correctly in the form submit handler

### Remove
- Nothing removed

## Implementation Plan
1. Add `UserProfileModal` component inside CommunityChatsPage.tsx — shows user info + friend button, uses localStorage for friend state
2. Add `viewProfile` state to CommunityChatsPage, wire avatar/name buttons in PostCard and ThreadView to set viewProfile and open modal
3. Add a Members panel (right side on desktop, tab on mobile) listing unique post authors with clickable avatars
4. Fix GifPickerPanel: make `query` state controlled properly, ensure `search(query)` is called on Enter and Go button click
5. Fix MemesTab: verify `onSubmit` calls `doSearch(query)` with latest query state — use a ref if closure is stale
