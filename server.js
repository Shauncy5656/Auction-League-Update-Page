const express = require('express');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({extended:false}));

const sessions = new Map();
const oauthStates = new Map();

const state = {
  teams: ['Shaun','Brandon','Nate','Keith','DC','Vance','Sol','Guy','Makua'],
  challengeSchedule: {
    1:'WR',2:'QB',3:'RB',4:'TE',5:'FLEX',6:'WR',7:'DEF',8:'RB',
    9:'QB',10:'TE',11:'FLEX',12:'WR',13:'RB',14:'QB',15:'TE',16:'FLEX',17:'WR',18:'RB'
  },
  weeklyResults: {},
  chatMessages: [],
  waiverLimit: null,
  waiverTransactions: []
};

let yahooConnection = {
  connected:false, accessToken:null, refreshToken:null, expiresAt:null, leagueId:null
};

function parseCookies(req){
  const out={};
  String(req.headers.cookie||'').split(';').forEach(part=>{
    const i=part.indexOf('=');
    if(i>0) out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim());
  });
  return out;
}
function isAdmin(req){
  const sid=parseCookies(req).admin_session;
  return !!(sid && sessions.has(sid));
}
function requireAdmin(req,res,next){
  if(!isAdmin(req)) return res.status(401).json({error:'Unauthorized'});
  next();
}
function adminPage(req,res,next){
  if(!isAdmin(req)) return res.redirect('/admin/login');
  next();
}

app.get('/', (req,res)=>res.sendFile(path.join(__dirname,'index.html')));

app.get('/admin/login',(req,res)=>{
  const error=req.query.error ? 'Incorrect password.' : '';
  res.send(LOGIN_HTML.replace('__ERROR__',error));
});
app.post('/admin/login',(req,res)=>{
  const configured=process.env.ADMIN_PASSWORD;
  if(!configured) return res.status(500).send('ADMIN_PASSWORD is not configured on the server.');
  if(req.body.password!==configured) return res.redirect('/admin/login?error=1');
  const sid=crypto.randomBytes(32).toString('hex');
  sessions.set(sid,{createdAt:Date.now()});
  res.setHeader('Set-Cookie',`admin_session=${sid}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`);
  res.redirect('/admin');
});
app.get('/admin/logout',(req,res)=>{
  const sid=parseCookies(req).admin_session;
  if(sid) sessions.delete(sid);
  res.setHeader('Set-Cookie','admin_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  res.redirect('/');
});
app.get('/admin',adminPage,(req,res)=>res.sendFile(path.join(__dirname,'admin.html')));

app.get('/api/admin/state',requireAdmin,(req,res)=>{
  res.json({
    teams:state.teams,
    challengeSchedule:state.challengeSchedule,
    weeklyResults:state.weeklyResults,
    waiverLimit:state.waiverLimit,
    waiverTransactions:state.waiverTransactions,
    yahoo:{connected:yahooConnection.connected,leagueId:yahooConnection.leagueId}
  });
});
app.post('/api/admin/teams',requireAdmin,(req,res)=>{
  const team=String(req.body.team||'').trim();
  if(!team) return res.status(400).send('Missing team name');
  if(!state.teams.some(t=>t.toLowerCase()===team.toLowerCase())) state.teams.push(team);
  res.json({teams:state.teams});
});
app.delete('/api/admin/teams',requireAdmin,(req,res)=>{
  const team=String(req.body.team||'').trim();
  state.teams=state.teams.filter(t=>t!==team);
  res.json({teams:state.teams});
});
app.put('/api/admin/schedule',requireAdmin,(req,res)=>{
  state.challengeSchedule=req.body.schedule||state.challengeSchedule;
  res.json({challengeSchedule:state.challengeSchedule});
});


app.delete('/api/admin/results',requireAdmin,(req,res)=>{
  state.weeklyResults={};
  res.json({ok:true,weeklyResults:state.weeklyResults});
});

app.put('/api/admin/results/:week',requireAdmin,(req,res)=>{
  const week=Number(req.params.week);
  if(!Number.isInteger(week)||week<1||week>18) return res.status(400).send('Invalid week.');

  const weeklyTeam=String(req.body.weeklyTeam||'').trim();
  const weeklyScore=Number(req.body.weeklyScore);
  const positionTeam=String(req.body.positionTeam||'').trim();
  const positionPlayer=String(req.body.positionPlayer||'').trim();
  const positionScore=Number(req.body.positionScore);
  const actualPosition=String(req.body.actualPosition||'').trim();

  if(!state.teams.includes(weeklyTeam)) return res.status(400).send('Choose a valid weekly high team winner.');
  if(!Number.isFinite(weeklyScore)) return res.status(400).send('Enter a valid weekly high team score.');
  if(!state.teams.includes(positionTeam)) return res.status(400).send('Choose a valid position challenge team winner.');
  if(!positionPlayer) return res.status(400).send('Enter the position challenge player name.');
  if(!Number.isFinite(positionScore)) return res.status(400).send('Enter a valid position challenge score.');

  state.weeklyResults[week]={
    week,
    position:state.challengeSchedule[week]||'FLEX',
    weeklyTeam,
    weeklyScore,
    positionTeam,
    positionPlayer,
    positionScore,
    actualPosition,
    updatedAt:new Date().toISOString()
  };

  res.json({ok:true,result:state.weeklyResults[week]});
});

app.delete('/api/admin/results/:week',requireAdmin,(req,res)=>{
  const week=Number(req.params.week);
  delete state.weeklyResults[week];
  res.json({ok:true});
});

function buildPublicState(){
  const weeklyWins=Object.fromEntries(state.teams.map(t=>[t,0]));
  const positionWins=Object.fromEntries(state.teams.map(t=>[t,0]));

  Object.values(state.weeklyResults).forEach(r=>{
    if(r && weeklyWins[r.weeklyTeam] !== undefined) weeklyWins[r.weeklyTeam] += 1;
    if(r && positionWins[r.positionTeam] !== undefined) positionWins[r.positionTeam] += 1;
  });

  const completedWeeks=Object.keys(state.weeklyResults).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
  const latestWeek=completedWeeks.length ? completedWeeks[completedWeeks.length-1] : null;
  const latestResult=latestWeek ? state.weeklyResults[latestWeek] : null;
  const nextWeek=latestWeek && latestWeek<18 ? latestWeek+1 : (latestWeek ? null : 1);

  return {
    teams:state.teams,
    challengeSchedule:state.challengeSchedule,
    weeklyResults:state.weeklyResults,
    weeklyWins,
    positionWins,
    waivers:{
      limit:state.waiverLimit,
      summary:buildWaiverSummary(),
      transactions:[...state.waiverTransactions].sort((a,b)=>{
        if(a.date===b.date) return String(b.createdAt).localeCompare(String(a.createdAt));
        return b.date.localeCompare(a.date);
      })
    },
    latestWeek,
    latestResult,
    nextWeek
  };
}


app.get('/api/public/results',(req,res)=>{
  const weeklyWins=Object.fromEntries(state.teams.map(t=>[t,0]));
  const positionWins=Object.fromEntries(state.teams.map(t=>[t,0]));

  Object.values(state.weeklyResults).forEach(r=>{
    if(r && weeklyWins[r.weeklyTeam] !== undefined) weeklyWins[r.weeklyTeam] += 1;
    if(r && positionWins[r.positionTeam] !== undefined) positionWins[r.positionTeam] += 1;
  });

  const completedWeeks=Object.keys(state.weeklyResults)
    .map(Number)
    .filter(Number.isFinite)
    .sort((a,b)=>a-b);

  const latestWeek=completedWeeks.length ? completedWeeks[completedWeeks.length-1] : null;
  const latestResult=latestWeek ? state.weeklyResults[latestWeek] : null;

  res.json({
    teams:state.teams,
    weeklyResults:state.weeklyResults,
    weeklyWins,
    positionWins,
    latestWeek,
    latestResult
  });
});

app.get('/api/public/state',(req,res)=>{
  res.json(buildPublicState());
});



app.put('/api/admin/waivers/settings',requireAdmin,(req,res)=>{
  const value=req.body.limit;
  if(value==='' || value===null || value===undefined){
    state.waiverLimit=null;
    return res.json({ok:true,waiverLimit:state.waiverLimit});
  }
  const limit=Number(value);
  if(!Number.isInteger(limit) || limit<0) return res.status(400).send('Enter a valid season waiver limit.');
  state.waiverLimit=limit;
  res.json({ok:true,waiverLimit:state.waiverLimit});
});

app.post('/api/admin/waivers',requireAdmin,(req,res)=>{
  const team=String(req.body.team||'').trim();
  const player=String(req.body.player||'').trim();
  const date=String(req.body.date||'').trim();
  const cost=Number(req.body.cost);

  if(!state.teams.includes(team)) return res.status(400).send('Choose a valid team.');
  if(!player) return res.status(400).send('Enter the player picked up.');
  if(!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).send('Enter a valid pickup date.');
  if(!Number.isFinite(cost) || cost<0) return res.status(400).send('Enter a valid pickup cost.');

  const item={
    id:crypto.randomBytes(8).toString('hex'),
    team,
    player,
    cost:Math.round(cost*100)/100,
    date,
    createdAt:new Date().toISOString()
  };
  state.waiverTransactions.push(item);
  res.json({ok:true,transaction:item});
});

app.delete('/api/admin/waivers/:id',requireAdmin,(req,res)=>{
  const id=String(req.params.id||'');
  const before=state.waiverTransactions.length;
  state.waiverTransactions=state.waiverTransactions.filter(x=>x.id!==id);
  if(state.waiverTransactions.length===before) return res.status(404).send('Waiver pickup not found.');
  res.json({ok:true});
});

function buildWaiverSummary(){
  const summary=Object.fromEntries(
    state.teams.map(team=>[team,{pickups:0,totalCost:0,remaining:state.waiverLimit}])
  );

  state.waiverTransactions.forEach(item=>{
    if(!summary[item.team]) return;
    summary[item.team].pickups += 1;
    summary[item.team].totalCost = Math.round((summary[item.team].totalCost + Number(item.cost||0))*100)/100;
  });

  state.teams.forEach(team=>{
    summary[team].remaining = state.waiverLimit===null
      ? null
      : Math.max(0,state.waiverLimit-summary[team].pickups);
  });

  return summary;
}


app.get('/api/public/waivers',(req,res)=>{
  const transactions=[...state.waiverTransactions].sort((a,b)=>{
    if(a.date===b.date) return String(b.createdAt).localeCompare(String(a.createdAt));
    return b.date.localeCompare(a.date);
  });
  res.json({
    limit:state.waiverLimit,
    summary:buildWaiverSummary(),
    transactions
  });
});

app.get('/api/waivers',(req,res)=>{
  const transactions=[...state.waiverTransactions].sort((a,b)=>{
    if(a.date===b.date) return String(b.createdAt).localeCompare(String(a.createdAt));
    return b.date.localeCompare(a.date);
  });
  res.json({
    waiverLimit:state.waiverLimit,
    summary:buildWaiverSummary(),
    transactions
  });
});

app.get('/api/chat',(req,res)=>{
  res.json({messages:state.chatMessages.slice(-100)});
});

app.post('/api/chat',(req,res)=>{
  const name=String(req.body.name||'').trim().slice(0,30);
  const message=String(req.body.message||'').trim().slice(0,500);
  if(!state.teams.includes(name)) return res.status(400).send('Choose a valid league name.');
  if(!message) return res.status(400).send('Message is required.');

  const item={
    id:crypto.randomBytes(8).toString('hex'),
    name,
    message,
    createdAt:new Date().toISOString()
  };
  state.chatMessages.push(item);
  if(state.chatMessages.length>100) state.chatMessages=state.chatMessages.slice(-100);
  res.json({ok:true,message:item});
});

app.delete('/api/admin/chat',requireAdmin,(req,res)=>{
  state.chatMessages=[];
  res.json({ok:true});
});

app.get('/api/status',(req,res)=>res.json({
  yahooConnected:yahooConnection.connected,
  leagueId:yahooConnection.leagueId,
  mode:yahooConnection.connected?'connected':'demo'
}));

app.get('/auth/yahoo', adminPage, (req,res)=>{
  const {YAHOO_CLIENT_ID,YAHOO_REDIRECT_URI}=process.env;
  const leagueId=String(req.query.leagueId||'').trim();

  if(!YAHOO_CLIENT_ID||!YAHOO_REDIRECT_URI) {
    return res.status(500).send('Yahoo OAuth is not configured yet.');
  }
  if(!leagueId) {
    return res.status(400).send('Missing Yahoo League ID.');
  }

  const oauthState=crypto.randomBytes(24).toString('hex');
  oauthStates.set(oauthState,{leagueId,createdAt:Date.now()});

  const url=new URL('https://api.login.yahoo.com/oauth2/request_auth');
  url.searchParams.set('client_id',YAHOO_CLIENT_ID);
  url.searchParams.set('redirect_uri',YAHOO_REDIRECT_URI);
  url.searchParams.set('response_type','code');
  url.searchParams.set('state',oauthState);

  res.redirect(url.toString());
});

app.get('/auth/yahoo/callback', async (req,res)=>{
  const {code,state:oauthState}=req.query;
  const saved=oauthStates.get(String(oauthState||''));

  if(!code||!saved) {
    return res.status(400).send('Yahoo authorization could not be validated.');
  }

  oauthStates.delete(String(oauthState));

  const {
    YAHOO_CLIENT_ID,
    YAHOO_CLIENT_SECRET,
    YAHOO_REDIRECT_URI
  }=process.env;

  if(!YAHOO_CLIENT_ID||!YAHOO_CLIENT_SECRET||!YAHOO_REDIRECT_URI) {
    return res.status(500).send('Yahoo OAuth server credentials are incomplete.');
  }

  try{
    const basic=Buffer
      .from(`${YAHOO_CLIENT_ID}:${YAHOO_CLIENT_SECRET}`)
      .toString('base64');

    const body=new URLSearchParams({
      client_id:YAHOO_CLIENT_ID,
      client_secret:YAHOO_CLIENT_SECRET,
      redirect_uri:YAHOO_REDIRECT_URI,
      code:String(code),
      grant_type:'authorization_code'
    });

    const tokenResponse=await fetch(
      'https://api.login.yahoo.com/oauth2/get_token',
      {
        method:'POST',
        headers:{
          'Authorization':`Basic ${basic}`,
          'Content-Type':'application/x-www-form-urlencoded'
        },
        body
      }
    );

    if(!tokenResponse.ok) {
      const yahooError = await tokenResponse.text();
      console.error('Yahoo token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        body: yahooError,
        redirectUri: YAHOO_REDIRECT_URI,
        clientIdSuffix: YAHOO_CLIENT_ID.slice(-6)
      });
      return res.status(502).send(
        'Yahoo token exchange failed. Check Render logs for the Yahoo error response.'
      );
    }

    const tokens=await tokenResponse.json();

    yahooConnection={
      connected:true,
      accessToken:tokens.access_token,
      refreshToken:tokens.refresh_token,
      expiresAt:Date.now()+((tokens.expires_in||3600)*1000),
      leagueId:saved.leagueId
    };

    console.log('Yahoo OAuth connected successfully for league:', saved.leagueId);
    res.redirect('/admin');
  }catch(e){
    console.error('Yahoo OAuth callback exception:', e);
    res.status(500).send('Yahoo connection failed.');
  }
});

const LOGIN_HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Commissioner Login</title>
<style>
body{margin:0;background:#06172d;color:#fff;font-family:Inter,system-ui,-apple-system,sans-serif;min-height:100vh;display:grid;place-items:center;padding:20px}
.box{width:min(100%,420px);background:#09284b;border:1px solid #285f96;border-radius:18px;padding:22px}
.icon{width:52px;height:52px;background:#003594;border:2px solid #ffd100;border-radius:15px;display:grid;place-items:center;font-size:28px;margin-bottom:14px}
h1{font-size:24px;margin:0 0 5px}.sub{color:#b9c9da;font-size:13px}
label{display:block;font-size:12px;font-weight:800;margin-top:18px}
input{width:100%;box-sizing:border-box;margin-top:6px;padding:12px;border-radius:11px;border:1px solid #4774a0;background:#061b32;color:#fff;font-size:16px}
button{width:100%;margin-top:14px;padding:12px;border-radius:11px;background:#003594;color:#fff;border:1px solid #ffd100;font-weight:900;font-size:16px}
.err{color:#ffe36a;font-size:12px;margin-top:10px}
</style></head>
<body><div class="box"><div class="icon">🏈</div><h1>Commissioner Admin</h1><div class="sub">Sign in to manage Auction League Hub.</div>
<form method="POST" action="/admin/login"><label>Admin Password<input name="password" type="password" autocomplete="current-password" required></label>
<button type="submit">Sign In</button></form><div class="err">__ERROR__</div></div></body></html>`;

app.listen(PORT,()=>console.log(`Auction League Hub running on port ${PORT}`));
