/* Prashants appelsap – opstarten, invoer en spellus */
(function () {
  'use strict';
  var PA = window.PA, G = PA.game, UI = PA.ui, fmt = PA.fmt;
  var $ = function (id) { return document.getElementById(id); };

  function doClick(x, y) {
    PA.audio.unlock();
    var amt = G.click();
    var apple = $('apple');
    apple.classList.remove('squish'); void apple.offsetWidth; apple.classList.add('squish');
    var lvl = G.state.level;
    PA.fx.splash(x, y, lvl, lvl >= 4 ? 16 : 11, lvl >= 4 ? 1.25 : 1);
    PA.fx.text(x, y - 20, '+' + fmt(amt, true));
    PA.audio.click();
    UI.bumpSap();
  }

  function appleCenter() {
    var r = $('apple').getBoundingClientRect();
    return { x: r.left + r.width / 2 + PA.rand(-r.width * 0.2, r.width * 0.2), y: r.top + r.height * 0.5 + PA.rand(-r.height * 0.15, r.height * 0.15) };
  }

  function bindInput() {
    var apple = $('apple');
    apple.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      doClick(e.clientX, e.clientY);
    });
    apple.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); if (!e.repeat) { var c = appleCenter(); doClick(c.x, c.y); } }
    });
    apple.addEventListener('click', function (e) { e.preventDefault(); });
    apple.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    $('golden').addEventListener('click', UI.catchGolden);
    $('btnDaily').addEventListener('click', UI.showDaily);
    $('btnHelp').addEventListener('click', UI.showHelp);
    $('btnSound').addEventListener('click', toggleSound);
    document.querySelectorAll('.tab').forEach(function (t) {
      t.addEventListener('click', function () { UI.setTab(t.dataset.tab); });
      t.addEventListener('keydown', function (e) {
        var i = UI.TABS.indexOf(UI.tab);
        if (e.key === 'ArrowRight') { e.preventDefault(); UI.setTab(UI.TABS[(i + 1) % 4], true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); UI.setTab(UI.TABS[(i + 3) % 4], true); }
      });
    });
    $('modal').addEventListener('pointerdown', function (e) { if (e.target === $('modal')) UI.closeModal(); });

    $('btnSave').addEventListener('click', function () { G.save(); UI.toast('💾', 'Opgeslagen!', 'Je voortgang is veilig.'); });
    $('btnExport').addEventListener('click', function () {
      var code = G.exportSave();
      UI.modal({ emoji: '📤', title: 'Exporteren', html: '<p>Bewaar deze code om je voortgang naar een ander apparaat of andere browser te verhuizen.</p><textarea readonly>' + code + '</textarea>',
        buttons: [{ label: 'Kopiëren', primary: true, action: function (body) { var ta = body.querySelector('textarea'); ta.select(); try { navigator.clipboard.writeText(code); } catch (e) { document.execCommand('copy'); } UI.toast('📋', 'Gekopieerd!', ''); } }, { label: 'Sluiten' }] });
    });
    $('btnImport').addEventListener('click', function () {
      UI.modal({ emoji: '📥', title: 'Importeren', html: '<p>Plak hier je exportcode. Je huidige voortgang wordt vervangen.</p><textarea placeholder="Plak je code hier…"></textarea>',
        buttons: [{ label: 'Laden', primary: true, action: function (body) {
          try { G.importSave(body.querySelector('textarea').value); location.reload(); }
          catch (e) { UI.toast('⚠️', 'Ongeldige code', 'Controleer of je de hele code hebt geplakt.'); return false; }
        } }, { label: 'Annuleren' }] });
    });
    $('btnReset').addEventListener('click', function () {
      UI.modal({ emoji: '😱', title: 'Opnieuw beginnen?', html: '<p>Al je appelsap, gebouwen, upgrades, wereld en achievements worden gewist. Dit kan niet ongedaan worden gemaakt!</p>',
        buttons: [{ label: 'Nee, terug', primary: true }, { label: 'Ja, alles wissen', cls: 'danger', action: function () { G.reset(); location.reload(); } }] });
    });

    document.addEventListener('keydown', onKey);
  }

  function toggleSound() {
    G.state.sound = !G.state.sound;
    PA.audio.enabled = G.state.sound;
    $('btnSound').textContent = G.state.sound ? '🔊' : '🔇';
    UI.toast(G.state.sound ? '🔊' : '🔇', G.state.sound ? 'Geluid aan' : 'Geluid uit', '');
  }

  function onKey(e) {
    if (UI.isModalOpen()) {
      UI.trapFocus(e);
      if (e.key === 'Escape') { e.preventDefault(); UI.closeModal(); }
      return;
    }
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'TEXTAREA' || tag === 'INPUT' || e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key.toLowerCase();
    if (e.code === 'Space' || k === ' ') {
      var onOtherButton = tag === 'BUTTON' && e.target.id !== 'apple';
      if (onOtherButton) return;
      e.preventDefault();
      if (e.repeat) return;
      var c = appleCenter();
      doClick(c.x, c.y);
      return;
    }
    if (e.repeat && !/^[1-9]$/.test(k)) return;
    if (/^[1-9]$/.test(k)) {
      var b = PA.BUILDINGS[Number(k) - 1];
      if (b && G.isBuildingVisible(b, Number(k) - 1)) UI.onBuyBuilding(b.id);
      return;
    }
    switch (k) {
      case 'u': UI.setTab('shop'); break;
      case 'w': UI.setTab('world'); break;
      case 'p': UI.setTab('ach'); break;
      case 'o': UI.setTab('overview'); break;
      case 'g': UI.catchGolden(); break;
      case 'd': UI.showDaily(); break;
      case 'm': toggleSound(); break;
      case 'h': case '?': UI.showHelp(); break;
      case 'b': var w = G.nextWorld(); if (w) { UI.setTab('world'); G.buyWorld(w.id); } break;
      case 'x': var order = [1, 10, 100, 'max'], i = order.indexOf(G.state.buyAmount);
        G.state.buyAmount = order[(i + 1) % 4]; UI.setTab('shop'); UI.toast('🛒', 'Koop ' + (G.state.buyAmount === 'max' ? 'zoveel mogelijk' : '×' + G.state.buyAmount), ''); break;
      default: return;
    }
  }

  function bindGameEvents() {
    G.on('buy', function () { PA.audio.buy(); UI.refresh(); });
    G.on('upgrade', function (u) { PA.audio.buy(); UI.toast(u.emoji, u.name, u.desc); UI.refresh(true); });
    G.on('fail', function () { PA.audio.fail(); UI.toast('🧃', 'Niet genoeg appelsap', 'Klik nog even door!'); });
    G.on('world', function (w) {
      PA.audio.world();
      UI.renderWorld(w.id);
      UI.applyLevel();
      PA.fx.confetti(90);
      UI.modal({ emoji: w.emoji, title: w.name + ' gebouwd!', html: '<p>' + PA.esc(w.desc) + '</p><div class="reward-box">Wereldbonus<b>+' + Math.round(w.bonus * 100) + '% productie</b></div>' +
        (w.id === 'planeet' ? '<p>🌟 <b>Gefeliciteerd!</b> Je bent begonnen met één klein glaasje en hebt nu een complete magische appelsapplaneet! Speel door om alle levels en achievements te halen.</p>' : ''),
        buttons: [{ label: 'Bekijk mijn wereld', primary: true, action: function () { UI.setTab('world'); } }] });
      UI.refresh(true);
    });
    G.on('levelup', function (d) {
      UI.applyLevel();
      PA.audio.levelUp();
      PA.fx.confetti(160);
      var a = $('apple').getBoundingClientRect();
      PA.fx.splash(a.left + a.width / 2, a.top + a.height / 2, d.level, 40, 1.8);
      var gw = document.querySelector('.glass-wrap');
      gw.classList.remove('pop'); void gw.offsetWidth; gw.classList.add('pop');
      UI.showLevelUp(d);
      UI.refresh(true);
    });
    G.on('achievement', function (a) { PA.audio.achievement(); UI.toast('🏆', 'Achievement: ' + a.name, a.desc + ' (+2% productie)', true); });
    G.on('spawnGolden', UI.spawnGolden);
    G.on('buffs', UI.updateBuffs);
    G.on('daily', function (d) { PA.audio.daily(); PA.fx.confetti(80); UI.toast('🎁', 'Dag ' + d.streak + ' opgehaald!', '+' + fmt(d.reward) + ' appelsap', true); UI.refresh(); });
    G.on('challengeStart', function (c) { PA.audio.tick(); UI.toast(c.def.emoji, c.def.name + ' gestart!', c.def.text(c.goal)); UI.renderChallenges(true); UI.updateChallengeBanner(); });
    G.on('challengeDone', function (d) {
      PA.audio.levelUp(); PA.fx.confetti(70);
      UI.toast('🏅', 'Uitdaging gehaald!', d.def.name + ': +' + fmt(d.reward) + ' appelsap', true);
      UI.renderChallenges(true); UI.updateChallengeBanner();
    });
    G.on('challengeFail', function (d) { PA.audio.fail(); UI.toast('⏰', 'Tijd is op!', d.def.name + ' niet gehaald. Probeer het nog eens!'); UI.renderChallenges(true); UI.updateChallengeBanner(); });
    G.on('saved', function () { $('saveInfo').textContent = 'Automatisch opgeslagen om ' + new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.'; });
  }

  /* ---------- lus ---------- */
  var last = performance.now(), acc = 0, slow = 0, news = 0, save = 0;
  function frame(now) {
    var dt = Math.min((now - last) / 1000, 1);
    last = now;
    G.tick(dt);
    PA.fx.update(dt);
    acc += dt; slow += dt; news += dt; save += dt;
    if (acc >= 0.1) { acc = 0; UI.updateStats(); if (G.challenge) UI.updateChallengeBanner(); if (G.buffs.length) UI.updateBuffs(); }
    if (slow >= 0.5) { slow = 0; G.checkAchievements(); UI.refresh(); }
    if (news >= 9) { news = 0; UI.nextNews(); }
    if (save >= 5) { save = 0; G.save(); }
    requestAnimationFrame(frame);
  }

  /* achtergrond: tijd bijhouden als het tabblad verborgen is */
  var hiddenAt = 0;
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { hiddenAt = Date.now(); G.save(); }
    else if (hiddenAt) {
      var gone = (Date.now() - hiddenAt) / 1000;
      hiddenAt = 0;
      if (gone > 2) { G.earn(G.baseSps * Math.min(gone, 86400)); last = performance.now(); }
    }
  });
  window.addEventListener('pagehide', function () { G.save(); });
  window.addEventListener('beforeunload', function () { G.save(); });

  function init() {
    PA.fx.init();
    var hadSave = G.load();
    PA.audio.enabled = G.state.sound;
    $('btnSound').textContent = G.state.sound ? '🔊' : '🔇';
    G.recompute();
    UI.buildShop();
    UI.applyLevel();
    UI.renderWorld();
    UI.setTab('shop');
    UI.nextNews();
    bindInput();
    bindGameEvents();

    if (!hadSave) {
      UI.modal({ emoji: '🧃', title: 'Welkom bij Prashants appelsap!',
        html: '<p>Je begint met <b>één klein glaasje appelsap</b>. Klik op de grote appel om meer sap te maken.</p><p>Koop sapmakers, ontdek nieuwe sapkleuren en bouw uiteindelijk een <b>gigantische magische appelsapwereld</b>!</p><p class="muted">Tip: druk op <kbd>Spatie</kbd> om te klikken en <kbd>H</kbd> voor alle sneltoetsen.</p>',
        buttons: [{ label: 'Laten we persen! 🍎', primary: true }] });
    } else {
      var off = G.applyOffline();
      if (off && off.gain > 0) {
        UI.modal({ emoji: '😴', title: 'Welkom terug!',
          html: '<p>Je was ' + PA.fmtTime(off.elapsed) + ' weg. Je sapmakers hebben gewoon doorgewerkt!</p><div class="reward-box">Offline verdiend<b>+' + fmt(off.gain) + ' appelsap</b>' +
            Math.round(off.eff * 100) + '% van je productie' + (off.elapsed > off.capped ? ' (max. 24 uur)' : '') + '</div>' +
            (off.eff < 1 ? '<p class="muted">Tip: koop de upgrade 🌙 Nachtpers voor 100% offline productie.</p>' : ''),
          buttons: [{ label: 'Lekker! 🧃', primary: true }] });
      }
      G.checkLevel();
    }
    if (G.dailyStatus().available && hadSave) setTimeout(function () { UI.toast('🎁', 'Je dagelijkse beloning staat klaar!', 'Druk op D of tik op het cadeautje'); }, 1500);
    G.checkAchievements();
    UI.refresh(true);
    $('fallback').remove();
    requestAnimationFrame(function (t) { last = t; frame(t); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
