# Auction League Hub — Version 20.9 Weekly Results Sync Fix

This version gives weekly winner results the same dedicated public-data path that fixed waivers.

Fixes:
- Dedicated `/api/public/results` endpoint for weekly winners.
- High Team winner/score now refresh independently from the larger public state.
- Position Challenge winner/player/score now refresh independently.
- Season Weekly Wins and Winners-tab standings recalculate from the same weekly-result endpoint.
- Weekly results refresh every 10 seconds and whenever the app returns to the foreground.
- Admin Save Weekly Results confirms the exact values the server stored.
- New deployment starts with no weekly results, so every team begins at 0 wins.

Waiver functionality from Version 20.7 remains unchanged.
Chat name-selection fixes remain unchanged.

Important:
The app still stores season data in the running Render process. Persistent storage should be the next upgrade before real season data is entered.
