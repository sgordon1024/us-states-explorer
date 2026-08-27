/* Shared helpers: formatting, percentiles, derived scores, state dialog. */
(function () {
  'use strict';
  const S = window.STATES, C = window.COLS;

  // ---------- formatting ----------
  function fmtVal(key, v) {
    if (v === null || v === undefined || v === '') return '—';
    const fmt = (C[key] || {}).fmt || 'txt';
    if (fmt === 'txt') return String(v);
    const n = Number(v);
    if (!isFinite(n)) return String(v);
    if (fmt === 'usd') return '$' + Math.round(n).toLocaleString('en-US');
    if (fmt === 'int') return Math.round(n).toLocaleString('en-US');
    if (fmt === 'num1') return n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (fmt === 'num2') return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return String(v);
  }

  // ---------- derived numeric scores for categorical columns ----------
  const GUN_GRADES = { 'A': 100, 'A-': 92, 'B+': 84, 'B': 76, 'B-': 68, 'C+': 60, 'C': 52, 'C-': 44, 'D+': 36, 'D': 28, 'D-': 20, 'F': 6 };
  const HS_REG = { 'None': 0, 'Low': 33, 'Moderate': 67, 'High': 100 };
  S.forEach(s => {
    s._gunStrict = GUN_GRADES[s.gunGrade] !== undefined ? GUN_GRADES[s.gunGrade] : 50; // DC N/A -> neutral-ish (actually strict laws; treat as 95)
    if (s.abbr === 'DC') s._gunStrict = 95;
    s._homeschoolReg = HS_REG[s.homeschool] !== undefined ? HS_REG[s.homeschool] : 50;
  });

  // ---------- percentiles (0 = lowest raw value, 100 = highest) ----------
  const pctCache = {};
  function percentiles(key) {
    if (pctCache[key]) return pctCache[key];
    const vals = S.map(s => (key.startsWith('_') ? s[key] : s[key]))
      .map(v => (typeof v === 'number' ? v : null));
    const sorted = vals.filter(v => v !== null).slice().sort((a, b) => a - b);
    const map = {};
    S.forEach((s, i) => {
      const v = vals[i];
      if (v === null) { map[s.abbr] = null; return; }
      // average rank of equal values
      let lo = sorted.findIndex(x => x === v);
      let hi = sorted.lastIndexOf(v);
      const rank = (lo + hi) / 2;
      map[s.abbr] = sorted.length > 1 ? (rank / (sorted.length - 1)) * 100 : 50;
    });
    pctCache[key] = map;
    return map;
  }

  // ---------- min/max ----------
  function extent(key) {
    const nums = S.map(s => s[key]).filter(v => typeof v === 'number');
    return [Math.min.apply(null, nums), Math.max.apply(null, nums)];
  }
  function topStates(key, n, desc) {
    const rows = S.filter(s => typeof s[key] === 'number')
      .slice().sort((a, b) => desc ? b[key] - a[key] : a[key] - b[key]);
    return rows.slice(0, n);
  }

  // ---------- color scales (validated palette, dark mode) ----------
  // Sequential blue ramp: on the dark surface, brighter = more.
  const SEQ = ['#104281', '#184f95', '#1c5cab', '#256abf', '#2a78d6', '#3987e5', '#5598e7', '#6da7ec', '#86b6ef', '#9ec5f4', '#b7d3f6', '#cde2fb'];
  // Diverging: Dem blue <- neutral -> GOP red (political convention matches the palette's blue/red poles).
  const DIV_NEG = ['#cde2fb', '#86b6ef', '#3987e5', '#256abf']; // strong D at extreme
  const DIV_POS = ['#f3c1c1', '#ee9d9d', '#e66767', '#c94848'];
  const DIV_MID = '#383835';

  function seqColor(t) { // t in [0,1]
    const i = Math.max(0, Math.min(SEQ.length - 1, Math.round(t * (SEQ.length - 1))));
    return SEQ[i];
  }
  function divColor(v, absMax) { // v centered on 0
    if (!isFinite(v)) return DIV_MID;
    const t = Math.max(-1, Math.min(1, v / absMax));
    if (Math.abs(t) < 0.06) return DIV_MID;
    const arm = t < 0 ? DIV_NEG : DIV_POS;
    const i = Math.min(arm.length - 1, Math.floor(Math.abs(t) * arm.length));
    return arm[t < 0 ? (arm.length - 1 - (arm.length - 1 - i)) : i] || arm[i];
  }

  // ---------- state detail dialog ----------
  const DIALOG_GROUPS = [
    ['Snapshot', ['nickname', 'capital', 'largestCity', 'statehood', 'pop', 'region', 'timezone', 'food']],
    ['Money', ['income', 'incomeAdj', 'col', 'homeValue', 'rent', 'unemp', 'poverty']],
    ['Taxes', ['taxBurden', 'incomeTaxTop', 'salesTax', 'propTax', 'taxRank', 'hasIncomeTax']],
    ['Health, safety & schools', ['lifeExp', 'uninsured', 'crime', 'homicide', 'bachelors', 'k12']],
    ['Climate & outdoors', ['temp', 'precip', 'solar', 'coastline', 'highPoint', 'natParks', 'stateParks', 'skiAreas', 'fedLand']],
    ['Politics & laws', ['margin', 'governor', 'legislature', 'cannabis', 'gunGrade', 'permitless', 'homeschool', 'ballotInit', 'religiosity', 'urban']]
  ];
  let dlg = null;
  function ensureDialog() {
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.className = 'state-dialog';
    dlg.setAttribute('aria-label', 'State details');
    document.body.appendChild(dlg);
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    return dlg;
  }
  function openStateDialog(abbr) {
    const s = S.find(x => x.abbr === abbr);
    if (!s) return;
    const d = ensureDialog();
    const groups = DIALOG_GROUPS.map(([title, keys]) => `
      <section class="sd-group">
        <h3>${title}</h3>
        <div class="sd-grid">
          ${keys.map(k => `<div class="sd-item"><div class="sd-v">${fmtVal(k, s[k])}</div><div class="sd-k">${C[k].label}</div></div>`).join('')}
        </div>
      </section>`).join('');
    d.innerHTML = `
      <div class="sd-head">
        <h2>${s.name}</h2><span class="sd-nick">${s.nickname}</span>
        <button class="close-btn" aria-label="Close ${s.name} details">✕</button>
      </div>
      <div class="sd-body">${groups}
        <p style="color:var(--ink-muted);font-size:.85rem;margin-top:18px">Want every column? <a href="explore.html">Open the data explorer</a>.</p>
      </div>`;
    d.querySelector('.close-btn').addEventListener('click', () => d.close());
    d.showModal();
  }

  // ---------- scroll reveal + count-up ----------
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function initReveals() {
    const els = document.querySelectorAll('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('in'));
      document.querySelectorAll('.bl-fill[data-w]').forEach(f => { f.style.width = f.dataset.w; });
      document.querySelectorAll('[data-countup]').forEach(el => { el.textContent = el.dataset.countup; });
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        en.target.querySelectorAll('.bl-fill[data-w]').forEach(f => { f.style.width = f.dataset.w; });
        en.target.querySelectorAll('[data-countup]').forEach(runCountup);
        io.unobserve(en.target);
      });
    }, { threshold: 0.25 });
    els.forEach(el => io.observe(el));
  }
  function runCountup(el) {
    if (el._done) return; el._done = true;
    const finalText = el.dataset.countup;
    const num = parseFloat(finalText.replace(/[^0-9.\-]/g, ''));
    if (!isFinite(num)) { el.textContent = finalText; return; }
    const prefix = finalText.slice(0, finalText.search(/[0-9\-]/));
    const numStrEnd = finalText.length - finalText.split('').reverse().join('').search(/[0-9]/);
    const suffix = finalText.slice(numStrEnd);
    const decimals = (finalText.match(/\.(\d+)/) || [, ''])[1].length;
    const dur = 1300, t0 = performance.now();
    function tick(t) {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = num * eased;
      el.textContent = prefix + cur.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
      if (p < 1) requestAnimationFrame(tick); else el.textContent = finalText;
    }
    requestAnimationFrame(tick);
  }

  window.SS = { fmtVal, percentiles, extent, topStates, seqColor, divColor, DIV_MID, openStateDialog, initReveals, reduceMotion };
})();
