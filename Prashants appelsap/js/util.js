/* Prashants appelsap – hulpfuncties */
(function () {
  'use strict';
  var PA = (window.PA = window.PA || {});
  var NAMES = [[1e6, 'miljoen'], [1e9, 'miljard'], [1e12, 'biljoen'], [1e15, 'biljard'], [1e18, 'triljoen'], [1e21, 'triljard'],
    [1e24, 'quadriljoen'], [1e27, 'quadriljard'], [1e30, 'quintiljoen'], [1e33, 'quintiljard'], [1e36, 'sextiljoen']];
  var nf0 = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 });
  var nf1 = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1 });
  var nf2 = new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  PA.fmt = function (n, decimals) {
    if (!isFinite(n)) return '∞';
    if (n < 0) return '-' + PA.fmt(-n, decimals);
    if (n < 1e6) {
      if (decimals && n < 100 && n % 1 !== 0) return nf1.format(Math.floor(n * 10) / 10);
      return nf0.format(Math.floor(n));
    }
    var i = NAMES.length - 1;
    while (i > 0 && n < NAMES[i][0]) i--;
    return nf2.format(Math.floor((n / NAMES[i][0]) * 100) / 100) + ' ' + NAMES[i][1];
  };

  PA.fmtTime = function (sec) {
    sec = Math.max(0, Math.floor(sec));
    var d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    if (d > 0) return d + ' d ' + h + ' u';
    if (h > 0) return h + ' u ' + m + ' min';
    if (m > 0) return m + ' min ' + s + ' sec';
    return s + ' sec';
  };

  PA.todayStr = function (date) {
    var d = date || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  PA.el = function (tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  PA.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };

  PA.rand = function (a, b) { return a + Math.random() * (b - a); };
  PA.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
})();
