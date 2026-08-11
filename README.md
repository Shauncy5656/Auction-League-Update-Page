# Auction League Hub — Version 20.7 Waiver Limit Sync Fix

Fixes the issue where the Commissioner Admin could save a waiver pickup limit but the public Waivers page still displayed "Not set".

Changes:
- Adds a dedicated public waiver-state endpoint.
- Public Waivers summary refreshes directly from that endpoint every 10 seconds.
- Adds cache-busting to public state requests.
- Admin confirms the exact saved limit after Save Pickup Limit.
- Keeps Version 20.6 Waiver Tracker design and all Version 20.5 chat fixes.

Important:
Current results, waiver data, and chat are still stored in Render server memory.
Persistent storage remains the next recommended infrastructure upgrade.
