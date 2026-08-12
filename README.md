# Auction League Hub — Version 21.0 Unified Sync

This version removes the separate weekly-results sync path.

The public endpoint that is already successfully syncing waiver data now also carries:
- Weekly High Team winner and score
- Position Challenge winner, player, and score
- Weekly High Point win totals
- Position High Point win totals
- Latest completed weekly result

The public page applies both waivers and weekly winners from the SAME request.

Admin also now shows a Saved Weekly Results section so you can verify exactly what the server retained after saving a week. The save confirmation says CONFIRMED on server only after a second read verifies the result.

All teams begin at 0 when there are no saved weekly results.

Important:
Data is still stored in Render process memory. Persistent storage is still recommended before real season use.
