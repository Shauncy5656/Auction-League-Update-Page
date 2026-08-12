# Auction League Hub — Version 21.1 Public Display Fix

Only the public display was changed.

The live JSON proved Commissioner Admin and server storage are working. This build adds a final independent display renderer that reads the same working `/api/public/waivers` feed and directly updates:

- Weekly High Team winner and score
- Position Challenge winner/player/score
- Home-page season win totals
- Winners tab Total Points
- Winners tab Position Challenge
- Winners tab Combined standings

It refreshes every 5 seconds and whenever a tab is opened.

Server, Admin, waivers, and chat logic are unchanged.
