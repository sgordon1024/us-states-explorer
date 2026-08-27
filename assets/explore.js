/* Data explorer: category picker, sortable columns, filters. */
(function () {
  'use strict';
  const S = window.STATES, C = window.COLS, SS = window.SS;

  // Category -> columns (name/abbr always shown first)
  const GROUPS = {};
  Object.keys(C).forEach(k => {
    if (k === 'name' || k === 'abbr') return;
    const g = C[k].group;
    (GROUPS[g] = GROUPS[g] || []).push(k);
  });
  const GROUP_ORDER = ['People', 'Geography', 'Economy', 'Cost of living', 'Housing', 'Taxes', 'Well-being', 'Health', 'Education', 'Safety', 'Nature & environment', 'Climate & land', 'Politics', 'Outdoors', 'On the road & water', 'Laws', 'Culture', 'Identity'];
  const HEADLINE = ['region', 'pop', 'income', 'homeValue', 'col', 'taxBurden', 'happinessRank', 'lifeExp', 'crime', 'sceneryIdx', 'temp', 'margin'];

  const groupSel = document.getElementById('group-select');
  groupSel.appendChild(new Option('Headline metrics', '__headline'));
  GROUP_ORDER.filter(g => GROUPS[g]).forEach(g => groupSel.appendChild(new Option(g, g)));

  const regionSel = document.getElementById('region-select');
  const search = document.getElementById('state-search');
  const chips = Array.from(document.querySelectorAll('.chip-toggle'));
  const thead = document.getElementById('table-head');
  const tbody = document.getElementById('table-body');
  const countEl = document.getElementById('result-count');

  let sortKey = 'name', sortDesc = false;

  const FILTER_TESTS = {
    noIncomeTax: s => s.hasIncomeTax === 'No' || s.hasIncomeTax === 'No (cap gains only)',
    cannabis: s => s.cannabis === 'Yes',
    permitless: s => s.permitless === 'Yes',
    ballotInit: s => s.ballotInit === 'Yes'
  };

  function activeCols() {
    const g = groupSel.value;
    return g === '__headline' ? HEADLINE : GROUPS[g];
  }

  function filteredRows() {
    const q = search.value.trim().toLowerCase();
    const region = regionSel.value;
    const active = chips.filter(c => c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.filter);
    return S.filter(s => {
      if (region && s.region !== region) return false;
      if (q && !(s.name.toLowerCase().includes(q) || s.abbr.toLowerCase() === q)) return false;
      return active.every(f => FILTER_TESTS[f](s));
    });
  }

  function render() {
    const cols = activeCols();
    const rows = filteredRows().slice();
    rows.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      let cmp;
      if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
      else if (av == null) cmp = 1; else if (bv == null) cmp = -1;
      else cmp = String(av).localeCompare(String(bv));
      return sortDesc ? -cmp : cmp;
    });

    // header
    const allKeys = ['name'].concat(cols);
    thead.innerHTML = '<tr>' + allKeys.map(k => {
      const isSorted = k === sortKey;
      const arrow = isSorted ? (sortDesc ? '↓' : '↑') : '';
      const ariaSort = isSorted ? (sortDesc ? 'descending' : 'ascending') : 'none';
      const label = k === 'name' ? 'State' : C[k].label;
      const desc = k === 'name' ? '' : SS.descOf(k);
      return `<th scope="col" aria-sort="${ariaSort}" ${desc ? `title="${desc.replace(/"/g, '&quot;')}"` : ''}>
        <button type="button" data-sort="${k}" aria-label="Sort by ${label}. ${desc}">${label} <span aria-hidden="true">${arrow}</span></button></th>`;
    }).join('') + '</tr>';

    // best/worst tint per column
    const extremes = {};
    cols.forEach(k => {
      if (!C[k].dir) return;
      const nums = rows.map(r => r[k]).filter(v => typeof v === 'number');
      if (nums.length < 2) return;
      const mx = Math.max.apply(null, nums), mn = Math.min.apply(null, nums);
      extremes[k] = C[k].dir === 'high' ? { best: mx, worst: mn } : { best: mn, worst: mx };
    });

    tbody.innerHTML = rows.map(s => {
      const cells = cols.map(k => {
        const v = s[k];
        let cls = 'num';
        if (extremes[k] && typeof v === 'number') {
          if (v === extremes[k].best) cls += ' dir-best';
          else if (v === extremes[k].worst) cls += ' dir-worst';
        }
        if (C[k].fmt === 'txt') cls = '';
        return `<td class="${cls}">${SS.fmtVal(k, v)}</td>`;
      }).join('');
      return `<tr><td><button type="button" class="st-name" data-state="${s.abbr}" style="all:unset;cursor:pointer;font-weight:700" aria-label="Open ${s.name} profile">
        <span class="icon-cell">${SS.stateIcon(s.abbr, 20)} ${s.name}</span></button></td>${cells}</tr>`;
    }).join('');

    countEl.textContent = rows.length === 51 ? 'Showing all 51 jurisdictions (50 states + DC)' :
      `Showing ${rows.length} of 51 jurisdictions`;
  }

  thead.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-sort]');
    if (!b) return;
    const k = b.dataset.sort;
    if (sortKey === k) sortDesc = !sortDesc;
    else { sortKey = k; sortDesc = C[k] && C[k].fmt !== 'txt' && k !== 'name'; }
    render();
  });
  tbody.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-state]');
    if (b) SS.openStateDialog(b.dataset.state);
  });
  chips.forEach(c => c.addEventListener('click', () => {
    c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    render();
  }));
  [groupSel, regionSel].forEach(el => el.addEventListener('change', () => {
    const cols = activeCols();
    if (sortKey !== 'name' && !cols.includes(sortKey)) { sortKey = 'name'; sortDesc = false; }
    render();
  }));
  search.addEventListener('input', render);

  // glossary
  const gl = document.getElementById('glossary-list');
  if (gl) {
    const entries = Object.keys(C)
      .filter(k => SS.descOf(k))
      .map(k => `<dt>${C[k].label}</dt><dd>${SS.descOf(k)}</dd>`);
    gl.innerHTML = entries.join('');
  }

  render();
})();
