/* Shared helpers: formatting, percentiles, ranks, descriptions, state icons, dialog. */
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

  // ---------- plain-English metric descriptions ----------
  const DESCS = {
    ev: 'Votes this state casts in the Electoral College for president.',
    pop: 'Resident population, Census Bureau estimate for July 2025.',
    popChg5: 'How much the population grew or shrank between 2020 and 2025.',
    popChg1: 'Population change in the most recent year (2024→2025).',
    migDom: 'Net movers from other US states per 1,000 residents, 2021–25. Positive = more people arriving than leaving.',
    migIntl: 'Net international migration per 1,000 residents, 2021–25.',
    birth: 'Births per 1,000 residents per year.',
    death: 'Deaths per 1,000 residents per year.',
    medianAge: 'Half of residents are older than this, half younger.',
    landArea: 'Land area in square miles (water excluded).',
    waterPct: 'Share of the state’s total area that is water.',
    density: 'People per square mile of land. Higher = more crowded.',
    gdp: 'Total economic output in 2025, millions of current dollars.',
    gdpCap: 'Economic output divided by population — a rough productivity gauge, not personal income.',
    gdpGrowth1: 'Inflation-adjusted economic growth in the last year.',
    gdpGrowth5: 'Average yearly inflation-adjusted growth since 2020.',
    incomeCap: 'Total personal income divided by population (BEA, 2025).',
    income: 'The middle household’s yearly income (Census SAIPE, 2024).',
    incomeAdj: 'Median household income divided by the state’s price level — what the paycheck actually buys.',
    unemp: 'Share of the labor force looking for work (July 2026).',
    minWage: 'State minimum wage in 2026; $7.25 states default to the federal floor.',
    poverty: 'Share of residents below the federal poverty line (2024).',
    childPoverty: 'Share of children below the poverty line (2024).',
    rtw: 'Right-to-work states ban requiring union membership/dues as a condition of employment.',
    col: 'Overall price level vs the US average (=100). 90 means ~10% cheaper than average.',
    colHousing: 'Housing price level vs the US average (=100).',
    colGoods: 'Goods price level vs the US average (=100).',
    colUtil: 'Utilities price level vs the US average (=100).',
    homeValue: 'Zillow’s typical (mid-market) home value, July 2026.',
    homeChg5: 'How much typical home values changed over five years.',
    priceIncome: 'Typical home value ÷ median household income: years of gross income to buy the typical home.',
    rent: 'Zillow’s typical asking rent, July 2026, population-weighted from county data.',
    rentIncome: 'Annual rent as a share of median household income.',
    rentCov: 'Share of the state’s population living in counties with rent data — below ~70%, treat rent as indicative.',
    homeownership: 'Share of households that own their home (2026).',
    elecPrice: 'Average residential electricity price, cents per kWh (May 2026).',
    hasIncomeTax: 'Whether the state taxes wage income at all.',
    incomeTaxTop: 'Top marginal state income-tax rate (2026). 0 = no wage income tax.',
    salesTaxState: 'The state-level sales tax rate.',
    salesTaxLocal: 'Average additional local sales taxes.',
    salesTax: 'State + average local sales tax combined.',
    propTax: 'Property taxes paid as a share of owner-occupied home value, per year.',
    corpTax: 'Top corporate income-tax rate (2026).',
    gasTax: 'State taxes and fees per gallon of gasoline, on top of the 18.4¢ federal tax.',
    estateTax: 'Whether the state taxes estates at death or inheritances received.',
    taxBurden: 'ALL state & local taxes paid as a share of residents’ income — the broadest single tax number.',
    taxBurdenCap: 'State & local taxes paid per person per year.',
    taxRank: 'Tax Foundation’s overall tax-competitiveness rank. 1 = friendliest tax code.',
    lifeExp: 'Expected years of life at birth (CDC/NCHS).',
    uninsured: 'Share of under-65 residents without health insurance (2023).',
    obesity: 'Share of adults with a BMI of 30+ (CDC BRFSS).',
    hsGrad: 'Adults 25+ with at least a high-school diploma.',
    bachelors: 'Adults 25+ with at least a bachelor’s degree.',
    advDegree: 'Adults 25+ with a graduate or professional degree.',
    k12: 'Public school spending per student per year (FY2023).',
    crime: 'Violent crimes (murder, rape, robbery, aggravated assault) per 100,000 people (FBI, 2024).',
    homicide: 'Homicides per 100,000 people (2024).',
    temp: 'Average annual temperature, 1991–2020 normals.',
    precip: 'Average annual rain + melted snow, inches.',
    solar: 'Average solar energy hitting a flat surface daily — the key off-grid solar number.',
    fedLand: 'Share of the state owned by the federal government (parks, forests, BLM, military).',
    gop: 'Trump share of the 2024 presidential vote.',
    dem: 'Harris share of the 2024 presidential vote.',
    margin: '2024 presidential margin: positive = Republican won by that many points, negative = Democratic.',
    cannabis: 'Whether recreational cannabis is legal for adults (mid-2026).',
    natParks: 'Congressionally designated National Parks in the state (of America’s 63).',
    stateParks: 'Units in the state park system — counting methods vary, treat as approximate.',
    coastline: 'General ocean coastline plus Great Lakes shoreline, miles.',
    highPoint: 'Elevation of the state’s highest natural point.',
    skiAreas: 'Operating downhill ski areas (approximate; small hills open and close).',
    fishLic: 'Cost of a resident annual freshwater fishing license.',
    huntLic: 'Cost of a resident annual base hunting license (small game where tiered).',
    gunGrade: 'Giffords Law Center grade of gun regulations: A = strictest laws, F = loosest.',
    permitless: 'Whether adults can carry a concealed handgun without a permit.',
    homeschool: 'HSLDA’s category for how much the state regulates homeschooling.',
    governor: 'Party of the sitting governor (2026).',
    legislature: 'Party control of the state legislature (2026).',
    ballotInit: 'Whether citizens can put laws or amendments directly on the ballot.',
    statehood: 'Year the state joined the Union.',
    admission: 'Order of admission to the Union.',
    urban: 'Share of residents living in Census-defined urban areas (2020).',
    religiosity: 'Share of adults who say religion is very important in their lives (Pew, 2023–24).',
    timezone: 'The state’s time zone(s).',
    food: 'The dish most associated with the state. Editorial. Fighting words welcome.',
    happinessRank: 'WalletHub’s composite happiness ranking: emotional well-being, work environment, community. 1 = happiest.',
    mentalDistress: 'Adults reporting 14+ mentally unhealthy days per month (America’s Health Rankings). Lower is better.',
    waterViol: 'Share of residents served by community water systems with health-based violations. Lower = cleaner tap water.',
    forestPct: 'Share of the state’s land covered by forest (USDA Forest Service).',
    animalRank: 'Animal Legal Defense Fund ranking of animal-protection laws. 1 = strongest protections.',
    sceneryIdx: 'Composite 0–100: mountains, coastline, forest cover, national parks and public land, weighted equally.',
    restOvernight: 'Whether you can legally sleep overnight in a vehicle at public highway rest areas.',
    vehicleInspection: 'Whether regular cars need periodic safety inspections.',
    boaterEd: 'Whether adult motorboat operators must hold a boater-education card.',
    kayakReg: 'Whether non-motorized canoes/kayaks must be registered or permitted.'
  };
  function descOf(key) { return DESCS[key] || ''; }

  // ---------- derived numeric scores for categorical columns ----------
  const GUN_GRADES = { 'A': 100, 'A-': 92, 'B+': 84, 'B': 76, 'B-': 68, 'C+': 60, 'C': 52, 'C-': 44, 'D+': 36, 'D': 28, 'D-': 20, 'F': 6 };
  const HS_REG = { 'None': 0, 'Low': 33, 'Moderate': 67, 'High': 100 };
  S.forEach(s => {
    s._gunStrict = GUN_GRADES[s.gunGrade] !== undefined ? GUN_GRADES[s.gunGrade] : 50;
    if (s.abbr === 'DC') s._gunStrict = 95;
    s._homeschoolReg = HS_REG[s.homeschool] !== undefined ? HS_REG[s.homeschool] : 50;
  });

  // ---------- percentiles (0 = lowest raw value, 100 = highest) ----------
  const pctCache = {};
  function percentiles(key) {
    if (pctCache[key]) return pctCache[key];
    const vals = S.map(s => s[key]).map(v => (typeof v === 'number' ? v : null));
    const sorted = vals.filter(v => v !== null).slice().sort((a, b) => a - b);
    const map = {};
    S.forEach((s, i) => {
      const v = vals[i];
      if (v === null) { map[s.abbr] = null; return; }
      let lo = sorted.findIndex(x => x === v);
      let hi = sorted.lastIndexOf(v);
      const rank = (lo + hi) / 2;
      map[s.abbr] = sorted.length > 1 ? (rank / (sorted.length - 1)) * 100 : 50;
    });
    pctCache[key] = map;
    return map;
  }

  // ---------- ranks ("#7 of 51") ----------
  // dir 'high': #1 = highest value is best. dir 'low': #1 = lowest is best.
  // no dir: rank by value descending and label it "highest".
  function rankOf(key, abbr) {
    const meta = C[key] || {};
    const s = S.find(x => x.abbr === abbr);
    const v = s ? s[key] : null;
    if (typeof v !== 'number') return null;
    const nums = S.map(x => x[key]).filter(x => typeof x === 'number');
    const betterLow = meta.dir === 'low';
    const pos = 1 + nums.filter(x => betterLow ? x < v : x > v).length;
    const of = nums.length;
    let note;
    if (meta.dir === 'high') note = ordinal(pos) + ' best of ' + of + ' (higher is better)';
    else if (meta.dir === 'low') note = ordinal(pos) + ' best of ' + of + ' (lower is better)';
    else note = ordinal(pos) + ' highest of ' + of;
    return { pos, of, note, dir: meta.dir || null };
  }
  function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'], m = n % 100;
    return n + (s[(m - 20) % 10] || s[m] || s[0]);
  }

  // ---------- min/max & top lists ----------
  function extent(key) {
    const nums = S.map(s => s[key]).filter(v => typeof v === 'number');
    return [Math.min.apply(null, nums), Math.max.apply(null, nums)];
  }
  function topStates(key, n, desc) {
    const rows = S.filter(s => typeof s[key] === 'number')
      .slice().sort((a, b) => desc ? b[key] - a[key] : a[key] - b[key]);
    return rows.slice(0, n);
  }

  // ---------- state silhouette icons ----------
  const bboxCache = {};
  function computeBBoxes() {
    if (bboxCache._done) return;
    const hidden = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    hidden.setAttribute('aria-hidden', 'true');
    hidden.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
    document.body.appendChild(hidden);
    Object.keys(window.MAP_PATHS).forEach(ab => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', window.MAP_PATHS[ab]);
      hidden.appendChild(p);
      const b = p.getBBox();
      bboxCache[ab] = [b.x, b.y, b.width, b.height];
    });
    hidden.remove();
    bboxCache._done = true;
  }
  function stateIcon(abbr, size, color) {
    size = size || 28;
    color = color || 'currentColor';
    if (abbr === 'DC') {
      return `<svg class="st-icon" width="${size}" height="${size}" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><circle cx="5" cy="5" r="4" fill="${color}"/></svg>`;
    }
    computeBBoxes();
    const b = bboxCache[abbr];
    if (!b) return '';
    const pad = Math.max(b[2], b[3]) * 0.05;
    const x = b[0] - pad, y = b[1] - pad, w = b[2] + pad * 2, h = b[3] + pad * 2;
    const side = Math.max(w, h);
    const vx = x - (side - w) / 2, vy = y - (side - h) / 2;
    return `<svg class="st-icon" width="${size}" height="${size}" viewBox="${vx.toFixed(1)} ${vy.toFixed(1)} ${side.toFixed(1)} ${side.toFixed(1)}" aria-hidden="true" focusable="false"><path d="${window.MAP_PATHS[abbr]}" fill="${color}"/></svg>`;
  }

  // ---------- state detail dialog ----------
  const DIALOG_GROUPS = [
    ['Snapshot', ['nickname', 'capital', 'largestCity', 'statehood', 'pop', 'region', 'timezone', 'food']],
    ['Happiness & well-being', ['happinessRank', 'mentalDistress', 'lifeExp']],
    ['Money', ['income', 'incomeAdj', 'col', 'homeValue', 'rent', 'unemp', 'poverty']],
    ['Taxes', ['taxBurden', 'incomeTaxTop', 'salesTax', 'propTax', 'taxRank', 'hasIncomeTax']],
    ['Health, safety & schools', ['uninsured', 'crime', 'homicide', 'bachelors', 'k12']],
    ['Nature & environment', ['sceneryIdx', 'forestPct', 'waterViol', 'animalRank', 'temp', 'precip', 'solar']],
    ['Outdoors', ['coastline', 'highPoint', 'natParks', 'stateParks', 'skiAreas', 'fedLand']],
    ['On the road & water', ['restOvernight', 'vehicleInspection', 'gasTax', 'boaterEd', 'kayakReg', 'fishLic']],
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
    const groups = DIALOG_GROUPS.map(([title, keys]) => {
      const items = keys.filter(k => C[k]).map(k => {
        const r = rankOf(k, abbr);
        const desc = descOf(k);
        const rankChip = r ? `<span class="rank-chip${r.dir ? (r.pos <= 10 ? ' rank-good' : (r.pos > r.of - 10 ? ' rank-bad' : '')) : ''}" title="${r.note}">#${r.pos}</span>` : '';
        return `<div class="sd-item has-tip" tabindex="0" data-tip="${desc.replace(/"/g, '&quot;')}"
            aria-label="${C[k].label}: ${fmtVal(k, s[k])}${r ? ', ' + r.note : ''}. ${desc}">
          <div class="sd-v">${fmtVal(k, s[k])} ${rankChip}</div>
          <div class="sd-k">${C[k].label}</div>
        </div>`;
      }).join('');
      return items ? `<section class="sd-group"><h3>${title}</h3><div class="sd-grid">${items}</div></section>` : '';
    }).join('');
    d.innerHTML = `
      <div class="sd-head">
        <span class="sd-icon">${stateIcon(s.abbr, 42, 'var(--focus)')}</span>
        <h2>${s.name}</h2><span class="sd-nick">${s.nickname}</span>
        <button class="close-btn" aria-label="Close ${s.name} details">✕</button>
      </div>
      <div class="sd-body">
        <p class="sd-legend">Hover or focus any stat for what it means. <b>#N</b> = rank out of 51
          (green = top 10, red = bottom 10, where a direction is meaningful).</p>
        ${groups}
        <p style="color:var(--ink-muted);font-size:.85rem;margin-top:18px">Want every column? <a href="explore.html">Open the data explorer</a> ·
          <a href="explore.html#glossary">Glossary</a></p>
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

  window.SS = { fmtVal, percentiles, extent, topStates, rankOf, ordinal, descOf, stateIcon, openStateDialog, initReveals, reduceMotion };
  // color scales live here too (used by map + insights)
  const SEQ = ['#104281', '#184f95', '#1c5cab', '#256abf', '#2a78d6', '#3987e5', '#5598e7', '#6da7ec', '#86b6ef', '#9ec5f4', '#b7d3f6', '#cde2fb'];
  const DIV_NEG = ['#cde2fb', '#86b6ef', '#3987e5', '#256abf'];
  const DIV_POS = ['#f3c1c1', '#ee9d9d', '#e66767', '#c94848'];
  const DIV_MID = '#383835';
  window.SS.seqColor = function (t) {
    const i = Math.max(0, Math.min(SEQ.length - 1, Math.round(t * (SEQ.length - 1))));
    return SEQ[i];
  };
  window.SS.divColor = function (v, absMax) {
    if (!isFinite(v)) return DIV_MID;
    const t = Math.max(-1, Math.min(1, v / absMax));
    if (Math.abs(t) < 0.06) return DIV_MID;
    const arm = t < 0 ? DIV_NEG : DIV_POS;
    const i = Math.min(arm.length - 1, Math.floor(Math.abs(t) * arm.length));
    return arm[i];
  };
  window.SS.DIV_MID = DIV_MID;
})();
