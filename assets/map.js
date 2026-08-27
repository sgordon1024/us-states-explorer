/* Interactive choropleth US map. */
(function () {
  'use strict';
  const S = window.STATES, C = window.COLS, SS = window.SS;

  const OVERLAYS = [
    { key: 'homeValue', kind: 'seq', note: 'Zillow typical home value, July 2026' },
    { key: 'rent', kind: 'seq', note: 'Zillow typical rent, July 2026' },
    { key: 'col', kind: 'seq', note: 'BEA regional price parities, US = 100' },
    { key: 'income', kind: 'seq', note: 'Census SAIPE 2024' },
    { key: 'incomeAdj', kind: 'seq', note: 'Median income ÷ cost-of-living index' },
    { key: 'taxBurden', kind: 'seq', note: 'Tax Foundation state-local burden' },
    { key: 'propTax', kind: 'seq', note: 'Effective rate on owner-occupied homes' },
    { key: 'migDom', kind: 'div', note: 'Census 2021–25; blue = people leaving, red = people arriving? No — here blue = outflow, warm = inflow' },
    { key: 'crime', kind: 'seq', note: 'FBI 2024 violent crime per 100k' },
    { key: 'lifeExp', kind: 'seq', note: 'CDC/NCHS life expectancy' },
    { key: 'temp', kind: 'seq', note: 'NOAA 1991–2020 normals' },
    { key: 'solar', kind: 'seq', note: 'NREL average solar resource' },
    { key: 'margin', kind: 'div', note: '2024 presidential margin: blue = Dem, red = GOP' },
    { key: 'urban', kind: 'seq', note: '2020 Census urban share' },
    { key: 'religiosity', kind: 'seq', note: 'Pew 2023–24: religion “very important”' },
    { key: 'bachelors', kind: 'seq', note: 'Census ACS educational attainment' }
  ];
  // fix migDom note
  OVERLAYS.find(o => o.key === 'migDom').note = 'Census 2021–25 — red = net inflow, blue = net outflow (per 1k residents)';

  function buildMap(mount, opts) {
    const controls = document.createElement('div');
    controls.className = 'map-controls';
    const selId = 'overlay-select';
    controls.innerHTML = `
      <label for="${selId}">Color the map by</label>
      <select id="${selId}"></select>
      <span class="map-hint" id="overlay-note"></span>`;
    const sel = controls.querySelector('select');
    OVERLAYS.forEach((o, i) => {
      const opt = document.createElement('option');
      opt.value = o.key; opt.textContent = C[o.key].label;
      sel.appendChild(opt);
    });

    const svgWrap = document.createElement('div');
    svgWrap.innerHTML = `
      <svg class="usmap" viewBox="0 0 959 593" role="group" aria-label="Map of the United States. Each state is a button; press Enter to open its details.">
      </svg>`;
    const svg = svgWrap.querySelector('svg');
    const shapes = {};
    S.forEach(s => {
      let el;
      if (s.abbr === 'DC') {
        el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        const c = window.DC_CIRCLE;
        el.setAttribute('cx', c.cx); el.setAttribute('cy', c.cy); el.setAttribute('r', c.r);
      } else {
        el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        el.setAttribute('d', window.MAP_PATHS[s.abbr]);
      }
      el.classList.add('state-shape');
      el.dataset.abbr = s.abbr;
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      svg.appendChild(el);
      shapes[s.abbr] = el;
    });

    const legend = document.createElement('div');
    legend.className = 'legend-row';
    legend.innerHTML = `<span class="lg" data-lo></span><div class="legend-bar" data-bar role="img"></div><span class="lg" data-hi></span>`;

    const live = document.createElement('p');
    live.className = 'visually-hidden';
    live.setAttribute('aria-live', 'polite');
    live.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);';

    const hint = document.createElement('p');
    hint.className = 'map-hint';
    hint.textContent = 'Hover or tab to a state to see its value. Click or press Enter for the full profile.';

    mount.append(controls, svgWrap, legend, hint, live);

    // tooltip
    const tip = document.createElement('div');
    tip.className = 'map-tooltip'; tip.hidden = true; tip.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tip);

    let cur = OVERLAYS[0];
    function colorize() {
      const key = cur.key;
      const [lo, hi] = SS.extent(key);
      const noteEl = controls.querySelector('#overlay-note');
      noteEl.textContent = cur.note;
      if (cur.kind === 'div') {
        const absMax = Math.max(Math.abs(lo), Math.abs(hi));
        S.forEach(s => shapes[s.abbr].setAttribute('fill', SS.divColor(s[key], absMax)));
        legend.querySelector('[data-lo]').textContent = SS.fmtVal(key, lo);
        legend.querySelector('[data-hi]').textContent = SS.fmtVal(key, hi);
        legend.querySelector('[data-bar]').style.background =
          `linear-gradient(90deg, #256abf, #86b6ef, ${SS.DIV_MID} 50%, #ee9d9d, #c94848)`;
        legend.querySelector('[data-bar]').setAttribute('aria-label',
          `Color scale from ${SS.fmtVal(key, lo)} (blue) through neutral to ${SS.fmtVal(key, hi)} (red)`);
      } else {
        const range = hi - lo || 1;
        S.forEach(s => {
          const v = s[key];
          shapes[s.abbr].setAttribute('fill', typeof v === 'number' ? SS.seqColor((v - lo) / range) : '#2c2c2a');
        });
        legend.querySelector('[data-lo]').textContent = SS.fmtVal(key, lo);
        legend.querySelector('[data-hi]').textContent = SS.fmtVal(key, hi);
        legend.querySelector('[data-bar]').style.background = 'linear-gradient(90deg, #104281, #2a78d6, #86b6ef, #cde2fb)';
        legend.querySelector('[data-bar]').setAttribute('aria-label',
          `Color scale from ${SS.fmtVal(key, lo)} (darkest) to ${SS.fmtVal(key, hi)} (brightest)`);
      }
      S.forEach(s => {
        shapes[s.abbr].setAttribute('aria-label', `${s.name}: ${SS.fmtVal(key, s[key])} — ${C[key].label}. Open details.`);
      });
    }

    function showTip(abbr, x, y) {
      const s = S.find(t => t.abbr === abbr);
      tip.innerHTML = `<div class="tt-name">${s.name}</div><div class="tt-val">${C[cur.key].label}: <b>${SS.fmtVal(cur.key, s[cur.key])}</b></div>`;
      tip.hidden = false;
      const pad = 14;
      const w = tip.offsetWidth, h = tip.offsetHeight;
      let left = x + pad, top = y + pad;
      if (left + w > innerWidth - 8) left = x - w - pad;
      if (top + h > innerHeight - 8) top = y - h - pad;
      tip.style.left = Math.max(8, left) + 'px';
      tip.style.top = Math.max(8, top) + 'px';
    }
    svg.addEventListener('pointermove', (e) => {
      const t = e.target.closest('.state-shape');
      if (t) showTip(t.dataset.abbr, e.clientX, e.clientY); else tip.hidden = true;
    });
    svg.addEventListener('pointerleave', () => { tip.hidden = true; });
    svg.addEventListener('focusin', (e) => {
      const t = e.target.closest('.state-shape');
      if (!t) return;
      const r = t.getBoundingClientRect();
      showTip(t.dataset.abbr, r.left + r.width / 2, r.top);
      const s = S.find(x => x.abbr === t.dataset.abbr);
      live.textContent = `${s.name}: ${SS.fmtVal(cur.key, s[cur.key])}`;
    });
    svg.addEventListener('focusout', () => { tip.hidden = true; });
    function activate(e) {
      const t = e.target.closest('.state-shape');
      if (!t) return;
      tip.hidden = true;
      SS.openStateDialog(t.dataset.abbr);
    }
    svg.addEventListener('click', activate);
    svg.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(e); }
    });

    sel.addEventListener('change', () => {
      cur = OVERLAYS.find(o => o.key === sel.value);
      colorize();
    });
    colorize();
  }

  window.buildUSMap = buildMap;
})();
