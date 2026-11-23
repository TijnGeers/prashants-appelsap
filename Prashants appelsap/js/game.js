/* Prashants appelsap – spellogica, economie en opslag */
(function () {
  'use strict';
  var PA = window.PA;
  var SAVE_KEY = 'prashants-appelsap-save-v1';
  var COST_GROWTH = 1.15;

  PA.UPGRADE_MAP = {};
  PA.UPGRADES.forEach(function (u) { PA.UPGRADE_MAP[u.id] = u; });
  PA.BUILDING_MAP = {};
  PA.BUILDINGS.forEach(function (b) { PA.BUILDING_MAP[b.id] = b; });

  function newState() {
    return {
      v: 1, sap: 0, earned: 0, clicks: 0, clickEarned: 0, buildings: {}, upgrades: [], world: [], achievements: [],
      level: 1, golden: 0, daily: { last: null, streak: 0 }, challengesDone: 0, playTime: 0,
      lastSave: Date.now(), started: Date.now(), sound: true, buyAmount: 1, maxSps: 0, offlineTotal: 0, bought: 0
    };
  }

  var G = (PA.game = {
    state: newState(), buffs: [], sps: 0, baseSps: 0, perClick: 1, bMult: {}, globalMult: 1, clickPct: 0,
    challenge: null, goldenTimer: PA.rand(40, 80), listeners: {}, noSave: false
  });

  G.on = function (ev, fn) { (G.listeners[ev] = G.listeners[ev] || []).push(fn); };
  G.emit = function (ev, data) { (G.listeners[ev] || []).forEach(function (f) { f(data); }); };

  G.count = function (id) { return G.state.buildings[id] || 0; };
  G.has = function (id) { return G.state.upgrades.indexOf(id) !== -1; };
  G.hasWorld = function (id) { return G.state.world.indexOf(id) !== -1; };
  G.totalBuildings = function () { var t = 0; for (var k in G.state.buildings) t += G.state.buildings[k]; return t; };

  /* ---------- productie ---------- */
  G.worldMult = function () {
    var m = 1;
    PA.WORLD.forEach(function (w) { if (G.hasWorld(w.id)) m += w.bonus; });
    return m;
  };

  G.recompute = function () {
    var s = G.state, bm = {}, clickMult = 1, clickPct = 0, glob = 1;
    PA.BUILDINGS.forEach(function (b) { bm[b.id] = 1; });
    s.upgrades.forEach(function (id) {
      var u = PA.UPGRADE_MAP[id];
      if (!u) return;
      if (u.type === 'building') bm[u.target] *= u.mult;
      else if (u.type === 'click') clickMult *= u.mult;
      else if (u.type === 'clickSps') clickPct += u.pct;
      else if (u.type === 'global') glob *= u.mult;
    });
    glob *= 1 + 0.1 * (s.level - 1);
    glob *= 1 + 0.02 * s.achievements.length;
    glob *= G.worldMult();
    glob *= 1 + 0.01 * G.count('lab');
    var raw = 0;
    PA.BUILDINGS.forEach(function (b) { raw += G.count(b.id) * b.sps * bm[b.id]; });
    var prodBuff = 1, clickBuff = 1;
    G.buffs.forEach(function (b) { if (b.kind === 'prod') prodBuff *= b.mult; else clickBuff *= b.mult; });
    G.bMult = bm; G.globalMult = glob; G.clickPct = clickPct;
    G.baseSps = raw * glob;
    G.sps = G.baseSps * prodBuff;
    G.basePerClick = (1 + (s.level - 1)) * clickMult + G.baseSps * clickPct;
    G.perClick = ((1 + (s.level - 1)) * clickMult + G.sps * clickPct) * clickBuff;
    if (G.baseSps > s.maxSps) s.maxSps = G.baseSps;
  };

  G.unitSps = function (b) { return b.sps * (G.bMult[b.id] || 1) * G.globalMult; };

  G.earn = function (amount) {
    var s = G.state;
    s.sap += amount; s.earned += amount;
    if (G.challenge && G.challenge.type === 'earn') G.challenge.progress += amount;
  };

  G.click = function () {
    var amt = G.perClick;
    G.state.clicks++;
    G.state.clickEarned += amt;
    G.earn(amt);
    if (G.challenge && G.challenge.type === 'clicks') G.challenge.progress++;
    return amt;
  };

  /* ---------- gebouwen ---------- */
  G.buildingCost = function (b, amount) {
    var owned = G.count(b.id), r = COST_GROWTH;
    return Math.ceil((b.cost * Math.pow(r, owned) * (Math.pow(r, amount) - 1)) / (r - 1));
  };
  G.maxAffordable = function (b) {
    var r = COST_GROWTH, c0 = b.cost * Math.pow(r, G.count(b.id));
    var n = Math.floor(Math.log((G.state.sap * (r - 1)) / c0 + 1) / Math.log(r));
    while (n > 0 && G.buildingCost(b, n) > G.state.sap) n--;
    return Math.max(0, n);
  };
  G.amountFor = function (b) {
    var a = G.state.buyAmount;
    if (a === 'max') return Math.max(1, G.maxAffordable(b));
    return a;
  };
  G.isBuildingVisible = function (b, i) {
    if (G.count(b.id) > 0 || i === 0) return true;
    return G.state.earned >= b.cost * 0.4;
  };
  G.buyBuilding = function (id) {
    var b = PA.BUILDING_MAP[id];
    if (!b) return false;
    var n = G.amountFor(b), cost = G.buildingCost(b, n);
    if (G.state.sap < cost) { G.emit('fail'); return false; }
    G.state.sap -= cost;
    G.state.buildings[id] = G.count(id) + n;
    G.state.bought += n;
    if (G.challenge && G.challenge.type === 'buy') G.challenge.progress += n;
    G.recompute();
    G.emit('buy', { building: b, n: n });
    return true;
  };

  /* ---------- upgrades ---------- */
  G.reqMet = function (req) {
    var s = G.state;
    if (!req) return true;
    if (req.building) return G.count(req.building) >= req.count;
    if (req.clicks != null) return s.clicks >= req.clicks;
    if (req.earned != null) return s.earned >= req.earned;
    if (req.golden != null) return s.golden >= req.golden;
    return true;
  };
  G.availableUpgrades = function () {
    return PA.UPGRADES.filter(function (u) { return !G.has(u.id) && G.reqMet(u.req); })
      .sort(function (a, b) { return a.cost - b.cost; });
  };
  G.buyUpgrade = function (id) {
    var u = PA.UPGRADE_MAP[id];
    if (!u || G.has(id) || !G.reqMet(u.req)) return false;
    if (G.state.sap < u.cost) { G.emit('fail'); return false; }
    G.state.sap -= u.cost;
    G.state.upgrades.push(id);
    G.recompute();
    G.emit('upgrade', u);
    return true;
  };

  /* ---------- wereld ---------- */
  G.nextWorld = function () {
    for (var i = 0; i < PA.WORLD.length; i++) if (!G.hasWorld(PA.WORLD[i].id)) return PA.WORLD[i];
    return null;
  };
  G.buyWorld = function (id) {
    var w = G.nextWorld();
    if (!w || w.id !== id) return false;
    if (G.state.sap < w.cost) { G.emit('fail'); return false; }
    G.state.sap -= w.cost;
    G.state.world.push(id);
    G.recompute();
    G.emit('world', w);
    return true;
  };

  /* ---------- levels ---------- */
  G.levelInfo = function () {
    var s = G.state, cur = PA.LEVELS[s.level - 1], next = PA.LEVELS[s.level];
    if (!next) return { cur: cur, next: null, pct: 1 };
    var pct = (s.earned - cur.need) / (next.need - cur.need);
    return { cur: cur, next: next, pct: Math.max(0, Math.min(1, pct)) };
  };
  G.checkLevel = function () {
    var s = G.state;
    while (s.level < PA.LEVELS.length && s.earned >= PA.LEVELS[s.level].need) {
      s.level++;
      G.recompute();
      var L = PA.LEVELS[s.level - 1];
      var reward = Math.max(L.reward, G.baseSps * 180);
      s.sap += reward;
      G.emit('levelup', { level: s.level, reward: reward });
    }
  };

  /* ---------- prestaties ---------- */
  G.checkAchievements = function () {
    var s = G.state, got = [];
    PA.ACHIEVEMENTS.forEach(function (a) {
      if (s.achievements.indexOf(a.id) === -1 && a.test(s, G)) { s.achievements.push(a.id); got.push(a); }
    });
    if (got.length) { G.recompute(); got.forEach(function (a) { G.emit('achievement', a); }); }
  };

  /* ---------- gouden appel ---------- */
  G.nextGoldenDelay = function () {
    var d = PA.rand(70, 160);
    if (G.has('goud1')) d /= 2;
    return d;
  };
  G.addBuff = function (kind, mult, seconds, name, emoji) {
    if (G.has('goud2')) seconds *= 2;
    G.buffs = G.buffs.filter(function (b) { return b.kind !== kind; });
    var now = performance.now();
    G.buffs.push({ kind: kind, mult: mult, start: now, end: now + seconds * 1000, dur: seconds * 1000, name: name, emoji: emoji });
    G.recompute();
    G.emit('buffs');
  };
  G.goldenClick = function () {
    var s = G.state;
    s.golden++;
    var r = Math.random(), res;
    if (r < 0.45) {
      var gain = Math.max(G.baseSps * 60, Math.min(s.sap * 0.15, G.baseSps * 900)) + G.perClick * 10 + 13;
      G.earn(gain);
      res = { title: 'Sapregen!', text: '+' + PA.fmt(gain) + ' appelsap', amount: gain };
    } else if (r < 0.8) {
      G.addBuff('prod', 7, 30, 'Sapgekte', '🔥');
      res = { title: 'Sapgekte!', text: 'Productie ×7' };
    } else {
      G.addBuff('click', 10, 13, 'Klikkoorts', '⚡');
      res = { title: 'Klikkoorts!', text: 'Klikken ×10' };
    }
    G.recompute();
    return res;
  };

  /* ---------- uitdagingen ---------- */
  G.startChallenge = function (id) {
    if (G.challenge) return false;
    var c = PA.CHALLENGES.filter(function (x) { return x.id === id; })[0];
    if (!c) return false;
    var goal = c.goal(G, G.state);
    G.challenge = { id: c.id, def: c, type: c.type, goal: goal, progress: 0, end: performance.now() + c.time * 1000, time: c.time };
    G.emit('challengeStart', G.challenge);
    return true;
  };
  G.updateChallenge = function () {
    var c = G.challenge;
    if (!c) return;
    if (c.progress >= c.goal) {
      G.challenge = null;
      G.state.challengesDone++;
      var reward = Math.max(250, G.baseSps * 300 + G.basePerClick * 100) * (1 + 0.05 * Math.min(G.state.challengesDone, 20));
      G.state.sap += reward;
      G.emit('challengeDone', { def: c.def, reward: reward });
    } else if (performance.now() >= c.end) {
      G.challenge = null;
      G.emit('challengeFail', { def: c.def });
    }
  };

  /* ---------- dagelijkse beloning ---------- */
  G.dailyStatus = function () {
    var d = G.state.daily, today = PA.todayStr();
    var y = new Date(); y.setDate(y.getDate() - 1);
    var yesterday = PA.todayStr(y);
    var available = d.last !== today;
    var nextStreak = d.last === yesterday ? Math.min(d.streak + 1, 7) : 1;
    if (d.last === yesterday && d.streak >= 7) nextStreak = 7;
    return { available: available, nextStreak: available ? nextStreak : d.streak, streak: d.streak };
  };
  G.dailyReward = function (streak) {
    return Math.round(Math.max(100 * streak, G.baseSps * 300 * (1 + 0.5 * (streak - 1)) + G.basePerClick * 30 * streak));
  };
  G.claimDaily = function () {
    var st = G.dailyStatus();
    if (!st.available) return null;
    var reward = G.dailyReward(st.nextStreak);
    G.state.daily = { last: PA.todayStr(), streak: st.nextStreak };
    G.earn(reward);
    G.emit('daily', { reward: reward, streak: st.nextStreak });
    return reward;
  };

  /* ---------- tick ---------- */
  G.tick = function (dt) {
    var s = G.state;
    s.playTime += dt;
    if (G.sps > 0) G.earn(G.sps * dt);
    if (G.buffs.length) {
      var now = performance.now(), before = G.buffs.length;
      G.buffs = G.buffs.filter(function (b) { return b.end > now; });
      if (G.buffs.length !== before) { G.recompute(); G.emit('buffs'); }
    }
    G.goldenTimer -= dt;
    if (G.goldenTimer <= 0) { G.goldenTimer = G.nextGoldenDelay(); G.emit('spawnGolden'); }
    G.updateChallenge();
    G.checkLevel();
  };

  /* ---------- offline ---------- */
  G.applyOffline = function () {
    var s = G.state;
    var elapsed = (Date.now() - (s.lastSave || Date.now())) / 1000;
    if (elapsed < 60 || G.baseSps <= 0) return null;
    var eff = G.has('nacht') ? 1 : 0.5;
    var capped = Math.min(elapsed, 86400);
    var gain = G.baseSps * capped * eff;
    G.earn(gain);
    s.offlineTotal += gain;
    return { elapsed: elapsed, capped: capped, gain: gain, eff: eff };
  };

  /* ---------- opslaan ---------- */
  function sanitize(obj) {
    var base = newState();
    if (!obj || typeof obj !== 'object') return base;
    Object.keys(base).forEach(function (k) {
      if (obj[k] === undefined || obj[k] === null) return;
      if (typeof base[k] === 'number') { var n = Number(obj[k]); if (isFinite(n) && n >= 0) base[k] = n; }
      else if (Array.isArray(base[k])) { if (Array.isArray(obj[k])) base[k] = obj[k].filter(function (x) { return typeof x === 'string'; }); }
      else if (typeof base[k] === 'object') { if (typeof obj[k] === 'object') base[k] = Object.assign(base[k], obj[k]); }
      else base[k] = obj[k];
    });
    if ([1, 10, 100, 'max'].indexOf(base.buyAmount) === -1) base.buyAmount = 1;
    base.level = Math.max(1, Math.min(PA.LEVELS.length, Math.floor(base.level)));
    return base;
  }
  G.save = function () {
    if (G.noSave) return;
    G.state.lastSave = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.state)); G.emit('saved'); } catch (e) { /* opslag vol of geblokkeerd */ }
  };
  G.load = function () {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (raw) { G.state = sanitize(JSON.parse(raw)); return true; }
    } catch (e) { /* kapotte save */ }
    G.state = newState();
    return false;
  };
  G.exportSave = function () {
    G.state.lastSave = Date.now();
    return btoa(unescape(encodeURIComponent(JSON.stringify(G.state))));
  };
  G.importSave = function (code) {
    var obj = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    if (!obj || typeof obj.earned !== 'number') throw new Error('ongeldig');
    G.state = sanitize(obj);
    G.state.lastSave = Date.now();
    G.save();
  };
  G.reset = function () {
    G.noSave = true;
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* niets */ }
  };
})();
