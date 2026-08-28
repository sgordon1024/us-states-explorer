/* Take-home pay comparator. All math runs locally; nothing is transmitted. */
(function () {
  'use strict';
  const S = window.STATES, SS = window.SS, T = window.TAXDATA;

  // ---------- tax engine ----------
  function progressive(brackets, taxable) {
    if (!brackets.length || taxable <= 0) return 0;
    let tax = 0;
    for (let i = 0; i < brackets.length; i++) {
      const lo = brackets[i][0], rate = brackets[i][1];
      const hi = i + 1 < brackets.length ? brackets[i + 1][0] : Infinity;
      if (taxable <= lo) break;
      tax += (Math.min(taxable, hi) - lo) * rate;
    }
    return tax;
  }
  function fedTax(income, status) {
    const f = T.federal[status];
    return progressive(f.brackets, Math.max(0, income - f.sd));
  }
  function fica(income, status) {
    const ss = 0.062 * Math.min(income, T.federal.ss_wage_base);
    const medicare = 0.0145 * income +
      0.009 * Math.max(0, income - T.federal.medicare_addl_threshold[status]);
    return ss + medicare;
  }
  function stateTax(abbr, income, status) {
    const st = T.states[abbr];
    if (!st) return 0;
    const p = st[status];
    if (!p.brackets.length) return 0;
    return progressive(p.brackets, Math.max(0, income - (p.sd || 0) - (p.pe || 0)));
  }
  // exposed for testing
  window.PAY = { progressive, fedTax, fica, stateTax };

  // ---------- UI ----------
  const usd = n => '$' + Math.round(n).toLocaleString('en-US');
  const salaryIn = document.getElementById('salary-in');
  const slider = document.getElementById('salary-slider');
  const homeSel = document.getElementById('home-state');
  const tiles = document.getElementById('pay-tiles');
  const body = document.getElementById('pay-body');
  const statusBtns = Array.from(document.querySelectorAll('[data-status]'));
  let status = 'single';

  S.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach(s => {
    homeSel.appendChild(new Option(s.name, s.abbr));
  });

  function parseSalary() {
    const n = parseInt(String(salaryIn.value).replace(/[^0-9]/g, ''), 10);
    return isFinite(n) ? Math.min(5e6, Math.max(0, n)) : 0;
  }

  function compute() {
    const income = parseSalary();
    const fed = fedTax(income, status);
    const fi = fica(income, status);
    const home = homeSel.value;
    document.getElementById('delta-col').textContent = home ? `vs ${home}` : 'vs comparison';

    const rows = S.map(s => {
      const st = stateTax(s.abbr, income, status);
      const take = income - fed - fi - st;
      return { s, st, take, adj: take / (s.col / 100) };
    }).sort((a, b) => b.take - a.take);

    const best = rows[0], worst = rows[rows.length - 1];
    const homeRow = home ? rows.find(r => r.s.abbr === home) : null;
    const bestAdj = rows.slice().sort((a, b) => b.adj - a.adj)[0];
    const ties = rows.filter(r => Math.abs(r.take - best.take) < 1).length;

    tiles.innerHTML = `
      <div class="stat-tile"><div class="big">${usd(best.take)}</div>
        <div class="who">${ties > 1 ? ties + ' states (no income tax)' : best.s.name}</div>
        <div class="note">highest take-home on ${usd(income)}</div></div>
      <div class="stat-tile"><div class="big">${usd(worst.take)}</div>
        <div class="who">${worst.s.name}</div>
        <div class="note">lowest take-home — ${usd(best.take - worst.take)} below the highest</div></div>
      <div class="stat-tile"><div class="big">${usd(bestAdj.adj)}</div>
        <div class="who">${bestAdj.s.name}</div>
        <div class="note">most local buying power (take-home ÷ price level)</div></div>
      ${homeRow ? `<div class="stat-tile"><div class="big">${usd(homeRow.take)}</div>
        <div class="who">${homeRow.s.name}</div>
        <div class="note">your comparison state — #${rows.indexOf(homeRow) + 1} of 51 on take-home</div></div>` : ''}`;

    const takeMin = worst.take, takeMax = best.take, span = (takeMax - takeMin) || 1;
    body.innerHTML = rows.map((r, i) => {
      const delta = homeRow ? r.take - homeRow.take : null;
      const deltaCls = homeRow && r.s.abbr !== home ? (delta > 0 ? 'dir-best' : (delta < 0 ? 'dir-worst' : '')) : '';
      const w = 8 + (r.take - takeMin) / span * 92;
      return `<tr>
        <td><button type="button" class="st-name" data-state="${r.s.abbr}" style="all:unset;cursor:pointer;font-weight:700"
          aria-label="Open ${r.s.name} profile"><span class="icon-cell">${SS.stateIcon(r.s.abbr, 20)} ${r.s.name}</span></button></td>
        <td class="num">${usd(r.st)}</td>
        <td class="num">${income ? (r.st / income * 100).toFixed(1) : '0.0'}%</td>
        <td class="num" style="font-weight:750">${usd(r.take)}</td>
        <td class="num">${usd(r.take / 12)}</td>
        <td class="num ${deltaCls}">${homeRow ? (r.s.abbr === home ? '—' : (delta >= 0 ? '+' : '−') + usd(Math.abs(delta))) : '—'}</td>
        <td class="num">${usd(r.adj)}</td>
        <td><span class="bl-track" style="display:block;height:10px"><span class="bl-fill" style="width:${w.toFixed(1)}%;transition:none;background:var(--aqua)"></span></span></td>
      </tr>`;
    }).join('');
  }

  let deb = 0;
  function schedule() { clearTimeout(deb); deb = setTimeout(compute, 120); }

  salaryIn.addEventListener('input', () => {
    const n = parseSalary();
    if (n >= +slider.min && n <= +slider.max) slider.value = n;
    schedule();
  });
  salaryIn.addEventListener('blur', () => {
    salaryIn.value = parseSalary().toLocaleString('en-US');
  });
  slider.addEventListener('input', () => {
    salaryIn.value = (+slider.value).toLocaleString('en-US');
    schedule();
  });
  statusBtns.forEach(b => b.addEventListener('click', () => {
    status = b.dataset.status;
    statusBtns.forEach(x => x.setAttribute('aria-checked', String(x === b)));
    compute();
  }));
  homeSel.addEventListener('change', compute);
  body.addEventListener('click', e => {
    const b = e.target.closest('button[data-state]');
    if (b) SS.openStateDialog(b.dataset.state);
  });

  compute();
})();
