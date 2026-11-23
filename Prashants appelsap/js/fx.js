/* Prashants appelsap – deeltjes: sapspetters, confetti, fonkelingen, zwevende getallen */
(function () {
  'use strict';
  var PA = window.PA;
  var cv, ctx, W = 0, H = 0;
  var parts = [], texts = [];
  var RAINBOW = ['#FF5E7E', '#FFB347', '#FFE74C', '#6BDC6B', '#4FC3FF', '#A77BFF'];
  var GOLD = ['#FFF1A8', '#FFD54A', '#E6B422', '#FFFFFF', '#FFC400'];

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  var fx = (PA.fx = {});
  fx.init = function () {
    cv = document.getElementById('fx');
    ctx = cv.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  };

  fx.colors = function (level) {
    var L = PA.LEVELS[level - 1];
    if (L.rainbow) return RAINBOW;
    if (L.gold) return GOLD;
    return [L.j1, L.j2, L.j3, L.j2];
  };

  fx.splash = function (x, y, level, count, power) {
    var cols = fx.colors(level);
    power = power || 1;
    if (parts.length > 500) count = Math.min(count, 4);
    for (var i = 0; i < count; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = (2 + Math.random() * 5) * power;
      parts.push({ t: 'drop', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3 * power,
        r: 3 + Math.random() * 5, c: cols[(Math.random() * cols.length) | 0], life: 1, decay: 0.012 + Math.random() * 0.018 });
    }
    if (PA.LEVELS[level - 1].gold || PA.LEVELS[level - 1].rainbow) fx.sparkle(x, y, 3);
  };

  fx.sparkle = function (x, y, count, spread) {
    spread = spread || 60;
    for (var i = 0; i < count; i++) {
      parts.push({ t: 'star', x: x + PA.rand(-spread, spread), y: y + PA.rand(-spread, spread), vx: PA.rand(-0.6, 0.6), vy: PA.rand(-1.5, -0.3),
        r: 4 + Math.random() * 6, c: GOLD[(Math.random() * GOLD.length) | 0], life: 1, decay: 0.015 + Math.random() * 0.02, rot: Math.random() * 6 });
    }
  };

  fx.confetti = function (count) {
    var cols = RAINBOW.concat(['#FFFFFF']);
    for (var i = 0; i < count; i++) {
      parts.push({ t: 'conf', x: Math.random() * W, y: -20 - Math.random() * H * 0.5, vx: PA.rand(-1.5, 1.5), vy: PA.rand(2, 5),
        r: 5 + Math.random() * 6, c: cols[(Math.random() * cols.length) | 0], life: 1, decay: 0.004 + Math.random() * 0.004,
        rot: Math.random() * 6, vr: PA.rand(-0.2, 0.2) });
    }
  };

  fx.text = function (x, y, str, big) {
    if (texts.length > 40) texts.shift();
    texts.push({ x: x + PA.rand(-20, 20), y: y, s: str, life: 1, big: !!big });
  };

  function star(x, y, r, rot) {
    ctx.beginPath();
    for (var i = 0; i < 8; i++) {
      var rr = i % 2 ? r * 0.4 : r;
      var a = rot + (i * Math.PI) / 4;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill();
  }

  fx.update = function (dt) {
    var k = Math.min(dt * 60, 3);
    if (!parts.length && !texts.length) { if (fx._dirty) { ctx.clearRect(0, 0, W, H); fx._dirty = false; } return; }
    fx._dirty = true;
    ctx.clearRect(0, 0, W, H);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.life -= p.decay * k;
      if (p.life <= 0 || p.y > H + 40) { parts.splice(i, 1); continue; }
      p.x += p.vx * k; p.y += p.vy * k;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.4));
      ctx.fillStyle = p.c;
      if (p.t === 'drop') {
        p.vy += 0.28 * k; p.vx *= 0.99;
        var r = p.r * (0.6 + p.life * 0.4);
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath(); ctx.arc(p.x - r * 0.35, p.y - r * 0.35, r * 0.3, 0, Math.PI * 2); ctx.fill();
      } else if (p.t === 'star') {
        p.rot += 0.05 * k;
        star(p.x, p.y, p.r * p.life, p.rot);
      } else {
        p.rot += p.vr * k; p.vx += Math.sin(p.y / 40) * 0.05;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
        ctx.restore();
      }
    }
    for (var j = texts.length - 1; j >= 0; j--) {
      var t = texts[j];
      t.life -= 0.018 * k;
      if (t.life <= 0) { texts.splice(j, 1); continue; }
      t.y -= 1.3 * k;
      var size = t.big ? 34 : 24;
      ctx.globalAlpha = Math.min(1, t.life * 2);
      ctx.font = '700 ' + size + 'px Fredoka, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(120,30,40,0.85)'; ctx.lineJoin = 'round';
      ctx.strokeText(t.s, t.x, t.y);
      ctx.fillStyle = t.big ? '#FFE45C' : '#FFFFFF';
      ctx.fillText(t.s, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  };
})();
