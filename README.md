# Auction League Hub — Version 20 Manual Admin

Version 20 makes manual weekly result entry the primary workflow.

## Commissioner Admin
For any Week 1–18, enter:
- Weekly High Team winner
- Weekly High Team score
- Position Challenge winning team
- Winning player
- Player actual position (optional)
- Position Challenge score

Saving a week updates the public site's:
- Weekly High Team Score
- Position Challenge Winner
- Season Weekly Wins totals
- Automatic most-wins-to-least sorting
- Next Week position preview

Yahoo remains optional for later.

## Important persistence note
The current build stores manual results in the running Render server's memory.
A Render restart or future deployment can reset entries.

The recommended next infrastructure step is persistent storage so results, teams,
challenge schedules, and chat survive restarts.
