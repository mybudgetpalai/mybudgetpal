
const { useState, useRef, useEffect } = React;
const APP_NAME = "TwoPockets";

/* ---------------- Icons (inline SVG, stroke = currentColor) ---------------- */
const ICON_PATHS = {
  refresh: "M23 4v6h-6|M1 20v-6h6|M3.51 9a9 9 0 0 1 14.85-3.36L23 10|M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  home: "M4 11.5 12 4l8 7.5|M6 10v9a1 1 0 0 0 1 1h3v-5a2 2 0 0 1 4 0v5h3a1 1 0 0 0 1-1v-9",
  pie: "M3 3v16a2 2 0 0 0 2 2h16|M7 16v-4|M12 16V8|M17 16v-6",
  bulb: "M15 14c.2-1 .7-1.7 1.4-2.5A6 6 0 1 0 6 8c0 1.3.5 2.5 1.6 3.5.7.7 1.2 1.5 1.4 2.5|M9 18h6|M10 22h4",
  home: "M4 11.5 12 4l8 7.5|M6 10v9a1 1 0 0 0 1 1h3v-5a2 2 0 0 1 4 0v5h3a1 1 0 0 0 1-1v-9",
  pie: "M3 3v16a2 2 0 0 0 2 2h16|M7 16v-4|M12 16V8|M17 16v-6",
  bulb: "M15 14c.2-1 .7-1.7 1.4-2.5A6 6 0 1 0 6 8c0 1.3.5 2.5 1.6 3.5.7.7 1.2 1.5 1.4 2.5|M9 18h6|M10 22h4",
  groceries: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z|M3 6h18|M16 10a4 4 0 0 1-8 0",
  dining: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2|M7 2v20|M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3|M21 15v7",
  transport: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L17 10l-2.2-3.5c-.4-.6-1-.9-1.7-.9H9c-.6 0-1.2.3-1.6.8L4.8 10l-2.3 1.1C1.6 11.5 1 12.3 1 13.2V16c0 .6.4 1 1 1h2|M5 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0|M15 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0",
  shopping: "M2 2h3l2.6 12.6A2 2 0 0 0 9.6 16h8.7a2 2 0 0 0 2-1.6L22 7H6|M8 20a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0|M17 20a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0",
  subscriptions: "M17 2l4 4-4 4|M3 11V9a4 4 0 0 1 4-4h14|M7 22l-4-4 4-4|M21 13v2a4 4 0 0 1-4 4H3",
  bills: "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z|M8 8h8|M8 12h8|M8 16h5",
  income: "M2 6h20v12H2Z|M10 12a2 2 0 1 0 4 0 2 2 0 1 0-4 0|M6 12h.01|M18 12h.01",
  tag: "M12 2H2v10l9.3 9.3a1.9 1.9 0 0 0 2.7 0l7-7a1.9 1.9 0 0 0 0-2.7L12 2Z|M7 7h.01",
  other: "M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18Z|M8 12h.01|M12 12h.01|M16 12h.01",
  check: "M20 6 9 17l-5-5",
  x: "M18 6 6 18|M6 6l12 12",
  plus: "M12 5v14|M5 12h14",
  alert: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z|M12 9v4|M12 17h.01",
  edit: "M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z",
  inbox: "M22 12h-6l-2 3h-4l-2-3H2|M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1Z",
  bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9|M13.7 21a2 2 0 0 1-3.4 0",
  upload: "M22 12h-6l-2 3h-4l-2-3H2|M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1Z|M12 15V3|M8.5 6.5 12 3l3.5 3.5",
  file: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z|M14 2v6h6",
  chart: "M3 3v18h18|M8 17V9|M13 17V5|M18 17v-3",
  linechart: "M3 3v18h18|M7 15l4-4 3 3 5-6",
  target: "M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18Z|M12 7a5 5 0 1 0 0 10 5 5 0 1 0 0-10Z|M12 11a1 1 0 1 0 0 2 1 1 0 1 0 0-2Z",
  bank: "M3 22h18|M6 18v-7|M10 18v-7|M14 18v-7|M18 18v-7|M12 2 2 8h20L12 2Z",
  calendar: "M8 2v4|M16 2v4|M3 6h18v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z|M3 10h18",
  sliders: "M4 21v-7|M4 10V3|M12 21v-9|M12 8V3|M20 21v-5|M20 12V3|M1 14h6|M9 8h6|M17 16h6",
  sparkles: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z|M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z",
  star4: "M12 4l2.1 5.9L20 12l-5.9 2.1L12 20l-2.1-5.9L4 12l5.9-2.1L12 4Z",
  /* "ask" is a conversation, not magic — the sparkle read as a generic AI badge */
  ask: "M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z",
  trending: "M22 7 13.5 15.5l-5-5L2 17|M16 7h6v6",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18Z|M12 11v5|M12 8h.01",
  checkcircle: "M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18Z|M8.5 12.2l2.4 2.4 4.6-4.8",
};
/* Same mark as the login splash and boot screen. Bar heights keep the splash's
   1 : 1.64 : 2.27 ratio (22/36/50) so the logo reads identically at any size. */
function Icon({ name, size = 16, strokeWidth = 2, className = "", style }) {
  const d = ICON_PATHS[name] || ICON_PATHS.tag;
  return (
    <svg className={"ic " + className} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.split("|").map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}
function renderAskAnswer(text) {
  const bold = (s) => {
    const parts = String(s).split("**");
    return parts.map((p, i) => (i % 2 === 1 ? <strong key={i}>{p}</strong> : p));
  };
  const lines = String(text || "").split("\n");
  const out = [];
  let table = null;
  const flushTable = () => {
    if (!table || !table.length) { table = null; return; }
    const [head, ...body] = table;
    out.push(
      <table className="ask-md-table" key={"t" + out.length}>
        <thead><tr>{head.map((c, i) => <th key={i}>{bold(c)}</th>)}</tr></thead>
        <tbody>{body.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci}>{bold(c)}</td>)}</tr>)}</tbody>
      </table>
    );
    table = null;
  };
  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (line.startsWith("|")) {
      const cells = line.split("|").map((c) => c.trim()).filter((c, i, a) => !(i === 0 && c === "") && !(i === a.length - 1 && c === ""));
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) return; // separator row
      table = table || [];
      table.push(cells);
      return;
    }
    flushTable();
    if (!line) return;
    if (/^#{1,4}\s/.test(line)) { out.push(<p className="ask-md-h" key={idx}>{bold(line.replace(/^#{1,4}\s*/, ""))}</p>); return; }
    if (/^[-•]\s/.test(line)) { out.push(<p className="ask-md-li" key={idx}>{bold(line.replace(/^[-•]\s*/, ""))}</p>); return; }
    out.push(<p className="ask-md-p" key={idx}>{bold(line)}</p>);
  });
  flushTable();
  return out;
}
const CATEGORY_ICONS = {
  Groceries: "groceries", Dining: "dining", Transport: "transport", Shopping: "shopping",
  Subscriptions: "subscriptions", Bills: "bills", Entertainment: "tag", Income: "income", Uncategorized: "tag", Other: "other",
};
function CountUp({ value, format, duration = 800 }) {
  const [display, setDisplay] = useState(() => Number(value) || 0);
  const rafRef = useRef(null);
  useEffect(() => {
    const target = Number(value) || 0;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setDisplay(target); return; }
    const startT = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - startT) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(target * e);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    setDisplay(0);
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);
  return <React.Fragment>{(format || ((n) => Math.round(n)))(display)}</React.Fragment>;
}

const SUPABASE_URL = "https://pjqjzcmqbeqgzyhpbhfz.supabase.co";
const SUPABASE_KEY = "sb_publishable_M6NKJyabkWYkzYoEMPgoaA_Pw8x53Vg";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchProfile(userId) {
  const { data } = await supabaseClient.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data;
}
async function fetchBanks(userId) {
  const { data } = await supabaseClient.from("banks").select("*").eq("user_id", userId);
  return data || [];
}
function rowToGoal(r) { return { id: r.id, name: r.name, target: Number(r.target_amount) || 0, saved: Number(r.saved_amount) || 0, targetDate: r.target_date || null }; }
async function fetchGoals(userId) {
  const { data } = await supabaseClient.from("goals").select("*").eq("user_id", userId).order("created_at", { ascending: true });
  return (data || []).map(rowToGoal);
}
async function addGoalToDb(userId, g) {
  const { data, error } = await supabaseClient.from("goals").insert({
    user_id: userId, name: g.name, target_amount: g.target, saved_amount: g.saved || 0, target_date: g.targetDate || null,
  }).select().single();
  if (error) throw error;
  return rowToGoal(data);
}
async function updateGoalInDb(id, fields) {
  const patch = {};
  if (fields.saved !== undefined) patch.saved_amount = fields.saved;
  if (fields.name !== undefined) patch.name = fields.name;
  if (fields.target !== undefined) patch.target_amount = fields.target;
  if (fields.targetDate !== undefined) patch.target_date = fields.targetDate;
  const { error } = await supabaseClient.from("goals").update(patch).eq("id", id);
  if (error) throw error;
}
async function deleteGoalFromDb(id) {
  const { error } = await supabaseClient.from("goals").delete().eq("id", id);
  if (error) throw error;
}
async function fetchTargets(userId, monthKey) {
  const { data } = await supabaseClient.from("targets").select("*").eq("user_id", userId);
  const rows = data || [];
  const key = monthKey || (new Date().toISOString().slice(0, 7));
  const pick = (k) => { const o = {}; rows.filter((r) => (r.month || null) === k).forEach((r) => { o[r.category] = r.monthly_target; }); return o; };
  let obj = pick(key);
  if (Object.keys(obj).length) return obj;
  const months = [...new Set(rows.map((r) => r.month).filter(Boolean))].sort();
  if (months.length) { obj = pick(months[months.length - 1]); if (Object.keys(obj).length) return obj; }
  const legacy = {}; rows.filter((r) => !r.month).forEach((r) => { legacy[r.category] = r.monthly_target; }); return legacy;
}
async function fetchAllTargets(userId) {
  const { data } = await supabaseClient.from("targets").select("*").eq("user_id", userId);
  const rows = data || [];
  const map = {};
  rows.forEach((r) => { const k = r.month || null; if (!k) return; (map[k] = map[k] || {})[r.category] = r.monthly_target; });
  return map;
}
function rowToReview(r) { return { month: r.month, net: Number(r.net) || 0, action: r.action }; }
function rowToRollover(r) { return { id: r.id, month: r.month, amount: Number(r.amount) || 0, source: r.source, note: r.note }; }
async function fetchMonthReviews(userId) {
  try { const { data } = await supabaseClient.from("month_reviews").select("*").eq("user_id", userId); return (data || []).map(rowToReview); }
  catch (e) { return []; }
}
async function fetchRollovers(userId) {
  try { const { data } = await supabaseClient.from("budget_rollovers").select("*").eq("user_id", userId); return (data || []).map(rowToRollover); }
  catch (e) { return []; }
}
function rolloverForMonth(rollovers, monthKey) { return (rollovers || []).filter((r) => r.month === monthKey).reduce((s, r) => s + r.amount, 0); }

/* ---------------- long-term plan helpers ---------------- */
const FLEX_CATEGORIES = ["Dining", "Shopping", "Subscriptions"];
function planFromProfile(profile) {
  if (!profile || profile.plan_target_balance == null || !profile.plan_target_month) return null;
  return { targetBalance: Math.round(Number(profile.plan_target_balance) || 0), targetMonth: profile.plan_target_month, method: profile.plan_method || "manual", openingBalance: Number(profile.plan_opening_balance) || null };
}
async function savePlanToDb(userId, plan) {
  if (!userId) return;
  await supabaseClient.from("profiles").upsert({
    id: userId,
    plan_target_balance: plan ? plan.targetBalance : null,
    plan_target_month: plan ? plan.targetMonth : null,
    plan_method: plan ? plan.method : null,
    plan_opening_balance: plan ? plan.openingBalance : null,
  });
}
function monthKeysBetween(fromKey, toKey) {
  const out = []; let k = fromKey;
  while (k <= toKey && out.length < 60) { out.push(k); k = addMonths(k, 1); }
  return out;
}
function plannedIncomeFor(allTargets, k, txs) {
  const o = allTargets && allTargets[k];
  if (o && Number(o["Income"]) > 0) return Math.round(Number(o["Income"]));
  const keys = allTargets ? Object.keys(allTargets).sort() : [];
  for (let i = keys.length - 1; i >= 0; i--) { const x = Number(allTargets[keys[i]]["Income"]); if (x > 0) return Math.round(x); }
  return Math.round(typicalIncome(txs, null)) || 0;
}
function plannedCatFor(allTargets, k, c, fallbackAvg) {
  const o = allTargets && allTargets[k];
  if (o && TX_CATEGORIES.some((x) => Number(o[x]) > 0)) return Math.round(Number(o[c]) || 0);
  const keys = allTargets ? Object.keys(allTargets).sort() : [];
  for (let i = keys.length - 1; i >= 0; i--) {
    const t = allTargets[keys[i]];
    if (TX_CATEGORIES.some((x) => Number(t[x]) > 0)) return Math.round(Number(t[c]) || 0);
  }
  return Math.round((fallbackAvg && fallbackAvg[c]) || 0);
}
function buildProportionalPlan(txs, monthKeys, monthlySave, incomeOverride) {
  const income = Math.round(incomeOverride != null ? incomeOverride : (typicalIncome(txs, null) || 0));
  const avg = avgSpendByCategory(txs);
  const totalAvg = TX_CATEGORIES.reduce((s, c) => s + (avg[c] || 0), 0);
  /* monthlySave may be a single number (same every month) or a per-month array that sums to the exact goal */
  const saves = Array.isArray(monthlySave) ? monthlySave : monthKeys.map(() => Math.round(monthlySave));
  const targetTotalSave = saves.reduce((s, v) => s + Math.round(v || 0), 0);
  const out = {};
  const actualNet = {};
  monthKeys.forEach((k, mi) => {
    const spendBudget = Math.max(0, income - Math.round(saves[mi] || 0));
    const month = {};
    let allocated = 0;
    TX_CATEGORIES.forEach((c, i) => {
      let v;
      if (i === TX_CATEGORIES.length - 1) v = Math.max(0, spendBudget - allocated);
      else { v = totalAvg > 0 ? Math.round(spendBudget * ((avg[c] || 0) / totalAvg)) : Math.round(spendBudget / TX_CATEGORIES.length); allocated += v; }
      month[c] = v;
    });
    month["Income"] = income;
    actualNet[k] = income - TX_CATEGORIES.reduce((s, c) => s + month[c], 0);
    out[k] = month;
  });
  /* Force the whole plan to net exactly to the goal: if per-month clamping/rounding lost
     a few pounds, absorb the difference into the last month's most flexible category. */
  const gotTotal = monthKeys.reduce((s, k) => s + actualNet[k], 0);
  const drift = targetTotalSave - gotTotal; // >0 means we under-saved; trim spend to save more
  if (drift !== 0 && monthKeys.length) {
    const lastK = monthKeys[monthKeys.length - 1];
    const flex = FLEX_CATEGORIES.find((c) => (out[lastK][c] || 0) - drift >= 0) || TX_CATEGORIES[TX_CATEGORIES.length - 1];
    out[lastK][flex] = Math.max(0, (out[lastK][flex] || 0) - drift);
  }
  return out;
}
/* Suggest how to trim `perMonth` out of the flexible categories, in proportion to their current targets. */
function flexTrimBreakdown(allTargets, firstFutureKey, perMonth, fallbackAvg) {
  const base = {};
  FLEX_CATEGORIES.forEach((c) => { base[c] = plannedCatFor(allTargets, firstFutureKey, c, fallbackAvg); });
  const total = FLEX_CATEGORIES.reduce((s, c) => s + base[c], 0);
  const trims = {};
  if (total <= 0) return trims;
  const cap = Math.min(perMonth, total);
  let used = 0;
  FLEX_CATEGORIES.forEach((c, i) => {
    let t = i === FLEX_CATEGORIES.length - 1 ? cap - used : Math.round(cap * (base[c] / total));
    t = Math.max(0, Math.min(t, base[c]));
    trims[c] = t; used += t;
  });
  return trims;
}
async function saveMonthTargetsToDb(userId, monthKey, obj) {
  if (!userId) return;
  await supabaseClient.from("targets").delete().eq("user_id", userId).eq("month", monthKey);
  const rows = Object.entries(obj).map(([category, monthly_target]) => ({ user_id: userId, category, month: monthKey, monthly_target: Number(monthly_target) || 0 }));
  if (rows.length) await supabaseClient.from("targets").insert(rows);
}
function parseOverviewLayout(profile) {
  const valid = OVERVIEW_WIDGETS.map((w) => w.key);
  const raw = profile?.overview_layout;
  let arr = Array.isArray(raw) ? raw : (typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch (e) { return null; } })() : null);
  if (!Array.isArray(arr) || arr.length !== 4 || !arr.every((k) => valid.includes(k))) return DEFAULT_OVERVIEW_SLOTS;
  return arr;
}
const DEFAULT_HOME_LAYOUT = { month: ["breakdown_mini", "in_out"], big: ["net_worth", "goal"] };
function parseHomeLayout(profile) {
  const raw = profile?.home_layout;
  let obj = (raw && typeof raw === "object" && !Array.isArray(raw)) ? raw : (typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch (e) { return null; } })() : null);
  if (!obj) return DEFAULT_HOME_LAYOUT;
  const clean = (arr, sec) => Array.isArray(arr) ? arr.filter((k, i) => typeof k === "string" && HOME_WIDGET_KEYS[sec].includes(k) && arr.indexOf(k) === i) : [];
  const month = clean(obj.month, "month"), big = clean(obj.big, "big");
  if (!month.length && !big.length) return DEFAULT_HOME_LAYOUT;
  return { month, big };
}
const HOME_WIDGET_KEYS = {
  month: ["breakdown_mini", "breakdown_wide", "in_out", "category_status", "category_vs_target", "pace_gauge", "pace_full", "pace_outlook", "bills_upcoming", "next_7_days", "spend_by_week", "money_flow", "savings_rate", "category_delta", "merchants_pro", "biggest_movers", "trend_12", "net_saved", "transactions_mini", "merchants", "bills", "bills_checklist", "trend"],
  big: ["net_worth", "net_worth_pro", "goal", "goal_ring", "accounts", "since_last_month", "contribution_bars", "month_end_projection", "money_score"],
};
function parseNavLayout(profile) {
  const valid = VIEWS.map((v) => v.key);
  const raw = profile?.nav_layout;
  let arr = Array.isArray(raw) ? raw : (typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch (e) { return null; } })() : null);
  if (!Array.isArray(arr) || !arr.length || !arr.includes("overview")) return valid;
  /* "targets" was added after early layouts were saved — default it to visible */
  const wantedT = arr.includes("targets") ? arr : [...arr, "targets"];
  const wanted = wantedT.includes("categories") ? wantedT : [...wantedT, "categories"];
  const out = valid.filter((k) => wanted.includes(k));
  return out.includes("overview") ? out : valid;
}
function parseBillRejects(profile) {
  const raw = profile?.bill_rejects;
  let arr = Array.isArray(raw) ? raw : (typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch (e) { return null; } })() : null);
  return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
}
function parseBillExcludes(profile) {
  const raw = profile?.bill_excludes;
  let arr = Array.isArray(raw) ? raw : (typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch (e) { return null; } })() : null);
  return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
}

/* ---------------- shared data ---------------- */

const BANKS = [
  "HSBC", "Barclays", "Emirates NBD", "ADCB", "Dubai Islamic Bank",
  "Mashreq", "First Abu Dhabi Bank", "RAKBANK", "Citibank", "Standard Chartered",
  "JPMorgan Chase", "Bank of America", "Wells Fargo", "Deutsche Bank", "BNP Paribas",
  "Santander", "Revolut", "Monzo", "Wise", "N26",
];
const SAVVY_OPTIONS = [
  { key: "beginner", label: "Just starting out" },
  { key: "intermediate", label: "Getting the hang of it" },
  { key: "confident", label: "Pretty confident" },
];
const TRACKING_OPTIONS = [
  { key: "yes", label: "Yes" }, { key: "no", label: "No" }, { key: "sometimes", label: "Sometimes" },
];
const BALANCE_OPTIONS = [
  { key: "daily", label: "Daily" }, { key: "weekly", label: "Weekly" }, { key: "rarely", label: "Rarely" },
];
const GOALS = [
  "Save more each month", "Pay off debt", "Build an investment portfolio", "Track my spending",
  "Build my credit", "Plan for a big purchase", "Grow my business", "Just stay organised",
];
const ONBOARD_STEPS = 5;
const VIEWS = [
  { key: "overview", label: "Overview" },
  { key: "breakdown", label: "Spending Breakdown" },
  { key: "monthlyreview", label: "Monthly Review" },
  { key: "longterm", label: "Long-Term Plan" },
  { key: "targets", label: "Targets" },
  { key: "transactions", label: "Transactions" },
  { key: "bills", label: "Bills & Subscriptions" },
  { key: "insights", label: "Insights" },
  { key: "categories", label: "Manage Categories" },
  { key: "accounts", label: "Bank Accounts" },
];

const MONTH_LABELS = ["Apr", "May", "Jun"];
const CATEGORY_MONTHLY = {
  Groceries: [380, 410, 420],
  Dining: [220, 245, 260],
  Transport: [150, 165, 180],
  Shopping: [300, 260, 340],
  Subscriptions: [60, 60, 65],
  Bills: [480, 520, 560],
};
const INCOME_MONTHLY = [3100, 3150, 3200];
const CATEGORY_COLORS = {
  Groceries: "#4D9B31", Dining: "#ED8231", Transport: "#2997AE",
  Shopping: "#B851C8", Subscriptions: "#8458D0", Bills: "#266BC5",
  Entertainment: "#D94576",
  Income: "#2FBE7B", Uncategorized: "#98A2B3", Other: "#98A2B3",
};
function demoCategorize(name, amount) {
  /* Use the same full ruleset as real uploads so recognisable merchants never fall through to "Needs review". */
  return categorizeByRules(name, amount);
}

const SAMPLE_BANK_BY_CUR = { GBP: "Sample UK Bank", AED: "Sample UAE Bank", USD: "Sample US Bank", EUR: "Sample EU Bank" };
const DEMO_CSV_GBP = `Date,Description,Amount
2026-05-01,SALARY BRIGHTWAVE LTD,3400.00
2026-05-03,TESCO STORES 2841,-72.40
2026-05-05,TFL TRAVEL CHARGE,-38.60
2026-05-07,BRITISH GAS DD,-96.00
2026-05-09,COSTA COFFEE HOLBORN,-4.85
2026-05-11,NETFLIX.COM,-10.99
2026-05-14,SAINSBURYS SUPERMKT,-58.20
2026-05-17,AMAZON.CO.UK,-64.30
2026-05-20,DELIVEROO LONDON,-27.50
2026-05-23,SHELL PETROL,-70.00
2026-05-26,SPOTIFY UK,-11.99
2026-05-28,PUREGYM LTD,-24.99
2026-06-01,SALARY BRIGHTWAVE LTD,3400.00
2026-06-03,TESCO STORES 2841,-81.10
2026-06-05,TFL TRAVEL CHARGE,-41.20
2026-06-07,BRITISH GAS DD,-96.00
2026-06-10,NETFLIX.COM,-10.99
2026-06-13,SAINSBURYS SUPERMKT,-63.75
2026-06-16,AMAZON.CO.UK,-118.00
2026-06-19,DELIVEROO LONDON,-31.40
2026-06-22,SHELL PETROL,-68.00
2026-06-26,SPOTIFY UK,-11.99
2026-06-28,PUREGYM LTD,-24.99
2026-07-01,SALARY BRIGHTWAVE LTD,3400.00
2026-07-03,TESCO STORES 2841,-69.90
2026-07-04,TFL TRAVEL CHARGE,-22.30
2026-07-05,COSTA COFFEE HOLBORN,-5.40`;
const DEMO_CSV_AED = `Date,Description,Amount
2026-05-01,SALARY ACME LLC,15000.00
2026-05-02,DEWA PAYMENT,-305.00
2026-05-03,CARREFOUR MOE,-452.00
2026-05-05,UBER TRIP HELP.UBER.COM,-68.50
2026-05-08,WAITROSE DUBAI MALL,-318.20
2026-05-10,NETFLIX.COM,-46.00
2026-05-12,COSTA COFFEE JBR,-29.00
2026-05-14,AMAZON.AE ORDER,-540.00
2026-05-15,SPOTIFY AB,-29.99
2026-05-18,TALABAT DUBAI,-122.75
2026-05-20,ENOC PETROL 1044,-340.00
2026-05-28,FITNESS FIRST,-185.00
2026-06-01,SALARY ACME LLC,15000.00
2026-06-02,DEWA PAYMENT,-310.00
2026-06-04,CARREFOUR MOE,-398.60
2026-06-06,UBER TRIP HELP.UBER.COM,-82.00
2026-06-09,SPINNEYS DUBAI,-274.00
2026-06-10,NETFLIX.COM,-46.00
2026-06-12,SHAKE SHACK MOE,-95.00
2026-06-16,NOON.COM ORDER,-810.00
2026-06-19,TALABAT DUBAI,-141.20
2026-06-24,ENOC PETROL 1044,-325.00
2026-06-28,FITNESS FIRST,-185.00
2026-07-01,SALARY ACME LLC,15000.00
2026-07-02,DEWA PAYMENT,-308.00
2026-07-03,CARREFOUR MOE,-289.90
2026-07-04,NETFLIX.COM,-46.00
2026-07-05,STARBUCKS DIFC,-34.20`;
function demoCsvForCurrency(cur) { return cur === "AED" ? DEMO_CSV_AED : DEMO_CSV_GBP; }

const PRIVACY_SECTIONS = [
  { h: "What we collect", b: "Account details (name, email, password), bank statement files you upload, transaction data extracted from them, and any goals/targets you set." },
  { h: "Why we collect it", b: "To categorize your spending, show summaries and trends, and let you log back in to the same data." },
  { h: "How it's protected", b: "Encrypted in transit and at rest. Access to your data is restricted to your account only. We never store your online banking login — only the statement files you upload directly." },
  { h: "Retention", b: "Kept while your account is active. You can request deletion of your account and data at any time." },
  { h: "Sharing", b: "We do not sell your data. Limited service providers (hosting, database, AI processing) may handle data strictly to run the app, under confidentiality." },
  { h: "Your rights", b: "Access, correct, delete, or export your data at any time." },
];
const TERMS_SECTIONS = [
  { h: "What the service does", b: "A tracking and budgeting tool. Not a bank, financial advisor, or regulated financial institution." },
  { h: "Your responsibilities", b: "Provide accurate information, keep your login secure, only upload statements you're authorized to access." },
  { h: "No financial advice", b: "Insights, targets, and categorizations are informational only, not financial, tax, or legal advice." },
  { h: "Accuracy of data", b: "Automated (including AI) extraction and categorization may occasionally be inaccurate. Verify important figures against your actual statements." },
  { h: "Account termination", b: "You may delete your account anytime. We may suspend accounts that misuse the service." },
  { h: "Liability", b: "Provided \"as is.\" We are not liable for financial decisions made based on app data, or losses from data inaccuracies." },
];

