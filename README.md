# Auction League Hub — Version 20.1 Cleanup

Changes:
- Removed all sample/demo chat messages.
- Shared chat now starts empty.
- Commissioner can clear chat from Admin.
- Weekly running totals are calculated automatically from saved weekly results.
- All teams remain visible, including teams with 0 wins.
- Win columns automatically sort most wins to least.
- Public pages re-check commissioner results every 15 seconds.
- Chat re-checks every 10 seconds.

Manual weekly workflow:
1. Commissioner enters the week's High Team winner and score.
2. Commissioner enters the Position Challenge winner/player/score.
3. Save Weekly Results.
4. Server recalculates both season win totals automatically.
5. Open public pages update automatically within about 15 seconds.

Important:
Current data is still stored in Render server memory. A restart/deployment can reset
weekly results and chat. Persistent storage should be the next infrastructure upgrade.
