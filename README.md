# Auction League Hub — Version 20.3 iPhone Chat Identity Fix

Fixes the name-selector issue seen on iPhone Safari.

Changes:
- Name picker now uses a standard form submit.
- Saves identity to both localStorage and a secure SameSite cookie.
- Uses an in-page memory fallback if browser storage is restricted.
- Modal closes immediately after Save Name.
- Removes duplicate HTML IDs from the two chat identity displays.
- If a saved name is no longer a current team, the site asks the user to choose again.

All Version 20.2 features remain:
- Named chat
- Empty/clean chat starting state
- Admin chat clear control
- Manual weekly results
- Automatic running win totals and sorting
- Automatic public-page refresh
