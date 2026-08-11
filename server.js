const express = require('express');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname, { index: 'index.html' }));

let yahooConnection = {
  connected: false,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  leagueId: null
};

const oauthStates = new Map();

app.get('/api/status', (req, res) => {
  res.json({
    yahooConnected: yahooConnection.connected,
    leagueId: yahooConnection.leagueId,
    mode: yahooConnection.connected ? 'connected' : 'demo'
  });
});

app.get('/auth/yahoo', (req, res) => {
  const { YAHOO_CLIENT_ID, YAHOO_REDIRECT_URI } = process.env;
  const leagueId = String(req.query.leagueId || '').trim();

  if (!YAHOO_CLIENT_ID || !YAHOO_REDIRECT_URI) {
    return res.status(500).send('Yahoo OAuth is not configured yet.');
  }
  if (!leagueId) {
    return res.status(400).send('Missing Yahoo League ID.');
  }

  const state = crypto.randomBytes(24).toString('hex');
  oauthStates.set(state, { leagueId, createdAt: Date.now() });

  const url = new URL('https://api.login.yahoo.com/oauth2/request_auth');
  url.searchParams.set('client_id', YAHOO_CLIENT_ID);
  url.searchParams.set('redirect_uri', YAHOO_REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', state);

  res.redirect(url.toString());
});

app.get('/auth/yahoo/callback', async (req, res) => {
  const { code, state } = req.query;
  const saved = oauthStates.get(String(state || ''));

  if (!code || !saved) {
    return res.status(400).send('Yahoo authorization could not be validated.');
  }
  oauthStates.delete(String(state));

  const { YAHOO_CLIENT_ID, YAHOO_CLIENT_SECRET, YAHOO_REDIRECT_URI } = process.env;
  if (!YAHOO_CLIENT_ID || !YAHOO_CLIENT_SECRET || !YAHOO_REDIRECT_URI) {
    return res.status(500).send('Yahoo OAuth server credentials are incomplete.');
  }

  try {
    const basic = Buffer.from(`${YAHOO_CLIENT_ID}:${YAHOO_CLIENT_SECRET}`).toString('base64');
    const body = new URLSearchParams({
      client_id: YAHOO_CLIENT_ID,
      client_secret: YAHOO_CLIENT_SECRET,
      redirect_uri: YAHOO_REDIRECT_URI,
      code: String(code),
      grant_type: 'authorization_code'
    });

    const tokenResponse = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });

    if (!tokenResponse.ok) {
      return res.status(502).send('Yahoo token exchange failed.');
    }

    const tokens = await tokenResponse.json();

    yahooConnection = {
      connected: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + ((tokens.expires_in || 3600) * 1000),
      leagueId: saved.leagueId
    };

    res.redirect('/?yahoo=connected');
  } catch (error) {
    console.error(error);
    res.status(500).send('Yahoo connection failed.');
  }
});

app.get('/api/live-week', (req, res) => {
  res.json({
    source: yahooConnection.connected ? 'yahoo-pending-adapter' : 'demo',
    weekFinalized: false,
    weeklyHigh: { team: 'Shaun', score: 181.7 },
    positionChallenge: {
      week: 5,
      slot: 'FLEX',
      team: 'Vance',
      player: 'Bijan Robinson',
      actualPosition: 'RB',
      score: 34.8
    }
  });
});

app.listen(PORT, () => {
  console.log(`Auction League Hub running on http://localhost:${PORT}`);
});
