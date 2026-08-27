/* Homepage: build the map + populate insight bar lists. */
(function () {
  'use strict';
  const SS = window.SS, S = window.STATES;

  window.buildUSMap(document.getElementById('map-mount'));

  function bars(mountId, rows, valueFn, labelFn, maxOverride) {
    const ul = document.getElementById(mountId);
    if (!ul) return;
    const vals = rows.map(valueFn);
    const max = maxOverride !== undefined ? maxOverride : Math.max.apply(null, vals.map(Math.abs));
    ul.innerHTML = rows.map((s, i) => {
      const pct = Math.max(3, Math.abs(vals[i]) / max * 100);
      return `<li>
        <span class="bl-name">${s.name}</span>
        <span class="bl-track"><span class="bl-fill" data-w="${pct.toFixed(1)}%"></span></span>
        <span class="bl-val">${labelFn(s, vals[i])}</span>
      </li>`;
    }).join('');
  }

  const n1 = v => v.toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 });

  bars('bars-mig-in', SS.topStates('migDom', 5, true), s => s.migDom, (s, v) => '+' + n1(v));
  bars('bars-mig-out', SS.topStates('migDom', 5, false), s => s.migDom, (s, v) => '−' + n1(Math.abs(v)));

  const p2iHi = SS.topStates('priceIncome', 4, true);
  const p2iLo = SS.topStates('priceIncome', 3, false).reverse();
  bars('bars-p2i', p2iHi.concat(p2iLo), s => s.priceIncome, (s, v) => n1(v) + ' yrs');

  bars('bars-adj', SS.topStates('incomeAdj', 6, true), s => s.incomeAdj, (s, v) => '$' + Math.round(v / 1000) + 'k');

  const taxHi = SS.topStates('taxBurden', 4, true);
  const taxLo = SS.topStates('taxBurden', 3, false).reverse();
  bars('bars-tax', taxHi.concat(taxLo), s => s.taxBurden, (s, v) => n1(v) + '%');

  const lifeHi = SS.topStates('lifeExp', 4, true);
  const lifeLo = SS.topStates('lifeExp', 3, false).reverse();
  bars('bars-life', lifeHi.concat(lifeLo), s => s.lifeExp - 65, (s, v) => n1(s.lifeExp), 15);

  bars('bars-solar', SS.topStates('solar', 6, true), s => s.solar, (s, v) => n1(v));

  const closest = S.slice().sort((a, b) => Math.abs(a.margin) - Math.abs(b.margin)).slice(0, 5);
  bars('bars-close', closest, s => Math.abs(s.margin), (s, v) => (s.margin > 0 ? 'R +' : 'D +') + n1(Math.abs(s.margin)), 5);

  // ----- v2: happiness -----
  bars('bars-happy', SS.topStates('wellbeingScore', 8, true), s => s.wellbeingScore, (s, v) => n1(v));

  // ----- v2: scenery -----
  (function scenic() {
    const podium = document.getElementById('podium-scenic');
    if (!podium) return;
    const top3 = SS.topStates('sceneryIdx', 3, true);
    const medals = ['🥇', '🥈', '🥉'];
    podium.innerHTML = top3.map((s, i) => `
      <button type="button" class="pod" data-state="${s.abbr}" style="cursor:pointer"
        aria-label="${s.name}: scenery index ${s.sceneryIdx} of 100, ${SS.ordinal(i + 1)} place. Open details.">
        <span class="medal" aria-hidden="true">${medals[i]}</span>
        ${SS.stateIcon(s.abbr, 44)}
        <span class="pd-name">${s.name}</span>
        <span class="pd-val">${n1(s.sceneryIdx)} / 100</span>
        <span class="pd-sub">${s.nickname}</span>
      </button>`).join('');
    podium.addEventListener('click', e => {
      const b = e.target.closest('.pod'); if (b) SS.openStateDialog(b.dataset.state);
    });
    bars('bars-scenic', SS.topStates('sceneryIdx', 10, true), s => s.sceneryIdx, (s, v) => n1(v), 100);
  })();

  // ----- v2: water & wildlife -----
  bars('bars-water', SS.topStates('waterViol', 6, true), s => s.waterViol, (s, v) => n1(v) + '%');
  bars('bars-animal', SS.topStates('animalRank', 6, false), s => 52 - s.animalRank, (s, v) => '#' + s.animalRank, 51);

  // ----- v2: life on the road -----
  (function road() {
    const tiles = document.getElementById('road-tiles');
    if (!tiles) return;
    const allowed = S.filter(s => s.restOvernight === 'Allowed');
    const noInsp = S.filter(s => s.vehicleInspection === 'No');
    const dream = S.filter(s => s.restOvernight === 'Allowed' && s.vehicleInspection === 'No')
      .sort((a, b) => b.fedLand - a.fedLand);
    tiles.innerHTML = `
      <div class="stat-tile"><div class="big" data-countup="${allowed.length}">${allowed.length}</div><div class="who">states</div><div class="note">let you sleep overnight at highway rest areas</div></div>
      <div class="stat-tile"><div class="big" data-countup="${noInsp.length}">${noInsp.length}</div><div class="who">jurisdictions</div><div class="note">require no periodic vehicle safety inspection</div></div>
      <div class="stat-tile"><div class="big" data-countup="80.1%">80.1%</div><div class="who">Nevada</div><div class="note">federal public land + open rest areas + no inspections: the full trifecta</div></div>`;
    bars('bars-road', dream.slice(0, 8), s => s.fedLand, (s, v) => n1(v) + '% public land', 100);
    document.getElementById('road-note').textContent =
      'Tier = overnight rest-area parking allowed AND no periodic inspection, ranked by federal public land (free dispersed camping country). Rules move: Virginia banned overnight rest-area parking in March 2026; New Hampshire and Louisiana just ended vehicle inspections. Time limits vary by site — check signs.';
  })();

  // ----- v2: rules of the water -----
  (function boat() {
    const tiles = document.getElementById('boat-tiles');
    if (!tiles) return;
    const score = s => ({ 'None': 2, 'Age-based': 1, 'All ages': 0 }[s.boaterEd] || 0) +
      ({ 'No': 1, 'Some': 0.5, 'Yes': 0 }[s.kayakReg] || 0);
    const relaxed = S.slice().sort((a, b) => score(b) - score(a)).slice(0, 8);
    const none = S.filter(s => s.boaterEd === 'None');
    const allAges = S.filter(s => s.boaterEd === 'All ages');
    tiles.innerHTML = `
      <div class="stat-tile"><div class="big" data-countup="${none.length}">${none.length}</div><div class="who">states</div><div class="note">require no boater education at all: ${none.map(s => s.abbr).join(', ')}</div></div>
      <div class="stat-tile"><div class="big" data-countup="3">3</div><div class="who">AK · AZ · SD</div><div class="note">zero paperwork: no boater card, no kayak registration, nothing</div></div>
      <div class="stat-tile"><div class="big" data-countup="${allAges.length}">${allAges.length}</div><div class="who">jurisdictions</div><div class="note">at the other end, require certification for every operator</div></div>`;
    bars('bars-boat', relaxed, s => score(s), (s, v) =>
      (s.boaterEd === 'None' ? 'no card' : 'card: some ages') + (s.kayakReg === 'No' ? ' · no stickers' : ' · some stickers'), 3);
    document.getElementById('boat-note').textContent =
      '“Relaxed” = no mandatory boater-education card for adults + no registration/permits on paddlecraft. Everyone still enforces sober boating — 0.08 applies on water everywhere.';
  })();

  // ----- scatter: income (x) vs cost of living (y) -----
  (function scatter() {
    const mount = document.getElementById('scatter-pay');
    if (!mount) return;
    const W = 760, H = 430, m = { l: 52, r: 16, t: 14, b: 40 };
    const xs = S.map(s => s.income), ys = S.map(s => s.col);
    const xmin = Math.min(...xs) - 3000, xmax = Math.max(...xs) + 3000;
    const ymin = Math.min(...ys) - 3, ymax = Math.max(...ys) + 3;
    const X = v => m.l + (v - xmin) / (xmax - xmin) * (W - m.l - m.r);
    const Y = v => H - m.b - (v - ymin) / (ymax - ymin) * (H - m.t - m.b);
    const label = new Set(['HI', 'CA', 'DC', 'MA', 'WV', 'MS', 'UT', 'NH', 'AR', 'NY', 'WA', 'OK']);
    const dots = S.map(s => `
      <g class="dot" role="button" tabindex="0" data-state="${s.abbr}"
         aria-label="${s.name}: median income ${SS.fmtVal('income', s.income)}, cost of living index ${SS.fmtVal('col', s.col)}. Open details.">
        <circle cx="${X(s.income).toFixed(1)}" cy="${Y(s.col).toFixed(1)}" r="6" fill="var(--aqua)" fill-opacity="0.85"></circle>
        ${label.has(s.abbr) ? `<text class="dot-lbl" x="${(X(s.income) + 9).toFixed(1)}" y="${(Y(s.col) + 4).toFixed(1)}">${s.abbr}</text>` : ''}
      </g>`).join('');
    const usY = Y(100);
    mount.innerHTML = `<svg viewBox="0 0 ${W} ${H}">
      <line x1="${m.l}" y1="${usY.toFixed(1)}" x2="${W - m.r}" y2="${usY.toFixed(1)}" stroke="var(--grid)" stroke-dasharray="4 4"></line>
      <text class="axis-lbl" x="${W - m.r}" y="${(usY - 6).toFixed(1)}" text-anchor="end">US-average prices</text>
      <line x1="${m.l}" y1="${H - m.b}" x2="${W - m.r}" y2="${H - m.b}" stroke="var(--grid)"></line>
      <text class="axis-lbl" x="${m.l}" y="${H - 10}">$${Math.round(xmin / 1000)}k</text>
      <text class="axis-lbl" x="${W - m.r}" y="${H - 10}" text-anchor="end">$${Math.round(xmax / 1000)}k median household income →</text>
      <text class="axis-lbl" x="${m.l - 8}" y="${m.t + 10}" text-anchor="end" transform="rotate(-90 ${m.l - 8} ${m.t + 10})"></text>
      <text class="axis-lbl" x="14" y="${m.t + 12}">↑ pricier</text>
      ${dots}
    </svg>`;
    mount.addEventListener('click', e => {
      const d = e.target.closest('.dot'); if (d) SS.openStateDialog(d.dataset.state);
    });
    mount.addEventListener('keydown', e => {
      const d = e.target.closest('.dot');
      if (d && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); SS.openStateDialog(d.dataset.state); }
    });
  })();

  // ----- politics strip: all 51 sorted by margin -----
  (function politicsStrip() {
    const mount = document.getElementById('strip-politics');
    if (!mount) return;
    const rows = S.slice().sort((a, b) => a.margin - b.margin);
    const absMax = Math.max(...rows.map(s => Math.abs(s.margin)));
    mount.innerHTML = rows.map(s => {
      const h = Math.max(8, Math.abs(s.margin) / absMax * 100);
      const side = s.margin > 0 ? 'R' : 'D';
      return `<button type="button" class="sbar" data-state="${s.abbr}"
        style="height:${h.toFixed(0)}%;background:${SS.divColor(s.margin, absMax)}"
        aria-label="${s.name}: ${side} +${Math.abs(s.margin).toFixed(1)} in 2024. Open details."
        title="${s.name}: ${side} +${Math.abs(s.margin).toFixed(1)}"></button>`;
    }).join('');
    mount.addEventListener('click', e => {
      const b = e.target.closest('.sbar'); if (b) SS.openStateDialog(b.dataset.state);
    });
  })();

  // food chips (with state silhouettes)
  const strip = document.getElementById('food-strip');
  if (strip) {
    strip.innerHTML = S.map(s => `<button type="button" class="food-chip" data-state="${s.abbr}"
        style="cursor:pointer" aria-label="${s.name}: ${s.food}. Open state details.">
        <span class="icon-cell">${SS.stateIcon(s.abbr, 18)} <b>${s.abbr}</b> ${s.food}</span></button>`).join('');
    strip.addEventListener('click', e => {
      const b = e.target.closest('.food-chip'); if (b) SS.openStateDialog(b.dataset.state);
    });
  }

  SS.initReveals();
})();
