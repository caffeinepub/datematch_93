# DateMatch

## App Summary

DateMatch is a general-purpose profile-based matching app on ICP. Users create a profile, swipe on others, form mutual matches, and chat — all around shared interests, not just dating. Think of it as interest-based social matchmaking.

---

## Tags

`dating` `matching` `social` `profiles` `swipe` `messaging` `icp`

---

## User Stories

### Profile

- As a new user, I can sign in with Internet Identity and create a profile (name, age, bio, interests, photo, icebreakers) so that others can discover me.
- As a user, I can edit my profile at any time so that I can keep it up to date.
- As a user, I can upload a profile photo so that my profile is more personable.
- As a user, when I write my bio, the app pre-selects matching interests from my text so I don't have to search manually.

### Discovery & Swiping

- As a user, I see a stack of profile cards I haven't interacted with yet, one at a time.
- As a user, I can swipe right (like) or left (pass) on a profile card, either by dragging or tapping action buttons.
- As a user, when I swipe right on someone who has already liked me, I get a "It's a Match!" celebration.
- As a user, I don't see profiles I've already swiped on (like or pass) in my discovery stack.
- As a user, when I run out of profiles to swipe, I see an empty state prompting me to check back later.

### Matches

- As a user, I can see a list of all my mutual matches.
- As a user, I can unmatch with someone to remove them from my matches list.
- As a user, I can view a matched user's full profile before messaging them.

### Messaging

- As a user, I can send a text message to someone I've matched with.
- As a user, I can see all messages in a conversation thread, newest at the bottom.
- As a user, I can see my list of conversations sorted by most recent message.
- As a user, I get visual indication of unread messages in my matches list.

### Compatibility Quizzes

- As a user, I can answer a short compatibility quiz (5–10 hardcoded questions).
- As a user, I can see a compatibility score on match cards so I know how well we align.
- As a user, my quiz answers are stored on my profile and compared against matches automatically.

### Settings & Privacy

- As a user, I can set age and distance/interest preferences to filter my discovery stack.
- As a user, I can block another user so they no longer appear in my discovery and I no longer appear in theirs.
- As a user, I can enable incognito mode so I only appear to people I've liked first.
- As a user, I can delete my profile to remove all my data from the canister.
- As a user, I can log out at any time.

---

## Acceptance Criteria

### Profile Setup

- [ ] 4-step full-screen onboarding: Basics → Interests → Icebreakers → Photo
- [ ] Name (max 50 chars), age (18–120), bio (max 500 chars) all required
- [ ] At least 1 interest required, up to 10
- [ ] Icebreakers are optional (up to 3 prompt + answer pairs)
- [ ] Photo upload optional; profiles without photo still visible
- [ ] Bio auto-detects interests on step transition

### Discovery

- [ ] Card stack shows unswiped profiles, up to 20 at a time
- [ ] Drag card left/right with visual feedback (NOPE/LIKE badge, card tilt)
- [ ] Tap ✕ or ♥ buttons for pass/like
- [ ] Match overlay shown on mutual like before advancing to next card
- [ ] Empty state when no more profiles available

### Matches List

- [ ] Shows all mutual matches with photo + name
- [ ] Tap to view full profile
- [ ] Unmatch option via long-press or swipe

### Messaging

- [ ] Conversation only available to mutual matches
- [ ] Real-time-ish polling (query every 10s or on focus)
- [ ] Message input at bottom; send on Enter or button tap
- [ ] Timestamps shown in conversation

### Compatibility

- [ ] 8–10 hardcoded questions with 3–4 multiple-choice answers each
- [ ] Score shown as percentage on match cards
- [ ] Quiz accessible from profile page

### Settings

- [ ] Age range filter (min/max age) stored in preferences
- [ ] Incognito mode toggle
- [ ] Block user functionality
- [ ] Delete account with confirmation dialog

---

## Design Principles

- **App-native feel**: bottom tab navigation, full-screen onboarding, gesture-driven
- **Warm palette**: cream/beige backgrounds, hot pink primary, dark purple foreground
- **No modal dialogs for primary flows** — use full-screen views instead
- Inspired by Tinder UX but more interest-focused and privacy-respecting
