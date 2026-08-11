# Auction League Hub — Version 19 Admin Foundation

## New in Version 19
- Public site no longer shows a Settings tab.
- Commissioner Admin is a separate protected route at `/admin`.
- Admin login password is stored as the Render environment variable `ADMIN_PASSWORD`.
- Admin can manage team names and weekly position challenge schedule.
- Yahoo connection controls live only inside Admin.
- Public site keeps the Rams design.

## Important current limitation
Team and schedule changes are stored in server memory in this version. A Render restart/deploy resets them to defaults.
The next infrastructure step is a persistent database so changes and live chat survive redeploys/restarts.

## Render environment variables
Add:
- `ADMIN_PASSWORD` = a password only the commissioner knows.

Later, when Yahoo access is resolved:
- `YAHOO_CLIENT_ID`
- `YAHOO_CLIENT_SECRET`
- `YAHOO_REDIRECT_URI`
