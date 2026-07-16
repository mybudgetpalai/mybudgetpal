/* MyBudgetPal — pure calculation library
 *
 * Extracted from index.html so the same code can be unit-tested in Node.
 * RULES FOR THIS FILE:
 *   - Every function here must be pure: arguments in, value out.
 *   - No reads of FX, CAT_CONFIG, DEV_NOW, window, document, or any other
 *     module-level mutable state. If a function needs config, it takes it
 *     as an argument.
 *   - No JSX. This file loads BEFORE Babel, as a plain script.
 *   - If you add a function here, add tests for it.
 *
 * Loaded in the browser via <script src="lib/calc.js"> which attaches
 * everything to window. Loaded in Node via module.exports at the bottom.
 */
(function (root) {
  "use strict";

  var MONTHS_SHORT = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

  /* ---------------- date & month helpers ---------------- */

  function pad2(n) { return String(n).padStart(2, "0"); }

  function addMonths(key, n) {
    let y = +key.slice(0, 4), m = +key.slice(5, 7) + n;
    while (m > 12) { m -= 12; y++; }
    while (m < 1) { m += 12; y--; }
    return y + "-" + pad2(m);
  }

  function monthKeysBetween(fromKey, toKey) {
    const out = []; let k = fromKey;
    while (k <= toKey && out.length < 60) { out.push(k); k = addMonths(k, 1); }
    return out;
  }

  function lastNMonthKeys(endKey, n) {
    let y = +endKey.slice(0, 4), m = +endKey.slice(5, 7);
    const keys = [];
    for (let i = 0; i < n; i++) { keys.unshift(y + "-" + pad2(m)); m--; if (m === 0) { m = 12; y--; } }
    return keys;
  }

  function latestMonthKey(txs) {
    let max = "";
    (txs || []).forEach((t) => { if (t.date && t.date.slice(0, 7) > max) max = t.date.slice(0, 7); });
    return max || new Date().toISOString().slice(0, 7);
  }

  function ordinalDay(n) {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  /* Date order: "dmy" (UK) vs "mdy" (US). Inferred per-file from any row
     where one part exceeds 12 and can therefore only be the day. */
  function inferDateOrder(values) {
    for (const v of (values || [])) {
      const m = String(v || "").trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
      if (!m) continue;
      const a = +m[1], b = +m[2];
      if (a > 12 && b <= 12) return "dmy";
      if (b > 12 && a <= 12) return "mdy";
    }
    return null;
  }

  function normalizeDate(raw, order) {
    if (!raw) return null;
    const s = String(raw).trim();
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return m[1] + "-" + pad2(m[2]) + "-" + pad2(m[3]);
    m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (m) {
      let a = +m[1], b = +m[2], y = +m[3], d, mo;
      if (order === "mdy") { mo = a; d = b; } else { d = a; mo = b; }
      if (mo > 12 && d <= 12) { const t = d; d = mo; mo = t; }
      if (y < 100) y += 2000;
      if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
      return y + "-" + pad2(mo) + "-" + pad2(d);
    }
    m = s.toLowerCase().match(/^(\d{1,2})\s+([a-z]{3})[a-z]*\s*(\d{4})?/);
    if (m) {
      const mo = MONTHS_SHORT.indexOf(m[2]) + 1;
      if (mo > 0) return (m[3] || String(new Date().getFullYear())) + "-" + pad2(mo) + "-" + pad2(m[1]);
    }
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
    return null;
  }

  /* ---------------- CSV ---------------- */

  function parseCSVLine(line) {
    const out = [];
    let cur = "", inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) {
        /* A comma between digits is a thousands separator (-1,234.56), not
           a field break. Outside quotes only, so quoted fields are untouched. */
        const grp = line.slice(i + 1, i + 4);
        const after = line[i + 4];
        if (/\d$/.test(cur) && /^\d{3}$/.test(grp) && (after === undefined || !/\d/.test(after))) { continue; }
        out.push(cur.trim()); cur = ""; continue;
      }
      cur += ch;
    }
    out.push(cur.trim());
    return out;
  }

  /* ---------------- transfers ---------------- */

  function isTransferDesc(desc) {
    const d = " " + String(desc || "").toLowerCase() + " ";
    return ["bank transfer", "transfer to", "transfer from", "internal transfer", "faster payment",
            "standing order", " trf ", " xfer ", "to savings", "from savings", "savings transfer",
            "own account"].some((k) => d.includes(k));
  }

  /* ---------------- month aggregates ---------------- */

  function spendForMonth(txs, k) {
    return txs.filter((t) => t.date.slice(0, 7) === k && t.category !== "Income")
              .reduce((s, t) => s - t.amount, 0);
  }

  function incomeForMonth(txs, k) {
    return txs.filter((t) => t.date.slice(0, 7) === k && t.category === "Income")
              .reduce((s, t) => s + t.amount, 0);
  }

  function spendByCategoryForMonth(txs, k) {
    const o = {};
    txs.filter((t) => t.date.slice(0, 7) === k && t.category !== "Income")
       .forEach((t) => { o[t.category] = (o[t.category] || 0) - t.amount; });
    return o;
  }

  function spendByCategoryForMonthUpToDay(txs, k, day) {
    const o = {};
    txs.filter((t) => t.date.slice(0, 7) === k && t.category !== "Income" && (+t.date.slice(8, 10)) <= day)
       .forEach((t) => { o[t.category] = (o[t.category] || 0) - t.amount; });
    return o;
  }

  /* Largest-remainder rounding so shares always sum to 100. */
  function sharePercents(values, total) {
    const t = Number(total) || 0;
    if (t <= 0) return (values || []).map(() => 0);
    const exact = (values || []).map((v) => ((Number(v) || 0) / t) * 100);
    const floors = exact.map((e) => Math.floor(e));
    let left = Math.round(exact.reduce((s, e) => s + e, 0)) - floors.reduce((s, f) => s + f, 0);
    const order = exact.map((e, i) => ({ i, frac: e - Math.floor(e) })).sort((a, b) => b.frac - a.frac);
    const out = floors.slice();
    for (let j = 0; j < order.length && left > 0; j++, left--) out[order[j].i] += 1;
    return out;
  }

  /* ---------------- FX key (pure part of FX only) ---------------- */

  function fxKey(m, f, t) { return m + "|" + f + "|" + t; }

  /* ---------------- dedup ---------------- */

  function txKey(t) {
    return (t.date || "") + "|" + (t.name || "").toLowerCase().replace(/\s+/g, " ").trim()
           + "|" + (Number(t.amount) || 0).toFixed(2);
  }

  /* Key = date + description + amount. Genuine same-day identical transactions
     are preserved by only skipping as many copies as already exist. */
  function dedupeTransactions(incoming, existing) {
    const existingCounts = {};
    (existing || []).forEach((t) => { const k = txKey(t); existingCounts[k] = (existingCounts[k] || 0) + 1; });
    const seen = {};
    const kept = [];
    let skipped = 0;
    (incoming || []).forEach((t) => {
      const k = txKey(t);
      seen[k] = (seen[k] || 0) + 1;
      if (seen[k] > (existingCounts[k] || 0)) kept.push(t);
      else skipped++;
    });
    return { kept, skipped };
  }

  /* ---------------- recurring bills ---------------- */

  const SKIP_BILL_CATS = ["Dining", "Groceries", "Transport"];

  /* Needs >=2 distinct months to call something recurring, and rejects
     groups whose amounts drift more than 20% (or £2, whichever is larger). */
  function detectRecurringBills(txs) {
    const groups = {};
    (txs || []).filter((t) => t.amount < 0 && t.date && !SKIP_BILL_CATS.includes(t.category)).forEach((t) => {
      const key = t.name.toLowerCase().replace(/\d+/g, "").replace(/\s+/g, " ").trim();
      (groups[key] = groups[key] || []).push(t);
    });
    const bills = [];
    Object.values(groups).forEach((list) => {
      const months = new Set(list.map((t) => t.date.slice(0, 7)));
      if (months.size < 2) return;
      const avg = list.reduce((s, t) => s + Math.abs(t.amount), 0) / list.length;
      const steady = list.every((t) => Math.abs(Math.abs(t.amount) - avg) <= Math.max(avg * 0.2, 2));
      if (!steady) return;
      const days = list.map((t) => +t.date.slice(8, 10));
      const due = Math.round(days.reduce((a, b) => a + b, 0) / days.length);
      bills.push({ name: list[0].name, amount: Math.round(avg * 100) / 100, frequency: "Monthly", due: ordinalDay(due) });
    });
    return bills.sort((a, b) => b.amount - a.amount);
  }

  /* Pure core of remainingBillsThisMonth. The original reads currentMonthKey()
     and today() from module state; here both are explicit arguments so the
     behaviour can be tested at any date. */
  function remainingBillsThisMonthPure(txs, excludes, monthKey, todayDay) {
    const ex = excludes || [];
    const norm = (n) => String(n || "").toLowerCase().replace(/\d+/g, "").replace(/\s+/g, " ").trim();
    const paidThisMonth = new Set(
      (txs || []).filter((t) => t.amount < 0 && t.date && t.date.slice(0, 7) === monthKey).map((t) => norm(t.name))
    );
    return detectRecurringBills(txs || [])
      .filter((b) => ex.includes(b.name) && b.amount > 0)
      .map((b) => {
        const dueDay = parseInt(b.due, 10) || 0;
        const paid = paidThisMonth.has(norm(b.name));
        return Object.assign({}, b, { dueDay, paid, upcoming: !paid && dueDay >= todayDay });
      });
  }

  var API = {
    pad2: pad2,
    addMonths: addMonths,
    monthKeysBetween: monthKeysBetween,
    lastNMonthKeys: lastNMonthKeys,
    latestMonthKey: latestMonthKey,
    ordinalDay: ordinalDay,
    inferDateOrder: inferDateOrder,
    normalizeDate: normalizeDate,
    parseCSVLine: parseCSVLine,
    isTransferDesc: isTransferDesc,
    spendForMonth: spendForMonth,
    incomeForMonth: incomeForMonth,
    spendByCategoryForMonth: spendByCategoryForMonth,
    spendByCategoryForMonthUpToDay: spendByCategoryForMonthUpToDay,
    sharePercents: sharePercents,
    fxKey: fxKey,
    txKey: txKey,
    dedupeTransactions: dedupeTransactions,
    detectRecurringBills: detectRecurringBills,
    remainingBillsThisMonthPure: remainingBillsThisMonthPure,
    SKIP_BILL_CATS: SKIP_BILL_CATS,
  };

  /* Browser: attach each to window so index.html's existing call sites
     (which call these bare, e.g. detectRecurringBills(txs)) keep working. */
  if (typeof window !== "undefined") {
    Object.keys(API).forEach(function (k) { root[k] = API[k]; });
    root.MBPCalc = API;
  }
  if (typeof module !== "undefined" && module.exports) { module.exports = API; }
})(typeof window !== "undefined" ? window : globalThis);
