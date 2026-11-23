/* Prashants appelsap – interface */
(function () {
  'use strict';
  var PA = window.PA, G = PA.game, fmt = PA.fmt, el = PA.el, esc = PA.esc;
  var $ = function (id) { return document.getElementById(id); };
  var UI = (PA.ui = { tab: 'shop' });
  var bCards = {}, upgKey = '', worldKey = '', achKey = '', chalKey = '';

  /* ---------- thema per level ---------- */
  UI.applyLevel = function () {
    var lvl = G.state.level, L = PA.LEVELS[lvl - 1], root = document.documentElement.style;
    root.setProperty('--j1', L.j1); root.setProperty('--j2', L.j2); root.setProperty('--j3', L.j3); root.setProperty('--glow', L.glow);
    var cls = ['lvl-' + lvl];
    for (var i = 2; i <= lvl; i++) cls.push('ge' + i);
    document.body.className = cls.join(' ');
    var fill = L.rainbow ? 'url(#rainbowGrad)' : 'url(#juiceGrad)';
    document.querySelectorAll('#worldSvg .jfill').forEach(function (e) { e.setAttribute('fill', fill); });
    document.querySelectorAll('#worldSvg .jstroke').forEach(function (e) { e.setAttribute('stroke', fill); });
  };

  /* ---------- statistieken bovenaan ---------- */
  var lastSapText = '';
  UI.updateStats = function () {
    var s = G.state, t = fmt(s.sap);
    if (t !== lastSapText) { $('sapValue').textContent = t; lastSapText = t; }
    $('spsValue').textContent = fmt(G.sps, true);
    $('perClick').textContent = fmt(G.perClick, true);
    var li = G.levelInfo();
    $('levelValue').textContent = s.level;
    $('levelName').textContent = li.cur.name;
    $('levelBar').style.width = (li.pct * 100).toFixed(1) + '%';
    $('levelProgress').setAttribute('aria-valuenow', Math.round(li.pct * 100));
    $('levelNext').textContent = li.next
      ? 'Nog ' + fmt(li.next.need - s.earned) + ' appelsap verdienen tot level ' + (s.level + 1) + ': ' + li.next.name.toLowerCase()
      : 'Maximaal level bereikt! Jij bent een appelsaplegende 🌟';
    $('glassJuice').style.height = (8 + li.pct * 80).toFixed(1) + '%';
    $('glassLabel').textContent = li.next ? Math.floor(li.pct * 100) + '%' : 'MAX';
    var ds = G.dailyStatus(), db = $('btnDaily');
    db.classList.toggle('ready', ds.available);
    db.querySelector('.dot').hidden = !ds.available;
    var nw = G.nextWorld();
    document.querySelector('#t-world .dot').hidden = !(nw && s.sap >= nw.cost);
    document.title = fmt(s.sap) + ' appelsap – Prashants appelsap';
  };
  UI.bumpSap = function () {
    var b = $('sapValue');
    b.classList.add('bump');
    clearTimeout(UI._bt);
    UI._bt = setTimeout(function () { b.classList.remove('bump'); }, 90);
  };

  /* ---------- shop ---------- */
  UI.buildShop = function () {
    var list = $('buildingList');
    list.innerHTML = '';
    PA.BUILDINGS.forEach(function (b, i) {
      var btn = el('button', 'bld');
      btn.type = 'button';
      btn.dataset.id = b.id;
      btn.innerHTML = '<span class="be">' + b.emoji + '</span>' +
        '<span class="bn"><span class="bname">' + esc(b.name) + '</span>' + (i < 9 ? '<kbd>' + (i + 1) + '</kbd>' : '') + '</span>' +
        '<span class="bo">0</span><span class="bc"></span><span class="bp"></span><span class="bdesc">' + esc(b.desc) + '</span>';
      btn.addEventListener('click', function (e) { UI.onBuyBuilding(b.id, e); });
      list.appendChild(btn);
      bCards[b.id] = { btn: btn, name: btn.querySelector('.bname'), owned: btn.querySelector('.bo'), cost: btn.querySelector('.bc'), prod: btn.querySelector('.bp'), emoji: btn.querySelector('.be') };
    });
    document.querySelectorAll('.amount button').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.dataset.amt; G.state.buyAmount = v === 'max' ? 'max' : Number(v);
        UI.updateShop(); PA.audio.tick();
      });
    });
  };
  UI.onBuyBuilding = function (id, e) {
    if (G.buyBuilding(id)) {
      var c = bCards[id];
      c.btn.classList.remove('bought'); void c.btn.offsetWidth; c.btn.classList.add('bought');
      var r = c.btn.getBoundingClientRect();
      PA.fx.splash(r.left + 30, r.top + r.height / 2, G.state.level, 8, 0.6);
    }
  };

  UI.updateShop = function () {
    var s = G.state, shownLocked = false;
    document.querySelectorAll('.amount button').forEach(function (b) { b.classList.toggle('on', String(s.buyAmount) === b.dataset.amt); });
    PA.BUILDINGS.forEach(function (b, i) {
      var c = bCards[b.id], visible = G.isBuildingVisible(b, i);
      if (!visible) {
        if (shownLocked) { c.btn.hidden = true; return; }
        shownLocked = true;
        c.btn.hidden = false; c.btn.classList.add('locked'); c.btn.classList.remove('can');
        c.name.textContent = '???'; c.emoji.textContent = '❓';
        c.cost.textContent = '🧃 ' + fmt(b.cost); c.prod.textContent = 'Verdien meer appelsap om dit te ontdekken';
        c.owned.textContent = ''; c.btn.tabIndex = -1;
        return;
      }
      c.btn.hidden = false; c.btn.classList.remove('locked'); c.btn.tabIndex = 0;
      c.name.textContent = b.name; c.emoji.textContent = b.emoji;
      var n = G.amountFor(b), cost = G.buildingCost(b, n), owned = G.count(b.id);
      c.cost.textContent = '🧃 ' + fmt(cost) + (n > 1 ? '  (×' + n + ')' : '');
      var unit = G.unitSps(b);
      c.prod.textContent = 'Elk ' + fmt(unit, true) + '/sec' + (owned ? ' · totaal ' + fmt(unit * owned, true) + '/sec' : '');
      c.owned.textContent = owned;
      c.btn.classList.toggle('can', s.sap >= cost);
      c.btn.setAttribute('aria-label', b.name + ', bezit ' + owned + ', kost ' + fmt(cost) + ' appelsap');
    });
    var av = G.availableUpgrades(), key = av.map(function (u) { return u.id; }).join(',');
    var wrap = $('upgradeList');
    if (key !== upgKey) {
      upgKey = key;
      wrap.innerHTML = '';
      if (!av.length) wrap.innerHTML = '<p class="muted empty">Nog geen upgrades beschikbaar. Klik en koop sapmakers om nieuwe upgrades te ontdekken!</p>';
      av.forEach(function (u) {
        var b = el('button', 'upg');
        b.type = 'button'; b.dataset.id = u.id;
        b.innerHTML = '<span class="ue">' + u.emoji + '</span><span class="un">' + esc(u.name) + '</span><span class="ud">' + esc(u.desc) + '</span><span class="uc">🧃 ' + fmt(u.cost) + '</span>';
        b.setAttribute('aria-label', u.name + ': ' + u.desc + ' Kost ' + fmt(u.cost));
        b.addEventListener('click', function () {
          var r = b.getBoundingClientRect();
          if (G.buyUpgrade(u.id)) PA.fx.sparkle(r.left + r.width / 2, r.top + r.height / 2, 10, 30);
        });
        wrap.appendChild(b);
      });
    }
    wrap.querySelectorAll('.upg').forEach(function (b) {
      var u = PA.UPGRADE_MAP[b.dataset.id];
      b.classList.toggle('can', s.sap >= u.cost);
    });
  };

  /* ---------- wereld ---------- */
  UI.renderWorld = function (popId) {
    var s = G.state, svg = $('worldSvg');
    PA.WORLD.forEach(function (w) {
      var on = G.hasWorld(w.id);
      svg.classList.toggle('has-' + w.id, on);
      svg.querySelectorAll('[data-part="' + w.id + '"]').forEach(function (p) {
        p.classList.toggle('on', on);
        if (popId === w.id) { p.classList.remove('pop'); void p.getBoundingClientRect(); p.classList.add('pop'); }
      });
    });
    $('worldCount').textContent = s.world.length + '/' + PA.WORLD.length;
    $('worldBonus').textContent = '+' + Math.round((G.worldMult() - 1) * 100) + '%';
    var next = G.nextWorld(), list = $('worldList'), key = s.world.join(',');
    if (key !== worldKey || popId) {
      worldKey = key;
      list.innerHTML = '';
      PA.WORLD.forEach(function (w) {
        var done = G.hasWorld(w.id), isNext = next && next.id === w.id;
        var row = el('div', 'wp' + (done ? ' done' : isNext ? ' next' : ' locked'));
        var action = done ? '<span class="tag">✓ Gebouwd</span>'
          : isNext ? '<button class="btn primary small" data-world="' + w.id + '">Bouwen<br>🧃 ' + fmt(w.cost) + '</button>'
          : '<span class="muted">🔒 ' + fmt(w.cost) + '</span>';
        row.innerHTML = '<span class="we">' + w.emoji + '</span><span class="wn">' + esc(w.name) + ' <small class="muted">+' + Math.round(w.bonus * 100) + '% productie</small></span>' +
          '<span class="wd">' + esc(w.desc) + '</span><span class="wa">' + action + '</span>';
        list.appendChild(row);
      });
      var nb = list.querySelector('[data-world]');
      if (nb) nb.addEventListener('click', function () { G.buyWorld(nb.dataset.world); });
    }
    var btn = list.querySelector('[data-world]');
    if (btn && next) btn.disabled = s.sap < next.cost;
  };

  /* ---------- uitdagingen & achievements ---------- */
  UI.renderChallenges = function (force) {
    var key = (G.challenge ? G.challenge.id : '-') + G.state.challengesDone + Math.round(Math.log10(G.baseSps + 1) * 4);
    if (key === chalKey && !force) return;
    chalKey = key;
    var wrap = $('challengeList');
    wrap.innerHTML = '';
    PA.CHALLENGES.forEach(function (c) {
      var active = G.challenge && G.challenge.id === c.id;
      var goal = active ? G.challenge.goal : c.goal(G, G.state);
      var row = el('div', 'chal');
      row.innerHTML = '<span class="ce">' + c.emoji + '</span><span class="cn">' + esc(c.name) + '</span><span class="cd">' + esc(c.text(goal)) + '</span>' +
        '<span class="cb"><button class="btn gold small" data-chal="' + c.id + '"' + (G.challenge ? ' disabled' : '') + '>' + (active ? 'Bezig…' : 'Start') + '</button></span>';
      wrap.appendChild(row);
    });
    wrap.querySelectorAll('[data-chal]').forEach(function (b) {
      b.addEventListener('click', function () { G.startChallenge(b.dataset.chal); });
    });
  };
  UI.renderAchievements = function () {
    var s = G.state, key = s.achievements.length;
    if (key === achKey) return;
    achKey = key;
    $('achCount').textContent = s.achievements.length + '/' + PA.ACHIEVEMENTS.length + ' behaald';
    var wrap = $('achList');
    wrap.innerHTML = '';
    PA.ACHIEVEMENTS.forEach(function (a) {
      var got = s.achievements.indexOf(a.id) !== -1;
      var d = el('div', 'ach' + (got ? ' got' : ''));
      d.innerHTML = '<div class="ae">' + a.emoji + '</div><div class="an">' + esc(got ? a.name : '???') + '</div><div class="ad">' + esc(a.desc) + '</div>';
      d.title = got ? 'Behaald!' : 'Nog niet behaald';
      wrap.appendChild(d);
    });
  };

  UI.updateChallengeBanner = function () {
    var c = G.challenge, ban = $('challengeBanner');
    if (!c) { ban.hidden = true; return; }
    ban.hidden = false;
    var left = Math.max(0, (c.end - performance.now()) / 1000);
    var pct = Math.min(100, (c.progress / c.goal) * 100);
    var prog = c.type === 'earn' ? fmt(c.progress) + ' / ' + fmt(c.goal) : Math.floor(c.progress) + ' / ' + c.goal;
    ban.innerHTML = '<div class="cb-top"><span>' + c.def.emoji + ' ' + esc(c.def.name) + '</span><span>⏱️ ' + left.toFixed(1) + 's</span></div>' +
      '<small>' + prog + '</small><div class="cb-bar"><i style="width:' + pct.toFixed(1) + '%"></i></div>';
  };

  UI.updateBuffs = function () {
    var wrap = $('buffs'), now = performance.now();
    if (!G.buffs.length) { if (wrap.innerHTML) wrap.innerHTML = ''; return; }
    wrap.innerHTML = G.buffs.map(function (b) {
      var left = Math.max(0, b.end - now), pct = (left / b.dur) * 100;
      return '<div class="buff">' + b.emoji + ' ' + esc(b.name) + ' ×' + b.mult + ' · ' + Math.ceil(left / 1000) + 's<i class="bar" style="width:' + pct + '%"></i></div>';
    }).join('');
  };

  /* ---------- overzicht ---------- */
  UI.renderOverview = function () {
    var s = G.state;
    var stats = [
      ['Totaal ooit verdiend', fmt(s.earned)], ['Appelsap per seconde', fmt(G.baseSps, true)], ['Hoogste productie', fmt(s.maxSps, true) + '/sec'],
      ['Per klik', fmt(G.basePerClick, true)], ['Aantal klikken', fmt(s.clicks)], ['Verdiend met klikken', fmt(s.clickEarned)],
      ['Gebouwen', fmt(G.totalBuildings())], ['Upgrades', s.upgrades.length + '/' + PA.UPGRADES.length], ['Gouden appels', fmt(s.golden)],
      ['Uitdagingen gehaald', s.challengesDone], ['Dagenreeks', s.daily.streak + ' 🔥'], ['Offline verdiend', fmt(s.offlineTotal)],
      ['Speeltijd', PA.fmtTime(s.playTime)], ['Totale bonus', '×' + G.globalMult.toFixed(2).replace('.', ',')]
    ];
    $('statGrid').innerHTML = stats.map(function (x) { return '<div class="sg"><small>' + x[0] + '</small><b>' + x[1] + '</b></div>'; }).join('');
    $('swatches').innerHTML = PA.LEVELS.map(function (L, i) {
      var got = s.level > i, bg = L.rainbow ? 'linear-gradient(90deg,#FF5E7E,#FFB347,#FFE74C,#6BDC6B,#4FC3FF,#A77BFF)'
        : L.gold ? 'linear-gradient(135deg,#C68F00,#FFD54A,#FFF6C2,#FFD54A)' : 'linear-gradient(to top,' + L.j3 + ',' + L.j2 + ',' + L.j1 + ')';
      return '<div class="sw' + (got ? '' : ' lock') + '"><i style="background:' + bg + '"></i>' + (got ? 'Lvl ' + (i + 1) + ': ' + esc(L.name.replace(' appelsap', '').replace('appelsap', '')) : 'Level ' + (i + 1) + ' 🔒') + '</div>';
    }).join('');
    var b = PA.BUILDINGS.map(function (x) { var n = G.count(x.id); return '<span class="chip' + (n ? '' : ' off') + '">' + x.emoji + ' ' + esc(x.name) + (n ? ' ×' + n : '') + '</span>'; }).join('');
    var w = PA.WORLD.map(function (x) { return '<span class="chip' + (G.hasWorld(x.id) ? '' : ' off') + '">' + x.emoji + ' ' + esc(x.name) + '</span>'; }).join('');
    var u = s.upgrades.map(function (id) { var x = PA.UPGRADE_MAP[id]; return x ? '<span class="chip" title="' + esc(x.desc) + '">' + x.emoji + ' ' + esc(x.name) + '</span>' : ''; }).join('') || '<span class="muted">Nog geen upgrades gekocht.</span>';
    $('unlocked').innerHTML = '<div class="unlock-group"><h3>🏗️ Sapmakers</h3><div class="chips">' + b + '</div></div>' +
      '<div class="unlock-group"><h3>🌍 Wereld</h3><div class="chips">' + w + '</div></div>' +
      '<div class="unlock-group"><h3>✨ Upgrades</h3><div class="chips">' + u + '</div></div>';
  };

  /* ---------- tabs ---------- */
  UI.TABS = ['shop', 'world', 'ach', 'overview'];
  UI.setTab = function (name, focus) {
    UI.tab = name;
    UI.TABS.forEach(function (t) {
      var on = t === name, btn = $('t-' + t);
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on);
      btn.tabIndex = on ? 0 : -1;
      $('tab-' + t).hidden = !on;
    });
    if (focus) $('t-' + name).focus();
    UI.refresh(true);
  };

  UI.refresh = function (all) {
    UI.updateStats();
    if (UI.tab === 'shop' || all) UI.updateShop();
    if (UI.tab === 'world' || all) UI.renderWorld();
    if (UI.tab === 'ach' || all) { UI.renderChallenges(); UI.renderAchievements(); }
    if (UI.tab === 'overview') UI.renderOverview();
  };

  /* ---------- toasts ---------- */
  UI.toast = function (emoji, title, sub, gold) {
    var t = el('div', 'toast' + (gold ? ' gold' : ''), '<span class="te">' + emoji + '</span><div><b>' + esc(title) + '</b><small>' + esc(sub || '') + '</small></div>');
    var wrap = $('toasts');
    wrap.appendChild(t);
    while (wrap.children.length > 4) wrap.removeChild(wrap.firstChild);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 400); }, 3200);
  };

  /* ---------- modal ---------- */
  var modalQueue = [], modalOpen = false, lastFocus = null, onClose = null;
  UI.modal = function (opts) { modalQueue.push(opts); if (!modalOpen) showNext(); };
  UI.isModalOpen = function () { return modalOpen; };
  function showNext() {
    var o = modalQueue.shift();
    if (!o) return;
    modalOpen = true;
    lastFocus = document.activeElement;
    var body = $('modalBody');
    body.innerHTML = (o.emoji ? '<div class="modal-emoji">' + o.emoji + '</div>' : '') + '<h2 id="modalTitle">' + esc(o.title) + '</h2>' + (o.html || '') + '<div class="modal-actions"></div>';
    var actions = body.querySelector('.modal-actions');
    (o.buttons || [{ label: 'Top!', primary: true }]).forEach(function (b) {
      var btn = el('button', 'btn ' + (b.cls || (b.primary ? 'primary' : '')), esc(b.label));
      btn.addEventListener('click', function () {
        if (b.action && b.action(body) === false) return;
        UI.closeModal();
      });
      actions.appendChild(btn);
    });
    onClose = o.onClose || null;
    $('modal').hidden = false;
    var f = body.querySelector('textarea') || actions.querySelector('.primary') || actions.querySelector('button');
    if (f) setTimeout(function () { f.focus(); }, 30);
  }
  UI.closeModal = function () {
    $('modal').hidden = true;
    modalOpen = false;
    if (onClose) { var c = onClose; onClose = null; c(); }
    if (modalQueue.length) showNext();
    else if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus();
  };
  UI.trapFocus = function (e) {
    if (!modalOpen || e.key !== 'Tab') return;
    var f = $('modal').querySelectorAll('button, textarea');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  /* ---------- gouden appel ---------- */
  var goldTimeout = null;
  UI.spawnGolden = function () {
    var g = $('golden');
    if (!g.hidden) return;
    var area = $('clicker').getBoundingClientRect();
    var vw = window.innerWidth, vh = window.innerHeight;
    var x = PA.rand(Math.max(10, area.left), Math.min(vw - 94, area.right - 90));
    var y = PA.rand(Math.max(70, area.top), Math.min(vh - 100, Math.max(area.top + 100, area.bottom - 120)));
    g.style.left = x + 'px'; g.style.top = y + 'px';
    g.classList.remove('leaving');
    g.hidden = false;
    PA.audio.golden();
    UI.toast('🍏', 'Een gouden appel!', 'Snel, klik erop (of druk op G)', true);
    clearTimeout(goldTimeout);
    goldTimeout = setTimeout(function () {
      g.classList.add('leaving');
      setTimeout(function () { g.hidden = true; }, 1000);
    }, 13000);
  };
  UI.catchGolden = function () {
    var g = $('golden');
    if (g.hidden || g.classList.contains('leaving')) return;
    clearTimeout(goldTimeout);
    var r = g.getBoundingClientRect();
    g.hidden = true;
    var res = G.goldenClick();
    PA.fx.sparkle(r.left + r.width / 2, r.top + r.height / 2, 30, 50);
    PA.fx.text(r.left + r.width / 2, r.top, res.title, true);
    PA.audio.golden();
    UI.toast('🍏', res.title, res.text, true);
    UI.refresh();
  };

  /* ---------- nieuws ---------- */
  UI.nextNews = function () {
    var s = G.state, pool = [];
    for (var i = 0; i < s.level; i++) pool = pool.concat(PA.NEWS[i]);
    var extra = [];
    if (G.count('boom') > 10) extra.push('Nieuws: vogels bouwen nestjes in de ' + G.count('boom') + ' appelbomen van Prashant.');
    if (s.world.length) extra.push('Toeristen stromen toe naar het ' + PA.WORLD[s.world.length - 1].name.toLowerCase() + '!');
    if (s.golden) extra.push('Gerucht: er is weer een gouden appel gespot. Ogen open!');
    if (G.sps > 0) extra.push('Live: Prashants appelsapimperium maakt nu ' + fmt(G.sps, true) + ' appelsap per seconde.');
    pool = pool.concat(extra, extra);
    var t = $('tickerText');
    t.textContent = PA.pick(pool);
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
  };

  /* ---------- vensters ---------- */
  UI.showLevelUp = function (d) {
    var L = PA.LEVELS[d.level - 1];
    UI.modal({
      emoji: '🎉', title: 'Level ' + d.level + '!',
      html: '<p>Je appelsap is veranderd in <b>' + esc(L.name) + '</b>!</p>' +
        '<div class="lvl-glass"><div class="glass"><div class="juice" style="height:80%"><div class="wave"></div><div class="bubbles"><i></i><i></i><i></i><i></i><i></i></div></div><div class="glass-shine"></div></div></div>' +
        '<div class="reward-box">Beloning<b>+' + fmt(d.reward) + ' appelsap</b>+10% productie en +1 per klik, voor altijd</div>' +
        (PA.LEVEL_PERKS[d.level - 1] ? '<p>✨ ' + esc(PA.LEVEL_PERKS[d.level - 1]) + '</p>' : ''),
      buttons: [{ label: 'Hoera! 🍎', primary: true }]
    });
  };

  UI.showDaily = function () {
    var st = G.dailyStatus(), streak = st.available ? st.nextStreak : st.streak;
    var days = '';
    for (var i = 1; i <= 7; i++) {
      var cls = i < streak || (!st.available && i === streak) ? 'done' : (st.available && i === streak ? 'today' : '');
      days += '<div class="day ' + cls + '"><span>' + (i === 7 ? '👑' : cls === 'done' ? '✅' : '🎁') + '</span>Dag ' + i + '</div>';
    }
    if (st.available) {
      var reward = G.dailyReward(streak);
      UI.modal({
        emoji: '🎁', title: 'Dagelijkse beloning',
        html: '<p>Kom elke dag terug voor een grotere beloning!</p><div class="days">' + days + '</div><div class="reward-box">Vandaag (dag ' + streak + ')<b>+' + fmt(reward) + ' appelsap</b></div>',
        buttons: [{ label: 'Ophalen! 🎉', cls: 'gold', action: function () { G.claimDaily(); } }]
      });
    } else {
      UI.modal({
        emoji: '⏰', title: 'Al opgehaald',
        html: '<p>Je hebt je beloning van vandaag al. Kom morgen terug voor dag ' + Math.min(st.streak + 1, 7) + '!</p><div class="days">' + days + '</div>',
        buttons: [{ label: 'Oké', primary: true }]
      });
    }
  };

  UI.showHelp = function () {
    UI.modal({
      emoji: '🍎', title: 'Zo speel je',
      html: '<p>Klik op de appel om appelsap te maken. Koop sapmakers die automatisch sap maken, koop upgrades en bouw een complete appelsapwereld! Je appelsap verandert van kleur bij elk nieuw level.</p>' +
        '<div class="keys"><kbd>Spatie</kbd><span>Op de appel klikken</span><kbd>1 – 9</kbd><span>Sapmaker kopen</span>' +
        '<kbd>U W P O</kbd><span>Shop, Wereld, Prestaties, Overzicht</span><kbd>B</kbd><span>Volgende wereld-deel bouwen</span>' +
        '<kbd>X</kbd><span>Wissel ×1 / ×10 / ×100 / Max</span><kbd>G</kbd><span>Gouden appel pakken</span><kbd>D</kbd><span>Dagelijkse beloning</span>' +
        '<kbd>M</kbd><span>Geluid aan/uit</span><kbd>Tab / Enter</kbd><span>Door knoppen lopen en kiezen</span><kbd>Esc</kbd><span>Venster sluiten</span></div>' +
        '<p class="muted">Op je telefoon tik je gewoon op alles. Je voortgang wordt automatisch opgeslagen en je verdient ook appelsap als het spel dicht is.</p>',
      buttons: [{ label: 'Spelen!', primary: true }]
    });
  };
})();
