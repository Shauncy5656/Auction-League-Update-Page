# Auction League Hub — Version 18

This is the phone-friendly flat-file deployable project version.

## Included
- Rams color scheme and current site layout
- Secure server-side Yahoo OAuth scaffold
- `/api/status` endpoint
- `/api/live-week` endpoint
- Existing team/settings logic and running-win sorting
- Demo mode remains available until the real Yahoo league adapter is connected

## Current Teams
Shaun, Brandon, Nate, Keith, DC, Vance, Sol, Guy, Makua

## Yahoo setup
Create a Yahoo developer application and configure its callback URL as:

`https://YOUR-DOMAIN/auth/yahoo/callback`

Then set these server environment variables:

- `YAHOO_CLIENT_ID`
- `YAHOO_CLIENT_SECRET`
- `YAHOO_REDIRECT_URI`

## Run locally
```bash
npm install
cp .env.example .env
npm start
```

Yahoo's developer documentation expects HTTPS for real OAuth testing, so the actual Yahoo authorization step should be tested from the deployed HTTPS site.

## Next build step
After Yahoo is connected, map your real league/team/player data into `/api/live-week`. The front end is already structured so the high team score and position leader can update without another redesign.


## GitHub phone-friendly layout
All required files can be uploaded directly to the repository root. No `public` folder is required.
