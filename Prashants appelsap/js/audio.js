/* Prashants appelsap – geluidseffecten (WebAudio, geen bestanden nodig) */
(function () {
  'use strict';
  var PA = window.PA;
  var ctx = null, master = null, noiseBuf = null;
  var A = (PA.audio = { enabled: true });

  function ensure() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.45;
      master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  A.unlock = ensure;

  function tone(freq, dur, type, vol, when, slideTo) {
    if (!A.enabled) return;
    var c = ensure(); if (!c) return;
    var t = c.currentTime + (when || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noise(dur, vol, when, freq) {
    if (!A.enabled) return;
    var c = ensure(); if (!c) return;
    var t = c.currentTime + (when || 0);
    var src = c.createBufferSource(); src.buffer = noiseBuf;
    var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 1500; f.Q.value = 0.8;
    var g = c.createGain();
    g.gain.setValueAtTime(vol || 0.1, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur + 0.05);
  }

  var lastClick = 0;
  A.click = function () {
    var now = performance.now();
    if (now - lastClick < 35) return;
    lastClick = now;
    var p = 0.9 + Math.random() * 0.25;
    tone(520 * p, 0.11, 'sine', 0.22, 0, 170 * p);
    noise(0.09, 0.07, 0.01, 2200 * p);
  };
  A.buy = function () { tone(660, 0.08, 'triangle', 0.18); tone(990, 0.14, 'triangle', 0.16, 0.07); };
  A.fail = function () { tone(220, 0.15, 'square', 0.05, 0, 160); };
  A.levelUp = function () {
    [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, 0.35, 'triangle', 0.18, i * 0.09); });
    noise(0.6, 0.05, 0.3, 4000);
  };
  A.achievement = function () { tone(880, 0.2, 'sine', 0.16); tone(1175, 0.3, 'sine', 0.16, 0.12); };
  A.golden = function () { [1200, 1500, 1800, 2400].forEach(function (f, i) { tone(f, 0.15, 'sine', 0.1, i * 0.05); }); };
  A.world = function () {
    noise(0.8, 0.08, 0, 600);
    [392, 523, 659, 784].forEach(function (f) { tone(f, 0.8, 'triangle', 0.09, 0.1); });
  };
  A.daily = function () { [784, 988, 1175, 1568].forEach(function (f, i) { tone(f, 0.25, 'triangle', 0.15, i * 0.1); }); };
  A.tick = function () { tone(1400, 0.04, 'sine', 0.05); };
})();
