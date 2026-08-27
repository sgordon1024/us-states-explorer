/* "Find your state" quiz — two lengths, one matching engine.
   Scoring: every answer sets target percentiles (0–100) + weights on metrics.
   A state's score is the weighted closeness of its percentile profile to yours,
   so ANY of the 51 can win — extremes match extremes, middles match middles. */
(function () {
  'use strict';
  const S = window.STATES, C = window.COLS, SS = window.SS;
  const app = document.getElementById('survey-app');

  // ---------- helpers ----------
  const P = (m, t, w) => ({ kind: 'num', m, t, w });               // numeric percentile target
  const CAT = (key, val, w, want) => ({ kind: 'cat', key, val, w, want: want !== false });

  // Friendly names for "why" chips
  const WHY = {
    temp: 'climate', precip: 'rainfall', solar: 'sunshine', urban: 'city-vs-country feel',
    density: 'elbow room', homeValue: 'home prices', col: 'cost of living', rent: 'rents',
    income: 'salaries', incomeAdj: 'real buying power', gdpGrowth5: 'economic momentum',
    unemp: 'job market', taxBurden: 'tax burden', propTax: 'property taxes', k12: 'school funding',
    bachelors: 'educated neighbors', crime: 'safety', lifeExp: 'health & longevity',
    uninsured: 'healthcare coverage', margin: 'politics', _gunStrict: 'gun laws',
    religiosity: 'religious culture', _homeschoolReg: 'homeschool rules', migDom: 'momentum',
    coastline: 'water access', highPoint: 'mountains', skiAreas: 'ski access',
    natParks: 'national parks', stateParks: 'state parks', fedLand: 'public land',
    fishLic: 'fishing costs', huntLic: 'hunting costs', medianAge: 'age mix',
    cannabis: 'cannabis law', permitless: 'carry law', ballotInit: 'ballot initiatives',
    hasIncomeTax: 'income tax', region: 'region'
  };

  // ---------- question banks ----------
  const CLIMATE_Q = {
    id: 'winter', title: 'What should winter feel like?', type: 'radio',
    options: [
      { label: 'Deep, snowy, real winters', sub: 'Frozen lakes, wood stoves, proper boots', prefs: [P('temp', 6, 3)] },
      { label: 'Four honest seasons', sub: 'Snow happens, but so does summer', prefs: [P('temp', 35, 3)] },
      { label: 'Mild — a jacket, not a parka', sub: 'Winter is a rumor', prefs: [P('temp', 68, 3)] },
      { label: 'Never below 60°F, please', sub: 'Endless summer', prefs: [P('temp', 96, 3)] },
      { label: 'No strong preference', prefs: [] }
    ]
  };
  const RAIN_Q = {
    id: 'sky', title: 'Pick a sky.', type: 'radio',
    options: [
      { label: 'Lush, green and rainy', sub: 'Forests, humidity, thunderstorms', prefs: [P('precip', 85, 2)] },
      { label: 'A balance of rain and sun', prefs: [P('precip', 50, 2)] },
      { label: 'Dry, sunny, big blue sky', sub: 'Desert light, low humidity', prefs: [P('precip', 8, 2), P('solar', 88, 2)] },
      { label: 'Whatever falls, falls', prefs: [] }
    ]
  };
  const SETTING_Q = {
    id: 'setting', title: 'Your ideal front porch looks out on…', type: 'radio',
    options: [
      { label: 'A skyline', sub: 'Big-city energy, transit, everything delivered', prefs: [P('urban', 96, 3), P('density', 88, 2)] },
      { label: 'A cul-de-sac near a real metro', sub: 'Suburbs with a city in reach', prefs: [P('urban', 72, 3), P('density', 60, 1)] },
      { label: 'A small-town main street', prefs: [P('urban', 30, 3), P('density', 28, 2)] },
      { label: 'Nothing but land and sky', sub: 'The nearest neighbor is a rumor', prefs: [P('urban', 4, 3), P('density', 4, 3)] }
    ]
  };
  const HOME_Q = {
    id: 'home', title: 'What should a typical house cost?', type: 'radio',
    options: [
      { label: 'Under $250k — affordability first', prefs: [P('homeValue', 8, 3)] },
      { label: 'Around $250–400k', prefs: [P('homeValue', 38, 3)] },
      { label: 'Up to $500–600k for the right place', prefs: [P('homeValue', 70, 2)] },
      { label: 'Price is not the deciding factor', prefs: [] }
    ]
  };
  const PAY_Q = {
    id: 'pay', title: 'Money-wise, what are you optimizing?', type: 'radio',
    options: [
      { label: 'The biggest possible salary', sub: 'Raw earning power', prefs: [P('income', 90, 2)] },
      { label: 'What my salary actually buys', sub: 'Income adjusted for local prices', prefs: [P('incomeAdj', 90, 3)] },
      { label: 'I earn remotely — I just want life to be cheap', prefs: [P('col', 8, 3)] },
      { label: 'Not a money decision', prefs: [] }
    ]
  };
  const TAX_Q = {
    id: 'tax', title: 'How do you feel about taxes?', type: 'radio',
    options: [
      { label: 'Keep them as low as humanly possible', prefs: [P('taxBurden', 4, 3)], cats: [CAT('hasIncomeTax', 'No', 1)] },
      { label: 'Low-ish, but I’m not moving over it', prefs: [P('taxBurden', 30, 2)] },
      { label: 'I’ll pay more for stronger public services', prefs: [P('taxBurden', 72, 1), P('k12', 75, 1)] },
      { label: 'Indifferent', prefs: [] }
    ]
  };
  const SAFE_Q = {
    id: 'safety', title: 'How much does crime data drive your choice?', type: 'radio',
    options: [
      { label: 'I want one of the statistically safest states', prefs: [P('crime', 4, 3)] },
      { label: 'Reasonably safe is good enough', prefs: [P('crime', 28, 2)] },
      { label: 'I’m city-smart; averages don’t scare me', prefs: [] }
    ]
  };
  const POLITICS_Q = {
    id: 'politics', title: 'The politics around you — what fits?', type: 'radio',
    help: 'Based on the 2024 presidential margin. “Around you” matters differently to everyone — pick honestly.',
    options: [
      { label: 'Solidly conservative country', prefs: [P('margin', 90, 3)] },
      { label: 'Leans conservative', prefs: [P('margin', 68, 2)] },
      { label: 'Genuinely purple — elections are real fights', prefs: [P('margin', 50, 2.5)] },
      { label: 'Leans progressive', prefs: [P('margin', 32, 2)] },
      { label: 'Solidly progressive country', prefs: [P('margin', 8, 3)] },
      { label: 'I truly don’t care', prefs: [] }
    ]
  };
  const OUTDOORS_Q = {
    id: 'outdoors', title: 'Which of these would you actually do? (pick all that apply)', type: 'multi',
    options: [
      { label: 'Hunt or fish regularly', prefs: [P('fishLic', 20, 1), P('huntLic', 20, 1), P('fedLand', 65, 1)] },
      { label: 'Hike and camp in big public wilderness', prefs: [P('fedLand', 82, 2), P('natParks', 80, 1.5), P('stateParks', 70, 1)] },
      { label: 'Ski or snowboard every winter', prefs: [P('skiAreas', 86, 2)] },
      { label: 'Live for beaches and open water', prefs: [P('coastline', 86, 2.5)] },
      { label: 'Climb — I want real mountains on the horizon', prefs: [P('highPoint', 86, 2)] },
      { label: 'Honestly? Mostly indoors', prefs: [] }
    ]
  };
  const PACE_Q = {
    id: 'pace', title: 'Boomtown or backwater?', type: 'radio',
    options: [
      { label: 'Take me where everyone is moving', sub: 'Growth, cranes, new restaurants', prefs: [P('migDom', 90, 2), P('gdpGrowth5', 78, 1)] },
      { label: 'Established and steady', prefs: [P('migDom', 50, 1.5)] },
      { label: 'Out of fashion = underpriced. I’m in.', prefs: [P('migDom', 10, 2), P('col', 12, 1)] },
      { label: 'No preference', prefs: [] }
    ]
  };

  const SHORT_QS = [CLIMATE_Q, RAIN_Q, SETTING_Q, HOME_Q, TAX_Q, POLITICS_Q, SAFE_Q, OUTDOORS_Q];

  const LONG_QS = [
    CLIMATE_Q, RAIN_Q, SETTING_Q,
    {
      id: 'land', title: 'Whose land surrounds you?', type: 'radio',
      options: [
        { label: 'Vast public wilderness — BLM, national forest', sub: 'You can walk for days', prefs: [P('fedLand', 88, 2)] },
        { label: 'Farms and private land, neat and worked', prefs: [P('fedLand', 22, 1.5)] },
        { label: 'Doesn’t matter', prefs: [] }
      ]
    },
    {
      id: 'water', title: 'How close do you need big water?', type: 'radio',
      options: [
        { label: 'Ocean or Great Lake, non-negotiable', prefs: [P('coastline', 88, 3)] },
        { label: 'Nice bonus, not a dealbreaker', prefs: [P('coastline', 60, 1)] },
        { label: 'Landlocked is fine — lakes and rivers do it', prefs: [] }
      ]
    },
    {
      id: 'mtn', title: 'And mountains?', type: 'radio',
      options: [
        { label: 'Real peaks — 10,000ft+ on the horizon', prefs: [P('highPoint', 88, 2)] },
        { label: 'Hills and ridgelines are plenty', prefs: [P('highPoint', 55, 1)] },
        { label: 'Flat and open — I like a big horizon', prefs: [P('highPoint', 12, 1.5)] },
        { label: 'No preference', prefs: [] }
      ]
    },
    HOME_Q, PAY_Q,
    {
      id: 'jobs', title: 'How much should the local economy be booming?', type: 'radio',
      options: [
        { label: 'I need a hot job market', prefs: [P('gdpGrowth5', 85, 2), P('unemp', 18, 1.5)] },
        { label: 'Stable beats spectacular', prefs: [P('unemp', 15, 2)] },
        { label: 'My income doesn’t depend on the local economy', prefs: [] }
      ]
    },
    TAX_Q,
    {
      id: 'proptax', title: 'Planning to own a lot of land or an expensive home?', type: 'radio',
      help: 'Property tax rates range from 0.3% (Hawaii) to 1.9% (Illinois & New Jersey) of home value, every year.',
      options: [
        { label: 'Yes — property tax rates really matter to me', prefs: [P('propTax', 6, 2.5)] },
        { label: 'Somewhat', prefs: [P('propTax', 30, 1)] },
        { label: 'Not really', prefs: [] }
      ]
    },
    {
      id: 'schools', title: 'Kids and schools — part of the picture?', type: 'radio',
      options: [
        { label: 'Top-funded public schools are a priority', prefs: [P('k12', 88, 2.5), P('hsGrad', 75, 1)] },
        { label: 'Good-enough schools, well-rounded place', prefs: [P('k12', 60, 1)] },
        { label: 'We homeschool (see next question)', prefs: [] },
        { label: 'Not a factor', prefs: [] }
      ]
    },
    {
      id: 'homeschool', title: 'If you homeschool (or might):', type: 'radio',
      options: [
        { label: 'Maximum homeschool freedom, minimum paperwork', prefs: [P('_homeschoolReg', 4, 2)] },
        { label: 'Some structure and oversight is healthy', prefs: [P('_homeschoolReg', 80, 1)] },
        { label: 'Not applicable', prefs: [] }
      ]
    },
    {
      id: 'degrees', title: 'The people around you: how bookish?', type: 'radio',
      options: [
        { label: 'College-town energy — degrees everywhere', prefs: [P('bachelors', 88, 2)] },
        { label: 'A healthy mix', prefs: [P('bachelors', 50, 1)] },
        { label: 'Practical beats academic where I’m from', prefs: [P('bachelors', 18, 1.5)] },
        { label: 'No preference', prefs: [] }
      ]
    },
    SAFE_Q,
    {
      id: 'health', title: 'Healthcare and longevity stats — how heavily do they weigh?', type: 'radio',
      options: [
        { label: 'Heavily — long lives, insured neighbors', prefs: [P('lifeExp', 88, 2), P('uninsured', 12, 2)] },
        { label: 'Somewhat', prefs: [P('lifeExp', 70, 1)] },
        { label: 'Barely', prefs: [] }
      ]
    },
    POLITICS_Q,
    {
      id: 'guns', title: 'Gun laws: what’s your comfort zone?', type: 'radio',
      help: 'Scored on the Giffords 2025 grades — A states regulate most, F states least.',
      options: [
        { label: 'Strong gun rights — permitless carry country', prefs: [P('_gunStrict', 8, 2)], cats: [CAT('permitless', 'Yes', 1)] },
        { label: 'Somewhere sensible in the middle', prefs: [P('_gunStrict', 50, 1.5)] },
        { label: 'The strictest gun-safety laws available', prefs: [P('_gunStrict', 94, 2)], cats: [CAT('permitless', 'No', 1)] },
        { label: 'Not my issue', prefs: [] }
      ]
    },
    {
      id: 'cannabis', title: 'Legal recreational cannabis?', type: 'radio',
      options: [
        { label: 'Must be legal', cats: [CAT('cannabis', 'Yes', 2)] },
        { label: 'Prefer it stays illegal', cats: [CAT('cannabis', 'No', 1.5)] },
        { label: 'Don’t care either way', prefs: [] }
      ]
    },
    {
      id: 'faith', title: 'Religion in daily life around you:', type: 'radio',
      help: 'Share of adults who say religion is very important runs from 16% (VT, NH) to 61% (MS).',
      options: [
        { label: 'A deeply faith-centered community', prefs: [P('religiosity', 90, 2)] },
        { label: 'Present but not everywhere', prefs: [P('religiosity', 50, 1)] },
        { label: 'Largely secular', prefs: [P('religiosity', 8, 2)] },
        { label: 'No preference', prefs: [] }
      ]
    },
    {
      id: 'ballot', title: 'Do you want direct democracy — citizen ballot initiatives?', type: 'radio',
      options: [
        { label: 'Yes — voters should write laws too', cats: [CAT('ballotInit', 'Yes', 1.5)] },
        { label: 'Doesn’t matter to me', prefs: [] }
      ]
    },
    OUTDOORS_Q, PACE_Q,
    {
      id: 'age', title: 'The age of the crowd around you:', type: 'radio',
      options: [
        { label: 'Young — students, strollers, startups', prefs: [P('medianAge', 12, 1.5)] },
        { label: 'All ages, evenly', prefs: [P('medianAge', 50, 1)] },
        { label: 'Quieter and more retired suits me', prefs: [P('medianAge', 88, 1.5)] },
        { label: 'No preference', prefs: [] }
      ]
    },
    {
      id: 'region', title: 'Any part of the country calling you? (pick all that apply)', type: 'region',
      help: 'Leave everything unchecked if you’re truly open.',
      options: [
        { label: 'Northeast', region: 'Northeast' },
        { label: 'Midwest', region: 'Midwest' },
        { label: 'South', region: 'South' },
        { label: 'West', region: 'West' }
      ]
    }
  ];

  // ---------- scoring ----------
  function scoreStates(prefs, cats, regions) {
    const results = S.map(s => {
      let total = 0, wsum = 0;
      const detail = [];
      prefs.forEach(p => {
        const pct = SS.percentiles(p.m)[s.abbr];
        if (pct === null || pct === undefined) return;
        const closeness = 100 - Math.abs(pct - p.t);
        total += p.w * closeness; wsum += p.w;
        detail.push({ m: p.m, w: p.w, closeness });
      });
      cats.forEach(c => {
        const match = c.want ? s[c.key] === c.val : s[c.key] !== c.val;
        const closeness = match ? 100 : 15;
        total += c.w * closeness; wsum += c.w;
        detail.push({ m: c.key, w: c.w, closeness });
      });
      if (regions && regions.size > 0) {
        const closeness = regions.has(s.region) ? 100 : 20;
        total += 2 * closeness; wsum += 2;
        detail.push({ m: 'region', w: 2, closeness });
      }
      const score = wsum ? total / wsum : 50;
      return { s, score, detail };
    });
    results.sort((a, b) => b.score - a.score);
    return results;
  }

  // ---------- UI ----------
  let bank = null, mode = '', answers = {}, step = 0;

  function esc(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function renderPicker() {
    document.title = 'Find your state — The State of the States';
    app.innerHTML = `
      <h1 style="margin:34px 0 6px;font-size:clamp(1.8rem,5vw,2.8rem)">Which state actually fits you?</h1>
      <p style="color:var(--ink-2);max-width:62ch">Answer about weather, money, land, politics and lifestyle.
        Your answers become a target profile, and every one of the 51 jurisdictions is scored against it —
        the quiz doesn't play favorites, so North Dakota can beat Florida if that's who you are.</p>
      <div class="survey-pick">
        <div class="pick-card">
          <h2>The quick read</h2>
          <p><strong>8 questions · ~2 minutes.</strong> The big strokes: climate, setting, cost, taxes, politics, outdoors.</p>
          <button class="btn primary" data-mode="short">Start the short quiz</button>
        </div>
        <div class="pick-card">
          <h2>The full portrait</h2>
          <p><strong>25 questions · ~8 minutes.</strong> Everything the short quiz asks, plus land, schools, guns,
            faith, healthcare, mountains, momentum and more. Much sharper matches.</p>
          <button class="btn primary" data-mode="long">Start the full quiz</button>
        </div>
      </div>
      <p style="color:var(--ink-muted);font-size:.9rem">Skipping a question just means it won't count — “no preference” is always a legitimate answer.</p>`;
    app.querySelectorAll('button[data-mode]').forEach(b => b.addEventListener('click', () => {
      mode = b.dataset.mode;
      bank = mode === 'short' ? SHORT_QS : LONG_QS;
      answers = {}; step = 0;
      renderStep();
    }));
  }

  function renderStep() {
    const q = bank[step];
    const total = bank.length;
    const inputType = q.type === 'radio' ? 'radio' : 'checkbox';
    app.innerHTML = `
      <div class="q-progress">
        <div class="track" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${step}"
             aria-label="Question ${step + 1} of ${total}">
          <div class="fill" style="width:${(step / total * 100).toFixed(0)}%"></div>
        </div>
        <span class="txt">${step + 1} / ${total}</span>
      </div>
      <form id="qform">
        <fieldset class="q">
          <legend>${esc(q.title)}</legend>
          ${q.help ? `<p class="q-help">${esc(q.help)}</p>` : ''}
          ${q.options.map((o, i) => `
            <label class="opt">
              <input type="${inputType}" name="q" value="${i}" ${isChecked(q, i) ? 'checked' : ''}>
              <span><span class="opt-label">${esc(o.label)}</span>
              ${o.sub ? `<span class="opt-sub">${esc(o.sub)}</span>` : ''}</span>
            </label>`).join('')}
        </fieldset>
        <div class="survey-actions">
          ${step > 0 ? '<button type="button" class="btn" id="back-btn">← Back</button>' : '<a class="btn" href="survey.html" id="quit-link">← Quiz menu</a>'}
          <button type="submit" class="btn primary" id="next-btn">${step === total - 1 ? 'See my state →' : 'Next →'}</button>
        </div>
      </form>`;
    const form = app.querySelector('#qform');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const picked = Array.from(form.querySelectorAll('input[name="q"]:checked')).map(i => +i.value);
      if (q.type === 'radio' && picked.length === 0) {
        answers[q.id] = [];
      } else {
        answers[q.id] = picked;
      }
      if (step === total - 1) renderResults();
      else { step++; renderStep(); window.scrollTo({ top: 0, behavior: SS.reduceMotion ? 'auto' : 'smooth' }); focusHeading(); }
    });
    const back = app.querySelector('#back-btn');
    if (back) back.addEventListener('click', () => { step--; renderStep(); focusHeading(); });
    function focusHeading() { const lg = app.querySelector('legend'); if (lg) { lg.setAttribute('tabindex', '-1'); lg.focus({ preventScroll: true }); } }
  }
  function isChecked(q, i) { return (answers[q.id] || []).includes(i); }

  function collect() {
    const prefs = [], cats = [], regions = new Set();
    bank.forEach(q => {
      (answers[q.id] || []).forEach(idx => {
        const o = q.options[idx];
        if (!o) return;
        if (q.type === 'region') { regions.add(o.region); return; }
        (o.prefs || []).forEach(p => prefs.push(p));
        (o.cats || []).forEach(c => cats.push(c));
      });
    });
    return { prefs, cats, regions };
  }

  function renderResults() {
    const { prefs, cats, regions } = collect();
    const answered = prefs.length + cats.length + (regions.size ? 1 : 0);
    if (!answered) {
      app.innerHTML = `<div class="result-hero"><p class="rh-kicker">Well…</p>
        <h2>Anywhere, apparently</h2>
        <p style="color:var(--ink-2)">You said “no preference” to everything — a rare and beautiful freedom.
        Try again with at least one opinion?</p>
        <div class="survey-actions" style="justify-content:center"><button class="btn primary" id="retake">Retake the quiz</button></div></div>`;
      app.querySelector('#retake').addEventListener('click', renderPicker);
      return;
    }
    const ranked = scoreStates(prefs, cats, regions);
    const top = ranked[0];

    // why-chips: strongest & weakest contributions for the winner, deduped by metric
    const seen = new Set();
    const contribs = top.detail.filter(d => { if (seen.has(d.m)) return false; seen.add(d.m); return true; });
    const wins = contribs.filter(d => d.closeness >= 78).sort((a, b) => b.w * b.closeness - a.w * a.closeness).slice(0, 5);
    const trade = contribs.filter(d => d.closeness < 55).sort((a, b) => a.closeness - b.closeness).slice(0, 2);

    app.innerHTML = `
      <div class="result-hero">
        <p class="rh-kicker">Your state is</p>
        <h2>${top.s.name}</h2>
        <p class="rh-nick">“${top.s.nickname}”</p>
        <p class="rh-score">${top.score.toFixed(0)}% match${mode === 'short' ? ' · short quiz' : ''}</p>
        <div class="why-chips">
          ${wins.map(d => `<span class="why-chip">✓ nails your ${WHY[d.m] || d.m}</span>`).join('')}
          ${trade.map(d => `<span class="why-chip">⚖ trade-off: ${WHY[d.m] || d.m}</span>`).join('')}
        </div>
        <div class="survey-actions" style="justify-content:center;margin-top:22px">
          <button class="btn primary" id="see-profile">See ${esc(top.s.name)}'s full profile</button>
          <button class="btn" id="retake">Retake</button>
          ${mode === 'short' ? '<button class="btn" id="go-long">Try the full quiz</button>' : ''}
        </div>
      </div>

      <h3 style="margin:30px 0 8px">Also worth a look</h3>
      <ol class="runner-list">
        ${ranked.slice(1, 6).map((r, i) => `
          <li><span class="rk">${i + 2}</span>
            <span class="nm"><button style="all:unset;cursor:pointer;font-weight:750" data-state="${r.s.abbr}">${r.s.name}</button>
              <small>${r.s.nickname}</small></span>
            <span class="sc">${r.score.toFixed(0)}%</span></li>`).join('')}
      </ol>

      <details class="all-ranks">
        <summary>See how all 51 scored</summary>
        <ol class="runner-list" style="margin-top:12px">
          ${ranked.map((r, i) => `
            <li><span class="rk">${i + 1}</span>
              <span class="nm"><button style="all:unset;cursor:pointer;font-weight:750" data-state="${r.s.abbr}">${r.s.name}</button></span>
              <span class="sc">${r.score.toFixed(1)}%</span></li>`).join('')}
        </ol>
      </details>`;

    app.querySelector('#see-profile').addEventListener('click', () => SS.openStateDialog(top.s.abbr));
    app.querySelector('#retake').addEventListener('click', renderPicker);
    const gl = app.querySelector('#go-long');
    if (gl) gl.addEventListener('click', () => { mode = 'long'; bank = LONG_QS; answers = {}; step = 0; renderStep(); });
    app.querySelectorAll('button[data-state]').forEach(b =>
      b.addEventListener('click', () => SS.openStateDialog(b.dataset.state)));
    window.scrollTo({ top: 0, behavior: SS.reduceMotion ? 'auto' : 'smooth' });
  }

  renderPicker();
})();
