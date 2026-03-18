# Research Hub

## Current State
Version 64+ live app with: universal search, AI Chat, Community/Forums, News, Literature, Datasets, Tools, Music Tools, Archive.org tab, Research Hub Browser, Admin (passcode TRX), Settings, Messages, Profile, and Landing page. Multiple persistent issues: fake demo profiles exist in Community, DMs don't show username/profile picture properly, Apple/Google login buttons don't work, admin role system needs head admin distinction, guitar tuner has no touchable string sounds.

## Requested Changes (Diff)

### Add
- Touchable guitar strings on tuner -- tap each string to hear the reference note
- Multi-instrument presets beyond guitar/ukulele/bass (mandolin, violin, banjo, etc.)
- Custom tuning + named presets (Drop D, Open G, DADGAD, etc.)
- Voucher/referral code section in Settings or Profile (redeem codes for extra AI credits)
- Community separate group messaging button (multi-person chats)

### Modify
- Remove all fake demo profiles (Archive Digger, etc.) from Community members list
- Head admin designation: passcode TRX grants HEAD_ADMIN role; lower admins cannot assign roles (can only request); head admin has unlimited ban durations and full delete powers
- Admin badge display: admin posts/messages have orange outline; admin username shows ADMIN badge
- DM thread: always shows sender username + profile picture in message bubbles
- Landing page: clearly explains what Research Hub is; login/signup buttons work
- Apple/Google sign-in: buttons complete auth flow and set a username
- GIFs and stickers in chat: fix so they actually load and send
- Profile: friend count visible on other people's profiles, media posts (image/video/file) on own profile

### Remove
- All hardcoded fake/demo profiles from Community members list

## Implementation Plan
1. Remove fake demo profiles from CommunityChatsPage members list
2. Fix auth modal -- Apple/Google buttons complete login with a generated username, persist to localStorage
3. Fix DM message bubbles to show avatar + username per sender
4. Implement HEAD_ADMIN vs ADMIN distinction in AdminPage: only TRX passcode = head admin; lower admins can request promotions but not grant them
5. Add orange outline to admin's posts/messages in Community and DMs
6. Fix guitar tuner -- add touchable string buttons that play the reference note via Web Audio API; add instrument presets (mandolin, violin, banjo, etc.) with named tuning presets (Drop D, Open G, DADGAD)
7. Add voucher code input in Settings/Profile (codes stored in localStorage, valid codes grant +50 credits)
8. Fix GIF/sticker picker in chat to load from Giphy API
9. Profile media posts -- add image/video/file attachment to post creation
