# Auction League Hub — Version 20.8 Shared Data Fix

Major data-flow cleanup.

Fixes:
- Removes the hard-coded sample standings from the Winners tab.
- All league teams now display starting at 0 wins.
- Total Points, Position Challenge, and Combined standings are rendered from the same server data used by Commissioner Admin.
- Winners and Waivers refresh when their tabs are opened.
- Public shared data refreshes when the browser/app becomes active again.
- Adds Commissioner Admin control: Reset All Winner Totals to 0.
- Reset clears weekly winner results only; waiver pickups and chat stay intact.
- Keeps direct waiver-limit refresh and automatic waiver totals.

Important architecture note:
Current weekly results, waiver data, and chat are still held in the running Render process.
A deployment/restart can reset them. Persistent storage should be added before real season data is entered.
