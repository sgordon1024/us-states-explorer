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

  // food chips
  const strip = document.getElementById('food-strip');
  if (strip) {
    strip.innerHTML = S.map(s => `<span class="food-chip"><b>${s.abbr}</b> ${s.food}</span>`).join('');
  }

  SS.initReveals();
})();
