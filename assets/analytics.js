/* Quiz-response analytics: local ledger + optional Google Form relay.
   Stored shape (one entry per completed quiz):
   { v: 1, ts: "2026-08-26T21:00:00Z", mode: "long"|"short",
     answers: { questionId: [optionIndexes] }, winner: "WY", score: 87.2,
     top5: ["WY","SD","ID","MT","ND"] }                                     */
(function () {
  'use strict';
  const KEY = 'sots-responses-v1';

  function all() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch (e) { return []; }
  }
  function save(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* storage full/blocked — ignore */ }
  }
  function record(entry) {
    entry.v = 1;
    entry.ts = new Date().toISOString();
    const list = all();
    list.push(entry);
    save(list);
    sendRemote(entry);
  }
  function sendRemote(entry) {
    const cfg = window.ANALYTICS_REMOTE || {};
    if (!cfg.formId || !cfg.entryId) return;
    try {
      const url = 'https://docs.google.com/forms/d/e/' + cfg.formId + '/formResponse';
      const body = new URLSearchParams();
      body.set(cfg.entryId, JSON.stringify(entry));
      fetch(url, { method: 'POST', mode: 'no-cors', body }).catch(function () {});
    } catch (e) { /* never let analytics break the quiz */ }
  }
  function toCSV(list) {
    const head = ['timestamp', 'mode', 'winner', 'score', 'top5', 'answers_json'];
    const rows = list.map(r => [
      r.ts, r.mode, r.winner, r.score,
      (r.top5 || []).join('|'),
      JSON.stringify(r.answers || {}).replace(/"/g, '""')
    ]);
    return head.join(',') + '\n' + rows.map(r =>
      r.map(c => '"' + String(c) + '"').join(',')).join('\n');
  }
  function download(name, text, type) {
    const blob = new Blob([text], { type: type || 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function clearAll() { save([]); }

  window.SSAnalytics = { all, record, toCSV, download, clearAll, KEY };
})();
