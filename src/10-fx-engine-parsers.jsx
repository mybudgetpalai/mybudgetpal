/* ---------------- Multi-currency (FX) ---------------- */
const CURRENCIES = ["AED", "GBP", "USD", "EUR"];
const CURRENCY_SYMBOLS = { GBP: "£", AED: "AED ", USD: "$", EUR: "€" };
const UAE_BANKS = ["Emirates NBD", "ADCB", "Dubai Islamic Bank", "Mashreq", "First Abu Dhabi Bank", "RAKBANK"];
const CURRENCY_BANKS = {
  GBP: ["HSBC", "Barclays", "Santander", "Monzo", "Revolut", "Wise", "Standard Chartered", "Citibank", "Other"],
  AED: ["Emirates NBD", "ADCB", "Dubai Islamic Bank", "Mashreq", "First Abu Dhabi Bank", "RAKBANK", "HSBC", "Standard Chartered", "Wise", "Other"],
  USD: ["JPMorgan Chase", "Bank of America", "Wells Fargo", "Citibank", "HSBC", "Revolut", "Wise", "Other"],
  EUR: ["Deutsche Bank", "BNP Paribas", "N26", "Santander", "Revolut", "Wise", "Other"],
};
/* UAE-first onboarding: where you live (local currency) + where home is (second currency) */
const LIVE_COUNTRIES = [
  { key: "UAE", cur: "AED", label: "United Arab Emirates", flag: "\uD83C\uDDE6\uD83C\uDDEA" },
  { key: "UK",  cur: "GBP", label: "United Kingdom",        flag: "\uD83C\uDDEC\uD83C\uDDE7" },
  { key: "US",  cur: "USD", label: "United States",         flag: "\uD83C\uDDFA\uD83C\uDDF8" },
  { key: "EU",  cur: "EUR", label: "Europe",                flag: "\uD83C\uDDEA\uD83C\uDDFA" },
];
// Currencies offered to non-UAE ("just want to use the app") users — single-currency mode
const SINGLE_CURRENCIES = [
  { key: "UK", cur: "GBP", label: "British Pound", flag: "\uD83C\uDDEC\uD83C\uDDE7" },
  { key: "US", cur: "USD", label: "US Dollar",     flag: "\uD83C\uDDFA\uD83C\uDDF8" },
  { key: "EU", cur: "EUR", label: "Euro",          flag: "\uD83C\uDDEA\uD83C\uDDFA" },
];
const HOME_COUNTRIES = [
  { key: "UK", cur: "GBP", label: "United Kingdom", flag: "\uD83C\uDDEC\uD83C\uDDE7" },
  { key: "US", cur: "USD", label: "United States",  flag: "\uD83C\uDDFA\uD83C\uDDF8" },
  { key: "EU", cur: "EUR", label: "Europe",         flag: "\uD83C\uDDEA\uD83C\uDDFA" },
];
const countryByKey = (list, k) => list.find((c) => c.key === k) || null;
const FX_FALLBACK = { "GBP>AED": 4.9372, "AED>GBP": 0.202542, "GBP>USD": 1.35, "USD>GBP": 0.7407, "GBP>EUR": 1.17, "EUR>GBP": 0.8547, "USD>AED": 3.6725, "AED>USD": 0.2723, "EUR>AED": 4.22, "AED>EUR": 0.2370, "USD>EUR": 0.8667, "EUR>USD": 1.1538 };
/* Module-level FX state: home currency, per-bank currency, locked monthly rates */
const FX = { ready: false, userId: null, home: "GBP", bankCurrency: {}, rates: {} };
function fxKey(m, f, t) { return m + "|" + f + "|" + t; }
let DEV_NOW = (typeof window !== "undefined" && window.__MP_DEVDATE) || null; // dev-only: override for "today" to test month-end triggers
/* True only inside the desktop "Mobile preview" frame. The host window owns the
   testing chrome, so the framed copy renders as the plain customer experience. */
const MP_PREVIEW = (typeof window !== "undefined") && !!window.__MP_PREVIEW;
const DEV_FLAG = (typeof window !== "undefined") && new URLSearchParams(window.location.search).get("dev") === "1";
function today() { return DEV_NOW ? new Date(DEV_NOW + "T12:00:00") : new Date(); }
function nowMonth() { return today().toISOString().slice(0, 7); }
function txMonthKey(date) { const m = (date || "").slice(0, 7); return /^\d{4}-\d{2}$/.test(m) ? m : nowMonth(); }
function homeSym() { return (CURRENCY_SYMBOLS[FX.home] || "£").trim(); }
function curSym(cur) { return (CURRENCY_SYMBOLS[cur] || CURRENCY_SYMBOLS[FX.home] || "£").trim(); }
function formatMoney2(n) {
  const sign = n < 0 ? "-" : "";
  const sym = CURRENCY_SYMBOLS[FX.home] || "£";
  return sign + sym + Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fxRate(month, from, to) {
  if (from === to) return 1;
  const r = FX.rates[fxKey(month, from, to)];
  if (r) return r;
  const inv = FX.rates[fxKey(month, to, from)];
  if (inv) return 1 / inv;
  return FX_FALLBACK[from + ">" + to] || 1;
}
function fxConvert(amount, from, month) { return amount * fxRate(month || nowMonth(), from, FX.home); }
/* Invertible pair rate for HOME-CURRENCY SWITCHES only. fxRate() may hold two
   independently-fetched rates for the same pair (AED>GBP and GBP>AED) that are
   not exact inverses, so A->B->A drifts. This picks ONE canonical direction per
   pair (alphabetical) and derives the other as its exact reciprocal — a round
   trip multiplies by r * (1/r) and lands back on the same number. */
function fxRateStable(month, from, to) {
  if (from === to) return 1;
  const a = from < to ? from : to, b = from < to ? to : from;
  let canon = FX.rates[fxKey(month, a, b)];
  if (!canon) { const inv = FX.rates[fxKey(month, b, a)]; if (inv) canon = 1 / inv; }
  if (!canon) { canon = FX_FALLBACK[a + ">" + b] || (FX_FALLBACK[b + ">" + a] ? 1 / FX_FALLBACK[b + ">" + a] : 1); }
  return from === a ? canon : 1 / canon;
}
function convStartingBal(r) {
  const amt = Number(r && r.starting_balance) || 0;
  const cur = (FX.bankCurrency && FX.bankCurrency[r.bank_name]) || (r && r.currency) || "GBP";
  if (!amt || cur === FX.home) return amt;
  const m = ((r && r.as_of_date) || "").slice(0, 7) || nowMonth();
  return fxConvert(amt, cur, m);
}
async function initFx(userId, profile, bankRows) {
  FX.userId = userId;
  FX.home = (profile && profile.home_currency) || "GBP";
  FX.bankCurrency = {};
  (bankRows || []).forEach((b) => { FX.bankCurrency[b.bank_name] = b.currency || "GBP"; });
  try {
    const { data } = await supabaseClient.from("fx_rates").select("*").eq("user_id", userId);
    FX.rates = {};
    (data || []).forEach((r) => { FX.rates[fxKey(r.month, r.from_currency, r.to_currency)] = Number(r.rate); });
  } catch (e) { FX.rates = FX.rates || {}; }
  FX.ready = true;
}
/* Locked monthly rates: first time a month needs converting, fetch the live rate once and store it */
async function ensureFxRates(userId, txRows) {
  const needed = {};
  (txRows || []).forEach((t) => {
    const cur = FX.bankCurrency[t.bank] || "GBP";
    if (cur === FX.home) return;
    const m = txMonthKey(t.date);
    if (!FX.rates[fxKey(m, cur, FX.home)]) needed[m + "|" + cur] = { month: m, from: cur };
  });
  const list = Object.values(needed);
  if (!list.length) return;
  const bases = [...new Set(list.map((n) => n.from))];
  const latest = {};
  await Promise.all(bases.map(async (b) => {
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/" + b);
      const j = await res.json();
      if (j && j.rates) latest[b] = j.rates;
    } catch (e) {}
  }));
  const inserts = [];
  list.forEach((n) => {
    const rate = (latest[n.from] && latest[n.from][FX.home]) || FX_FALLBACK[n.from + ">" + FX.home];
    if (!rate) return;
    FX.rates[fxKey(n.month, n.from, FX.home)] = rate;
    inserts.push({ user_id: userId, month: n.month, from_currency: n.from, to_currency: FX.home, rate: rate, source: latest[n.from] ? "api" : "fallback" });
  });
  if (inserts.length) {
    try { await supabaseClient.from("fx_rates").upsert(inserts, { onConflict: "user_id,month,from_currency,to_currency" }); } catch (e) {}
  }
}
/* Keep native amount + currency on every transaction; convert amount into home currency for combined views */
function applyFxToTx(t) {
  const cur = FX.bankCurrency[t.bank] || "GBP";
  const base = t.amountNative !== undefined ? t.amountNative : t.amount;
  return { ...t, currency: cur, amountNative: base, amount: cur === FX.home ? base : base * fxRate(txMonthKey(t.date), cur, FX.home) };
}
function formatMoney(n) {
  const sign = n < 0 ? "-" : "";
  const sym = CURRENCY_SYMBOLS[FX.home] || "£";
  const v = Math.abs(Number(n) || 0);
  /* Whole pounds — pence are noise at a glance. One exception: a real but
     sub-£1 amount must not flatten to "£0" (that's what made phantom "£0 bills"
     look legitimate), so those keep their pence. */
  const dp = (v > 0 && v < 1) ? 2 : 0;
  return sign + sym + v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}
function formatNum(n) {
  const sign = n < 0 ? "-" : "";
  return sign + Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtBalInput(v) {
  if (v === "" || v === null || v === undefined) return "";
  let str = String(v);
  const neg = str.trim().startsWith("-");
  str = str.replace(/-/g, "");
  const parts = str.split(".");
  const intPart = (parts[0] || "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const dec = parts.length > 1 ? "." + parts.slice(1).join("").slice(0, 2) : "";
  return (neg ? "-" : "") + intPart + dec;
}
function formatMoneyNative(n, cur) {
  const sign = n < 0 ? "-" : "";
  const sym = CURRENCY_SYMBOLS[cur] || "£";
  const v = Math.abs(Number(n) || 0);
  const dp = (v > 0 && v < 1) ? 2 : 0;
  return sign + sym + v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}
function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function parseCSVLine(line) {
  const out = [];
  let cur = "", inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) {
      /* B1 fix: a comma sitting between digits as a thousands separator
         (e.g. -1,234.56) must NOT split the field. Applies only outside
         quotes, so quoted fields and comma-in-description are untouched. */
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

/* ---------------- Transaction parsing & categorization engine ---------------- */

const TX_CATEGORIES = ["Groceries", "Dining", "Transport", "Shopping", "Subscriptions", "Bills", "Entertainment"];
const ALL_CATEGORIES = [...TX_CATEGORIES, "Income", "Other", "Uncategorized"];
const CATEGORY_RULES = {
  Groceries: ["waitrose", "carrefour", "spinneys", "lulu", "choithram", "union coop", "west zone", "grandiose", "tesco", "sainsbury", "asda", "aldi", "lidl", "morrisons", "grocery", "supermarket", "hypermarket", "ocado", "iceland food", "co-op", "coop food", "m&s food", "supermkt"],
  Dining: ["restaurant", "cafe", "caffe", "coffee", "costa", "starbucks", "mcdonald", "kfc", "burger", "pizza", "subway", "deliveroo", "talabat", "zomato", "uber eats", "grill", "bakery", "dunkin", "tim hortons", "nando", "shake shack", "five guys", "wagamama", "pret a manger"],
  Transport: ["uber", "careem", "bolt ", "taxi", "rta ", "salik", "nol ", "metro", "parking", "petrol", "fuel", "adnoc", "enoc", "eppco", "shell ", "valet", " tfl", "trainline", "national rail", "oyster", "gwr", "lner", "avanti", "stagecoach", "national express"],
  Shopping: ["amazon", "noon", "namshi", "shein", "zara", "h&m", "ikea", "sharaf dg", "emax", "decathlon", "nike", "adidas", "apple store", "apple.com", "dubai mall", "city centre", "sephora", "primark", "asos"],
  Subscriptions: ["netflix", "spotify", "youtube", "disney", "apple music", "icloud", "prime video", "amazon prime", "openai", "chatgpt", "claude", "anthropic", "adobe", "microsoft 365", "office 365", "patreon", "dropbox", "canva", "subscription"],
  Bills: ["dewa", "sewa", "addc", "etisalat", " du ", "virgin mobile", "rent", "insurance", "takaful", "gym", "fitness first", "emicool", "empower", "chiller", "electricity", "internet", "broadband", "school fee", "tuition", "loan", "mortgage", "water bill", "british gas", "octopus energy", "ovo energy", "edf energy", "e.on", "eon next", "bulb energy", "scottish power", "shell energy", "thames water", "severn trent", "anglian water", "council tax", "tv licence", "tv license", "vodafone", "o2 ", " ee ", "ee limited", "giffgaff", "tesco mobile", "three.co", "hutchison 3g", "sky digital", "virgin media", "bt group", "plusnet", "talktalk"],
  Entertainment: ["cinema", "vue cinema", "odeon", "cineworld", "picturehouse", "everyman cinema", "showcase cinema", "ticketmaster", "eventbrite", "dice.fm", "playstation", "xbox", "nintendo", "steam games", "twitch", "concert", "theatre", "box office"],
};
let CAT_CONFIG = { renames: {}, custom: [] };
const CAT_PALETTE = ["#E8813A", "#8E7BEF", "#3FA7A0", "#D9557B", "#5A8DEE", "#C2893A", "#4CAF7D", "#B0577E"];
function customCats() { return (CAT_CONFIG.custom || []).map((c) => c.name); }
function spendCategories() { return [...TX_CATEGORIES, ...customCats()]; }
function allSpendCategories() { return [...spendCategories(), "Income", "Other", "Uncategorized"]; }
function customCatColor(c) { const f = (CAT_CONFIG.custom || []).find((x) => x.name === c); return f ? f.color : null; }
function customKeywordCategory(desc) {
  const d = " " + String(desc || "").toLowerCase() + " ";
  for (const c of (CAT_CONFIG.custom || [])) {
    if ((c.keywords || []).some((k) => { const kk = String(k || "").toLowerCase().trim(); return kk && d.includes(kk); })) return c.name;
  }
  return null;
}
function parseCategoryConfig(profile) {
  const raw = profile && profile.category_config;
  let o = raw;
  if (typeof raw === "string") { try { o = JSON.parse(raw); } catch (e) { o = null; } }
  const renames = (o && o.renames && typeof o.renames === "object") ? o.renames : {};
  const custom = (o && Array.isArray(o.custom)) ? o.custom
    .filter((c) => c && typeof c.name === "string" && c.name.trim())
    .map((c) => ({ name: c.name.trim(), color: c.color || null, keywords: Array.isArray(c.keywords) ? c.keywords.filter((k) => typeof k === "string") : [] })) : [];
  return { renames, custom };
}
function isTransferDesc(desc) {
  const d = " " + String(desc || "").toLowerCase() + " ";
  return ["bank transfer", "transfer to", "transfer from", "internal transfer", "faster payment", "standing order", " trf ", " xfer ", "to savings", "from savings", "savings transfer", "own account"].some((k) => d.includes(k));
}
function categorizeByRules(desc, amount) {
  const ck = customKeywordCategory(desc);
  if (ck) return ck;
  if (isTransferDesc(desc)) return "Uncategorized";
  const d = " " + String(desc || "").toLowerCase() + " ";
  /* Multi-word keywords win first (e.g. "tesco mobile" -> Bills before "tesco" -> Groceries) */
  for (const cat of TX_CATEGORIES) {
    if (CATEGORY_RULES[cat].some((k) => k.includes(" ") && k.trim().includes(" ") && d.includes(k))) return cat;
  }
  for (const cat of TX_CATEGORIES) {
    if (CATEGORY_RULES[cat].some((k) => d.includes(k))) return cat;
  }
  return amount > 0 ? "Income" : "Uncategorized";
}

const MONTHS_SHORT = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTHS_LABEL = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function pad2(n) { return String(n).padStart(2, "0"); }
function normalizeDate(raw, order) {
  if (!raw) return null;
  const s = String(raw).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return m[1] + "-" + pad2(m[2]) + "-" + pad2(m[3]);
  m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    let a = +m[1], b = +m[2], y = +m[3], d, mo;
    /* B2 fix: honour a file-level date order inferred from unambiguous
       rows (order='mdy' => month first). Default stays day-first (dmy). */
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
function formatTxDate(d) {
  if (!d) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return (+d.slice(8, 10)) + " " + MONTHS_LABEL[+d.slice(5, 7) - 1];
  return d;
}
function monthLabelFromKey(k) { return MONTHS_LABEL[+k.slice(5, 7) - 1]; }
/* ISO yyyy-mm-dd -> "13 Jul" to match the date style used elsewhere in the app. */
function isoToShortDate(s) {
  if (!s) return "";
  const p = String(s).slice(0, 10).split("-");
  if (p.length !== 3) return String(s);
  const mi = +p[1] - 1;
  if (!(mi >= 0 && mi < 12)) return String(s);
  return +p[2] + " " + MONTHS_LABEL[mi] + " " + p[0];
}
function latestMonthKey(txs) {
  let max = "";
  (txs || []).forEach((t) => { if (t.date && t.date.slice(0, 7) > max) max = t.date.slice(0, 7); });
  return max || new Date().toISOString().slice(0, 7);
}
function lastNMonthKeys(endKey, n) {
  let y = +endKey.slice(0, 4), m = +endKey.slice(5, 7);
  const keys = [];
  for (let i = 0; i < n; i++) { keys.unshift(y + "-" + pad2(m)); m--; if (m === 0) { m = 12; y--; } }
  return keys;
}
function spendForMonth(txs, k) { return txs.filter((t) => t.date.slice(0, 7) === k && t.category !== "Income").reduce((s, t) => s - t.amount, 0); }
function incomeForMonth(txs, k) { return txs.filter((t) => t.date.slice(0, 7) === k && t.category === "Income").reduce((s, t) => s + t.amount, 0); }
function spendByCategoryForMonth(txs, k) {
  const o = {};
  txs.filter((t) => t.date.slice(0, 7) === k && t.category !== "Income").forEach((t) => { o[t.category] = (o[t.category] || 0) - t.amount; });
  return o;
}
function spendByCategoryForMonthUpToDay(txs, k, day) {
  const o = {};
  txs.filter((t) => t.date.slice(0, 7) === k && t.category !== "Income" && (+t.date.slice(8, 10)) <= day).forEach((t) => { o[t.category] = (o[t.category] || 0) - t.amount; });
  return o;
}
function catColor(c) { return customCatColor(c) || CATEGORY_COLORS[c] || "#9aa4b8"; }
function displayCat(c) { if (c === "Uncategorized") return "Needs review"; return (CAT_CONFIG.renames && CAT_CONFIG.renames[c]) || c; }
function addMonths(key, n) { let y = +key.slice(0, 4), m = +key.slice(5, 7) + n; while (m > 12) { m -= 12; y++; } while (m < 1) { m += 12; y--; } return y + "-" + pad2(m); }
function avgSpendByCategory(transactions) {
  const out = {};
  const has = transactions && transactions.length > 0;
  const keys = has ? lastNMonthKeys(latestMonthKey(transactions), 3) : [];
  const perMonth = keys.map((k) => spendByCategoryForMonth(transactions, k));
  TX_CATEGORIES.forEach((c) => {
    if (!has) { out[c] = CATEGORY_MONTHLY[c] ? CATEGORY_MONTHLY[c][CATEGORY_MONTHLY[c].length - 1] : 0; return; }
    const vals = perMonth.map((o) => o[c] || 0);
    const nz = vals.filter((v) => v > 0);
    const base = nz.length ? nz.reduce((a, b) => a + b, 0) / nz.length : 0;
    out[c] = Math.round(base);
  });
  return out;
}

/* Deduplication: key = date + description + amount. Handles genuine same-day
   identical transactions by only skipping as many copies as already exist. */
function txKey(t) {
  /* Dedupe on the NATIVE (statement) amount. After FX conversion, t.amount holds the
     home-currency value while a re-uploaded file carries the original — comparing the
     converted figure to the native one made cross-currency duplicates invisible. */
  const amt = t.amountNative !== undefined ? t.amountNative : t.amount;
  return (t.date || "") + "|" + (t.name || "").toLowerCase().replace(/\s+/g, " ").trim() + "|" + (Number(amt) || 0).toFixed(2);
}
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

/* Pacing projection helpers */
function currentMonthKey() {
  const d = today();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}
/* Single source of truth for the month the Overview is scoped to:
   the real calendar month when it has any activity, otherwise the latest
   month that has data. Every "this month" figure on the overview reads this
   so the hero, Where-it's-gone and Spending Breakdown can never disagree. */
function overviewMonthKey(txs) {
  const cur = currentMonthKey();
  const t = txs || [];
  if (spendForMonth(t, cur) > 0 || incomeForMonth(t, cur) > 0) return cur;
  return latestMonthKey(t);
}
function currentMonthName() {
  return today().toLocaleString("en-US", { month: "long" });
}
function completedMonthsWithData(txs) {
  const set = new Set((txs || []).filter((t) => t.date).map((t) => t.date.slice(0, 7)));
  return [...set].filter((k) => k < currentMonthKey()).sort();
}
/* A continuous run of completed months from the first with data to the month before the
   current one. Only for timelines that must not skip columns (the long-term plan grid);
   keep using completedMonthsWithData where "months that actually have data" is meant. */
function completedMonthsContinuous(txs) {
  const keys = completedMonthsWithData(txs);
  if (!keys.length) return keys;
  return monthKeysBetween(keys[0], addMonths(currentMonthKey(), -1));
}
function typicalIncome(txs, uptoKey) {
  const keys = [...new Set((txs || []).filter((t) => t.date).map((t) => t.date.slice(0, 7)))].filter((k) => !uptoKey || k <= uptoKey).sort();
  const vals = keys.map((k) => incomeForMonth(txs, k)).filter((v) => v > 0);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
function totalEstimatedBalance(banks, accountData, txs) {
  const statements = (accountData && accountData.statements) || [];
  const bankRows = (accountData && accountData.bankRows) || [];
  /* Union of the saved bank list and any bank tags present on transactions.
     Demo/sample banks (and any tag mismatch) live only on the transactions,
     so iterating just `banks` dropped their money from the combined balance
     while month nets still counted it — balances went negative. */
  const names = new Set(banks || []);
  (txs || []).forEach((t) => { if (t.bank) names.add(t.bank); });
  let total = 0, any = false;
  names.forEach((b) => {
    const row = bankRows.find((r) => r.bank_name === b);
    const bal = computeBankBalance(b, statements, txs, row);
    if (bal !== null) { const cur = FX.bankCurrency[b] || "GBP"; total += (cur === FX.home ? bal : fxConvert(bal, cur, nowMonth())); any = true; }
  });
  return any ? total : null;
}
function daysInCurrentMonth() {
  const d = today();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}
function projectMonthEnd(spentSoFar) {
  const day = today().getDate();
  if (day <= 0) return spentSoFar;
  return (spentSoFar / day) * daysInCurrentMonth();
}
function monthsUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return null;
  const months = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
  return Math.max(0, months);
}
function topMerchantsFor(txs, k, n) {
  const o = {};
  txs.filter((t) => t.amount < 0 && (!k || t.date.slice(0, 7) === k)).forEach((t) => { o[t.name] = (o[t.name] || 0) + Math.abs(t.amount); });
  return Object.entries(o).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, n);
}
/* Rounding each share independently made the column sum to 99% or 101%.
   Largest-remainder: floor everything, then hand the leftover points to the
   rows with the biggest fractional parts, so the column always totals 100%. */
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
function ordinalDay(n) { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
function remainingBillsThisMonth(txs, excludes) {
  const ex = excludes || [];
  const key = currentMonthKey();
  const todayDay = today().getDate();
  const norm = (n) => String(n || "").toLowerCase().replace(/\d+/g, "").replace(/\s+/g, " ").trim();
  const paidThisMonth = new Set(
    (txs || []).filter((t) => t.amount < 0 && t.date && t.date.slice(0, 7) === key).map((t) => norm(t.name))
  );
  return detectRecurringBills(txs || [])
    .filter((b) => ex.includes(b.name) && b.amount > 0)
    .map((b) => {
      const dueDay = parseInt(b.due, 10) || 0;
      const paid = paidThisMonth.has(norm(b.name));
      return { ...b, dueDay, paid, upcoming: !paid && dueDay >= todayDay };
    });
}
function detectRecurringBills(txs) {
  const groups = {};
  const SKIP_BILL_CATS = ["Dining", "Groceries", "Transport"];
  txs.filter((t) => t.amount < 0 && t.date && !SKIP_BILL_CATS.includes(t.category)).forEach((t) => {
    const key = t.name.toLowerCase().replace(/\d+/g, "").replace(/\s+/g, " ").trim();
    (groups[key] = groups[key] || []).push(t);
  });
  const bills = [];
  Object.values(groups).forEach((list) => {
    const months = new Set(list.map((t) => t.date.slice(0, 7)));
    if (months.size < 2) return;
    /* A real bill is the same amount every month, on roughly the same day, once a
       month. The old test (20% tolerance, floor of 2) passed things that merely
       recur: Amazon at 45.99 vs 62.30 sat inside a 10.83 window, and a 2.00 floor
       let small irregular amounts (cinema tickets) through. All three checks below
       are needed — amount alone still admits a coincidence. */
    if (list.length !== months.size) return;           // more than one hit in a month => not a bill
    const amounts = list.map((t) => Math.abs(t.amount));
    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const steady = amounts.every((a) => Math.abs(a - avg) <= Math.max(avg * 0.05, 0.5));
    if (!steady) return;
    const days = list.map((t) => +t.date.slice(8, 10));
    const dayAvg = days.reduce((a, b) => a + b, 0) / days.length;
    const sameDay = days.every((d) => Math.abs(d - dayAvg) <= 3);
    if (!sameDay) return;
    const due = Math.round(dayAvg);
    bills.push({ name: list[0].name, amount: Math.round(avg * 100) / 100, frequency: "Monthly", due: ordinalDay(due) });
  });
  return bills.sort((a, b) => b.amount - a.amount);
}
function buildInsights(txs, targets) {
  const out = [];
  /* Insights are pinned to the REAL calendar month (Option B, same as the hero).
     They used to read overviewMonthKey, which falls back to the latest month with
     data — so on an empty month you got last month's figures under "this month"
     copy, contradicting the hero right next to them. When the current month has
     no activity we say so instead of reporting stale numbers. */
  const cur = currentMonthKey();
  const prev = lastNMonthKeys(cur, 2)[0];
  const curHasData = spendForMonth(txs, cur) > 0 || incomeForMonth(txs, cur) > 0;
  if (!curHasData) {
    const last = latestMonthKey(txs);
    if (last && last < cur) {
      out.push({ type: "info", kind: "nodata", text: "Nothing recorded for " + monthLabelFromKey(cur) + " yet \u2014 upload your latest statement to see this month's insights." });
    }
    return out;
  }
  /* Comparisons must be like-for-like: a month still in progress is only
     compared against the SAME day-of-month last month, otherwise early in
     the month a partial total vs a full month always reads as a huge drop
     (day 1 => -99%). Completed months compare full vs full as normal. */
  const inProgress = cur === currentMonthKey();
  const dom = today().getDate();
  let curCats, prevCats, enoughData;
  if (inProgress) {
    curCats = spendByCategoryForMonthUpToDay(txs, cur, dom);
    prevCats = spendByCategoryForMonthUpToDay(txs, prev, dom);
    enoughData = dom >= 5;
  } else {
    curCats = spendByCategoryForMonth(txs, cur);
    prevCats = spendByCategoryForMonth(txs, prev);
    enoughData = true;
  }
  if (enoughData) Object.keys(curCats).forEach((c) => {
    const a = curCats[c], b = prevCats[c];
    if (b > 20 && a > 20) {
      const chg = Math.round(((a - b) / b) * 100);
      const delta = formatMoney(Math.abs(a - b));
      const tail = inProgress ? " than by this point last month." : " than last month.";
      if (chg >= 25) out.push({ type: "warning", kind: "catchange", text: displayCat(c) + " is up " + chg + "% — " + delta + " more" + tail });
      else if (chg <= -25) out.push({ type: "positive", kind: "catchange", text: displayCat(c) + " is down " + Math.abs(chg) + "% — " + delta + " less" + tail });
    }
  });
  /* Spend categories only — Income is stored in targets too, and including it inflated the
     budget (e.g. 1620 -> 4120) so projections and % used were both wrong. */
  const totalTarget = spendCategories().reduce((s, c) => s + (Number((targets || {})[c]) || 0), 0);
  const spent = spendForMonth(txs, cur);
  if (totalTarget > 0 && cur === currentMonthKey()) {
    const projected = projectMonthEnd(spent);
    if (projected > totalTarget) out.unshift({ type: "warning", kind: "projection", text: "At this rate you'll spend ~" + formatMoney(projected) + " this month — " + formatMoney(projected - totalTarget) + " over your target." });
    else out.push({ type: "positive", kind: "projection", text: "At this rate you'll finish ~" + formatMoney(totalTarget - projected) + " under your monthly target." });
  }
  if (totalTarget > 0) {
    if (spent <= totalTarget) out.push({ type: "positive", kind: "budget", text: "You've used " + Math.round((spent / totalTarget) * 100) + "% of your monthly target." });
    else out.push({ type: "warning", kind: "budget", text: "You're " + formatMoney(spent - totalTarget) + " over your total monthly target." });
  }
  const top = topMerchantsFor(txs, cur, 1)[0];
  if (top) out.push({ type: "info", kind: "merchant", text: "Your biggest merchant this month is " + titleCaseBill(top.name) + " (" + formatMoney(top.amount) + ")." });

  /* A bill that's past its usual day and hasn't gone out yet. */
  if (inProgress) {
    const norm2 = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const paidSet = new Set(txs.filter((t) => t.amount < 0 && t.date && t.date.slice(0, 7) === cur).map((t) => norm2(t.name)));
    detectRecurringBills(txs).filter((b) => b.amount > 0).forEach((b) => {
      const dd = parseInt(b.due, 10) || 0;
      if (dd > 0 && dd < dom && !paidSet.has(norm2(b.name))) {
        out.push({ type: "warning", kind: "unpaidbill", text: titleCaseBill(b.name) + " (" + formatMoney(b.amount) + ") usually leaves on the " + dd + "th — it hasn't yet this month." });
      }
    });
  }

  /* A place you go back to again and again — count matters more than size here. */
  const visitCount = {};
  const visitSpend = {};
  txs.filter((t) => t.amount < 0 && t.date && t.date.slice(0, 7) === cur && (t.category === "Dining" || t.category === "Groceries")).forEach((t) => {
    const n = titleCaseBill(t.name);
    visitCount[n] = (visitCount[n] || 0) + 1;
    visitSpend[n] = (visitSpend[n] || 0) + Math.abs(t.amount);
  });
  const haunt = Object.keys(visitCount).sort((a, b) => visitCount[b] - visitCount[a])[0];
  if (haunt && visitCount[haunt] >= 3) {
    out.push({ type: "info", kind: "haunt", text: "You've been to " + haunt + " " + visitCount[haunt] + " times this month — " + formatMoney(visitSpend[haunt]) + " in total." });
  }

  /* ---- Always-available reads: no history or repeat visits needed. ---- */
  const monthTx = txs.filter((t) => t.amount < 0 && t.date && t.date.slice(0, 7) === cur);

  /* Weekend vs weekday rate. */
  if (monthTx.length >= 8) {
    let we = 0, wd = 0, weD = new Set(), wdD = new Set();
    monthTx.forEach((t) => {
      const d = new Date(t.date + "T00:00:00");
      const day = d.getDay();
      if (day === 0 || day === 6) { we += Math.abs(t.amount); weD.add(t.date); }
      else { wd += Math.abs(t.amount); wdD.add(t.date); }
    });
    const wePer = weD.size ? we / weD.size : 0;
    const wdPer = wdD.size ? wd / wdD.size : 0;
    if (wePer > 0 && wdPer > 0) {
      const ratio = wePer / wdPer;
      if (ratio >= 1.4) out.push({ type: "info", kind: "weekend", text: "Weekends cost you " + (Math.round(ratio * 10) / 10) + "\u00D7 a weekday — " + formatMoney(wePer) + " vs " + formatMoney(wdPer) + " a day." });
      else if (ratio <= 0.7) out.push({ type: "positive", kind: "weekend", text: "Your weekends are cheap — " + formatMoney(wePer) + " a day vs " + formatMoney(wdPer) + " midweek." });
    }
  }

  /* The single priciest day. */
  if (monthTx.length >= 5) {
    const byDay = {};
    monthTx.forEach((t) => { byDay[t.date] = (byDay[t.date] || 0) + Math.abs(t.amount); });
    const worst = Object.keys(byDay).sort((a, b) => byDay[b] - byDay[a])[0];
    if (worst && byDay[worst] > 0) {
      const n = monthTx.filter((t) => t.date === worst).length;
      const d = new Date(worst + "T00:00:00");
      const lbl = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()] + " " + d.getDate() + " " + monthLabelFromKey(cur);
      out.push({ type: "info", kind: "bigday", text: lbl + " was your priciest day — " + formatMoney(byDay[worst]) + " across " + n + " transaction" + (n === 1 ? "" : "s") + "." });
    }
  }

  /* How concentrated the spend is. */
  const concCats = Object.keys(curCats).filter((c) => curCats[c] > 0).sort((a, b) => curCats[b] - curCats[a]);
  const concTotal = concCats.reduce((s, c) => s + curCats[c], 0);
  if (concCats.length >= 3 && concTotal > 0) {
    const top2 = curCats[concCats[0]] + curCats[concCats[1]];
    const pct = Math.round((top2 / concTotal) * 100);
    if (pct >= 50) out.push({ type: "info", kind: "concentration", text: displayCat(concCats[0]) + " and " + displayCat(concCats[1]) + " are " + pct + "% of everything you spent — " + formatMoney(top2) + "." });
  }

  /* Volume and average. */
  if (monthTx.length >= 10) {
    const tot = monthTx.reduce((s, t) => s + Math.abs(t.amount), 0);
    out.push({ type: "info", kind: "volume", text: monthTx.length + " transactions this month, averaging " + formatMoney(tot / monthTx.length) + " each." });
  }

  /* How much of what came in you actually kept. */
  const inc = incomeForMonth(txs, prev);
  const sp = spendForMonth(txs, prev);
  if (inc > 0 && sp > 0) {
    const kept = Math.round(((inc - sp) / inc) * 100);
    if (kept > 0) out.push({ type: "positive", kind: "savingsrate", text: "In " + monthLabelFromKey(prev) + " you kept " + kept + "% of what came in (" + formatMoney(inc - sp) + ")." });
  }

  /* ---- Deeper reads: things the Overview can't already show you. ---- */
  const all = txs || [];
  const monthsWithData = [...new Set(all.filter((t) => t.date).map((t) => t.date.slice(0, 7)))].sort();
  const prevKey = lastNMonthKeys(cur, 2)[0];

  /* A recurring payment that showed up for the first time this month. */
  const recurring = detectRecurringBills(all).filter((b) => b.amount > 0);
  recurring.forEach((b) => {
    const seen = all.filter((t) => t.amount < 0 && t.name === b.name && t.date).map((t) => t.date.slice(0, 7)).sort();
    const firstSeen = seen[0];
    if (firstSeen === cur && monthsWithData.length > 1 && b.amount >= 3) {
      out.push({ type: "info", kind: "newbill", text: "New regular payment: " + titleCaseBill(b.name) + " at " + formatMoney(b.amount) + " a month. That's " + formatMoney(b.amount * 12) + " a year." });
    }
  });

  /* Something that used to come out every month and has now stopped. */
  if (monthsWithData.length >= 3 && prevKey) {
    recurring.forEach((b) => {
      const inPrev = all.some((t) => t.amount < 0 && t.name === b.name && t.date && t.date.slice(0, 7) === prevKey);
      const inCur = all.some((t) => t.amount < 0 && t.name === b.name && t.date && t.date.slice(0, 7) === cur);
      if (inPrev && !inCur && !inProgress) {
        out.push({ type: "positive", kind: "stoppedbill", text: titleCaseBill(b.name) + " didn't come out this month — cancelled, or worth checking?" });
      }
    });
  }

  /* A recurring cost that has crept up compared with its usual amount. */
  recurring.forEach((b) => {
    const rows = all.filter((t) => t.amount < 0 && t.name === b.name && t.date).sort((x, y) => x.date.localeCompare(y.date));
    if (rows.length < 3) return;
    const latest = Math.abs(rows[rows.length - 1].amount);
    const earlier = rows.slice(0, -1).map((t) => Math.abs(t.amount));
    const avgEarlier = earlier.reduce((s, v) => s + v, 0) / earlier.length;
    if (avgEarlier > 3 && latest > avgEarlier * 1.15) {
      out.push({ type: "warning", kind: "billup", text: titleCaseBill(b.name) + " has gone up — " + formatMoney(latest) + " now vs " + formatMoney(avgEarlier) + " before. That's " + formatMoney((latest - avgEarlier) * 12) + " more a year." });
    }
  });

  /* A single charge far bigger than the usual one for that merchant. */
  const curTxs = all.filter((t) => t.amount < 0 && t.date && t.date.slice(0, 7) === cur);
  curTxs.forEach((t) => {
    const hist = all.filter((x) => x.amount < 0 && x.name === t.name && x.date && x.date.slice(0, 7) !== cur).map((x) => Math.abs(x.amount));
    if (hist.length < 3) return;
    const avg = hist.reduce((s, v) => s + v, 0) / hist.length;
    const amt = Math.abs(t.amount);
    if (avg > 5 && amt > avg * 2 && amt - avg > 20) {
      out.push({ type: "warning", kind: "oneoff", text: "One-off: " + formatMoney(amt) + " at " + titleCaseBill(t.name) + ", about " + Math.round(amt / avg) + "× your usual " + formatMoney(avg) + "." });
    }
  });

  /* Where this month sits against every completed month on record. */
  const completed = monthsWithData.filter((k) => k !== currentMonthKey());
  if (completed.length >= 3) {
    const totals = completed.map((k) => ({ k, v: spendForMonth(all, k) })).filter((x) => x.v > 0);
    if (totals.length >= 3) {
      const sorted = totals.slice().sort((a, b) => a.v - b.v);
      const lowest = sorted[0], highest = sorted[sorted.length - 1];
      if (!inProgress && cur === lowest.k) out.push({ type: "positive", text: "This was your lowest-spending month on record at " + formatMoney(lowest.v) + "." });
      else if (!inProgress && cur === highest.k) out.push({ type: "warning", text: "This was your highest-spending month on record at " + formatMoney(highest.v) + "." });
      else {
        const avgAll = totals.reduce((s, x) => s + x.v, 0) / totals.length;
        out.push({ type: "info", text: "Your average month is " + formatMoney(avgAll) + " — lowest " + formatMoney(lowest.v) + ", highest " + formatMoney(highest.v) + "." });
      }
    }
  }

  /* How much of what came in actually stayed in. */
  if (completed.length >= 1) {
    const lastDone = completed[completed.length - 1];
    const inc = incomeForMonth(all, lastDone), sp = spendForMonth(all, lastDone);
    if (inc > 0 && sp > 0) {
      const rate = Math.round(((inc - sp) / inc) * 100);
      const label = monthLabelFromKey(lastDone);
      if (rate > 0) out.push({ type: rate >= 20 ? "positive" : "info", text: "In " + label + " you kept " + rate + "% of what came in (" + formatMoney(inc - sp) + " of " + formatMoney(inc) + ")." });
      else out.push({ type: "warning", text: "In " + label + " you spent " + formatMoney(sp - inc) + " more than came in." });
    }
  }

  /* What the recurring commitments actually cost over a year. */
  const recTotal = recurring.reduce((s, b) => s + b.amount, 0);
  if (recTotal > 0 && recurring.length >= 2) {
    out.push({ type: "info", kind: "billload", text: "Your " + recurring.length + " regular payments come to " + formatMoney(recTotal) + " a month — " + formatMoney(recTotal * 12) + " a year." });
  }

  /* Dedupe by text, then cap. The page can carry more than the Overview card. */
  const seenText = new Set();
  return out.filter((o) => (seenText.has(o.text) ? false : (seenText.add(o.text), true))).slice(0, 12);
}

function inferDateOrder(values) {
  /* Decide DD/MM vs MM/DD for a whole file from any unambiguous row
     (a part > 12 can only be the day). Returns "dmy", "mdy" or null. */
  for (const v of (values || [])) {
    const m = String(v || "").trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (!m) continue;
    const a = +m[1], b = +m[2];
    if (a > 12 && b <= 12) return "dmy";
    if (b > 12 && a <= 12) return "mdy";
  }
  return null;
}
function parseStatementCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error("empty");
  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
  const dateIdx = header.findIndex((h) => h.includes("date"));
  const descIdx = header.findIndex((h) => h.includes("desc") || h.includes("narrat") || h.includes("detail") || h.includes("particular") || h.includes("name") || h.includes("merchant") || h.includes("reference"));
  const catIdx = header.findIndex((h) => h.includes("categ"));
  const amtIdx = header.findIndex((h) => h.includes("amount") || h === "value");
  const debitIdx = header.findIndex((h) => h.includes("debit") || h.includes("money out") || h.includes("withdraw") || h.includes("paid out"));
  const creditIdx = header.findIndex((h) => h.includes("credit") || h.includes("money in") || h.includes("deposit") || h.includes("paid in"));
  if (dateIdx === -1 || descIdx === -1 || (amtIdx === -1 && debitIdx === -1 && creditIdx === -1)) throw new Error("headers");
  const balIdx = header.findIndex((h) => h.includes("balance"));
  const num = (v) => { const n = Number(String(v || "").replace(/[^0-9.\-]/g, "")); return isNaN(n) ? 0 : n; };

  const dateOrder = inferDateOrder(lines.slice(1).map((line) => parseCSVLine(line)[dateIdx]));
  const rows = lines.slice(1).map((line) => {
    const cols = parseCSVLine(line);
    let amount = 0;
    if (amtIdx !== -1 && cols[amtIdx]) amount = num(cols[amtIdx]);
    else {
      const dr = debitIdx !== -1 ? Math.abs(num(cols[debitIdx])) : 0;
      const cr = creditIdx !== -1 ? Math.abs(num(cols[creditIdx])) : 0;
      amount = cr - dr;
    }
    const name = (cols[descIdx] || "").trim();
    return {
      date: normalizeDate(cols[dateIdx], dateOrder) || "",
      name,
      category: categorizeByRules(name, amount), /* TS2 fix: always categorise via app rules; ignore any category column in the CSV */
      amount,
      _bal: balIdx !== -1 && cols[balIdx] !== undefined && String(cols[balIdx]).trim() !== "" ? num(cols[balIdx]) : null,
    };
  }).filter((t) => t.name && t.amount !== 0);

  /* Detect opening/closing from a running-balance column, if the CSV has one */
  const meta = { opening: null, closing: null, periodStart: null, periodEnd: null };
  const dated = rows.filter((r) => r.date && r._bal !== null);
  if (dated.length >= 2) {
    const sorted = [...dated].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0], last = sorted[sorted.length - 1];
    meta.opening = Math.round((first._bal - first.amount) * 100) / 100;
    meta.closing = last._bal;
  }
  rows.forEach((r) => { delete r._bal; });
  return { transactions: rows, meta };
}

/* PDF text extraction (pdf.js, loaded on demand) */
let pdfjsPromise = null;
function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (!pdfjsPromise) {
    pdfjsPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      s.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      };
      s.onerror = () => reject(new Error("Couldn't load PDF reader"));
      document.head.appendChild(s);
    });
  }
  return pdfjsPromise;
}
async function extractPdfText(file) {
  const pdfjs = await loadPdfJs();
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let text = "";
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    text += content.items.map((i) => i.str).join(" ") + "\n";
  }
  return text;
}

/* AI helpers via Supabase Edge Function "ai-statement" */
async function aiParseStatementText(text) {
  const { data, error } = await supabaseClient.functions.invoke("ai-statement", {
    body: { action: "parse", text: String(text).slice(0, 150000) },
  });
  if (error || !data || !Array.isArray(data.transactions)) {
    const raw = (data && data.error) || (error && error.message) || "";
    throw new Error(!raw || /non-2xx|Failed to send|fetch|network/i.test(raw) ? "The AI reader couldn't process this statement right now — try again in a minute, or upload a CSV export." : raw);
  }
  const txs = data.transactions.map((t) => {
    const amount = Number(t.amount) || 0;
    const name = String(t.description || "").trim();
    return { date: normalizeDate(t.date) || "", name, amount, category: categorizeByRules(name, amount) };
  }).filter((t) => t.name && t.amount !== 0);
  const numOrNull = (v) => { const n = Number(v); return v === null || v === undefined || v === "" || isNaN(n) ? null : n; };
  return {
    transactions: txs,
    meta: {
      opening: numOrNull(data.opening_balance),
      closing: numOrNull(data.closing_balance),
      periodStart: normalizeDate(data.period_start) || null,
      periodEnd: normalizeDate(data.period_end) || null,
    },
  };
}
async function aiCategorize(descriptions) {
  const { data, error } = await supabaseClient.functions.invoke("ai-statement", {
    body: { action: "categorize", items: descriptions },
  });
  if (error || !data || !data.categories) throw new Error((error && error.message) || (data && data.error) || "AI categorization unavailable");
  return data.categories;
}
function buildTxDigest(transactions) {
  const txs = (transactions || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 1200);
  const lines = txs.map((t) => (t.date || "") + "|" + (t.name || "") + "|" + (t.amount < 0 ? "-" : "+") + Math.abs(Number(t.amount) || 0).toFixed(2) + "|" + (t.category || "Uncategorized"));
  /* Ground the model in the app's OWN totals. Previously we shipped raw lines and asked the
     model to "do the arithmetic carefully" over up to 1200 rows — its sums drifted from what
     the dashboard showed, so Ask and the rest of the app disagreed. These are the same helpers
     the UI renders from, so a quoted figure always ties out. */
  const dated = txs.filter((t) => t.date);
  const monthKeys = [...new Set(dated.map((t) => t.date.slice(0, 7)))].sort().reverse().slice(0, 24);
  const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const months = monthKeys.map((k) => {
    const cats = spendByCategoryForMonth(dated, k);
    const byCat = {};
    Object.keys(cats).forEach((c) => { if (cats[c] > 0) byCat[c] = r2(cats[c]); });
    return { month: k, income: r2(incomeForMonth(dated, k)), spend: r2(spendForMonth(dated, k)), net: r2(incomeForMonth(dated, k) - spendForMonth(dated, k)), by_category: byCat };
  });
  const merchants = {};
  dated.filter((t) => t.category !== "Income" && t.amount < 0).forEach((t) => {
    const n = t.name || "(unknown)";
    merchants[n] = r2((merchants[n] || 0) + Math.abs(Number(t.amount) || 0));
  });
  const topMerchants = Object.entries(merchants).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([name, total]) => ({ name, total }));
  /* Per-month totals alone left every cross-month question ("how much do subscriptions
     cost me?") to the model's own arithmetic, which is exactly what grounding was meant
     to remove. Ship the all-months rollup too, so the span the user asked about already
     has an authoritative figure. */
  const allCats = {};
  months.forEach((m) => Object.keys(m.by_category).forEach((c) => { allCats[c] = r2((allCats[c] || 0) + m.by_category[c]); }));
  const monthsCovered = months.length;
  const allTime = {
    months_covered: monthsCovered,
    period: monthsCovered ? { from: monthKeys[monthKeys.length - 1], to: monthKeys[0] } : null,
    income: r2(months.reduce((s, m) => s + m.income, 0)),
    spend: r2(months.reduce((s, m) => s + m.spend, 0)),
    by_category: allCats,
    by_category_monthly_average: Object.fromEntries(Object.keys(allCats).map((c) => [c, r2(allCats[c] / (monthsCovered || 1))])),
  };
  return { home: FX.home, count: txs.length, today: today().toISOString().slice(0, 10), current_month: currentMonthKey(), totals: { months, all_time: allTime, top_merchants: topMerchants }, transactions: lines };
}
async function aiAskInsights(question, transactions) {
  const { data, error } = await supabaseClient.functions.invoke("ai-statement", {
    body: { action: "ask", question: String(question).slice(0, 500), data: buildTxDigest(transactions) },
  });
  if (error || !data || !data.answer) throw new Error((error && error.message) || (data && data.error) || "Couldn\u2019t get an answer just now — please try again.");
  return data.answer;
}

/* One entry point: file -> { transactions, meta } */
async function parseStatementFile(file) {
  const lower = file.name.toLowerCase();
  let result;
  if (lower.endsWith(".csv")) result = parseStatementCSV(await file.text());
  else if (lower.endsWith(".pdf")) {
    let text;
    try { text = await extractPdfText(file); }
    catch (e) {
      const m = String((e && e.message) || "");
      if (/password/i.test(m)) throw new Error("This PDF is password-protected — remove the password and try again.");
      throw new Error("Couldn't read this PDF — it may be damaged or non-standard. Try re-downloading it, or use a CSV export.");
    }
    if (!text.trim()) throw new Error("This PDF has no readable text (it may be a scanned image) — try a CSV export instead.");
    result = await aiParseStatementText(text);
  } else throw new Error("Only PDF or CSV files are supported.");
  const meta = result.meta || { opening: null, closing: null, periodStart: null, periodEnd: null };
  const dates = result.transactions.map((t) => t.date).filter(Boolean).sort();
  if (!meta.periodStart && dates.length) meta.periodStart = dates[0];
  if (!meta.periodEnd && dates.length) meta.periodEnd = dates[dates.length - 1];
  return { transactions: result.transactions, meta };
}

/* Supabase persistence for transactions */
function rowToTx(r) { return { id: r.id, date: r.tx_date || "", name: r.description, amount: Number(r.amount), category: r.category || "Uncategorized", bank: r.bank_name }; }
async function fetchTransactions(userId) {
  const { data, error } = await supabaseClient.from("transactions").select("*").eq("user_id", userId).order("tx_date", { ascending: false });
  if (error) return [];
  const raw = (data || []).map(rowToTx);
  const fxStale = raw.some((t) => t.bank && FX.bankCurrency[t.bank] === undefined);
  if (!FX.ready || FX.userId !== userId || fxStale) {
    const [p, b] = await Promise.all([fetchProfile(userId), fetchBanks(userId)]);
    await initFx(userId, p, b);
  }
  await ensureFxRates(userId, raw);
  return raw.map(applyFxToTx);
}
async function saveTransactionsToDb(userId, bankName, txs, statementId) {
  if (!userId || !txs.length) return txs;
  const rows = txs.map((t) => ({
    user_id: userId, bank_name: bankName || t.bank || null,
    tx_date: t.date || null, description: t.name, amount: t.amount, category: t.category,
    statement_id: statementId || null,
  }));
  const { data, error } = await supabaseClient.from("transactions").insert(rows).select();
  if (error) throw error;
  const mapped = (data || []).map(rowToTx);
  if (FX.ready) { await ensureFxRates(userId, mapped); return mapped.map(applyFxToTx); }
  return mapped;
}
async function updateTransactionCategoriesInDb(idToCat) {
  await Promise.all(Object.entries(idToCat).map(([id, category]) =>
    supabaseClient.from("transactions").update({ category }).eq("id", id)
  ));
}

/* ---------------- Statements: persistence + reconciliation ---------------- */

function rowToStmt(r) {
  return {
    id: r.id, bank: r.bank_name, fileName: r.file_name || "",
    periodStart: r.period_start || null, periodEnd: r.period_end || null,
    opening: r.opening_balance === null ? null : Number(r.opening_balance),
    closing: r.closing_balance === null ? null : Number(r.closing_balance),
    computed: r.computed_closing === null ? null : Number(r.computed_closing),
    difference: r.difference === null ? null : Number(r.difference),
    status: r.status || "unverified",
  };
}
async function fetchStatements(userId) {
  const { data, error } = await supabaseClient.from("statements").select("*").eq("user_id", userId).order("period_start", { ascending: true });
  if (error) return [];
  return (data || []).map(rowToStmt);
}
async function saveStatementToDb(userId, s) {
  /* Re-uploading the same period for the same bank updates the existing row instead of duplicating it */
  if (s.periodStart && s.periodEnd) {
    const { data: existing } = await supabaseClient.from("statements").select("*")
      .eq("user_id", userId).eq("bank_name", s.bank)
      .eq("period_start", s.periodStart).eq("period_end", s.periodEnd).limit(1);
    if (existing && existing.length) {
      const upd = {};
      if (s.opening !== null && s.opening !== undefined) upd.opening_balance = s.opening;
      if (s.closing !== null && s.closing !== undefined) upd.closing_balance = s.closing;
      if (s.fileName) upd.file_name = s.fileName;
      if (Object.keys(upd).length) {
        const { data: updated } = await supabaseClient.from("statements").update(upd).eq("id", existing[0].id).select().single();
        return rowToStmt(updated || existing[0]);
      }
      return rowToStmt(existing[0]);
    }
  }
  const { data, error } = await supabaseClient.from("statements").insert({
    user_id: userId, bank_name: s.bank, file_name: s.fileName || null,
    period_start: s.periodStart || null, period_end: s.periodEnd || null,
    opening_balance: s.opening, closing_balance: s.closing,
    computed_closing: null, difference: null, status: "unverified",
  }).select().single();
  if (error) throw error;
  return rowToStmt(data);
}

/* ---------------- Shared statement-import unit ----------------
   The single place both import paths (NCJ UploadScreen + dashboard
   handleAddTransactions) run their common steps: apply the user's manual
   category overrides, dedupe against what's already there, persist the
   statement metadata row, and optionally archive the raw file to storage.
   Transaction saving stays with each caller (NCJ batches at the end,
   dashboard saves per import) so failure behaviour is unchanged. */
async function importStatementUnit({ userId, bank, txs, meta, fileName, rawFile, existing, overrideMap, stmtErrorMsg, pushToast }) {
  if (overrideMap) txs.forEach((t) => { const o = overrideMap[t.name]; if (o && o !== "Uncategorized") t.category = o; });
  const { kept, skipped } = dedupeTransactions(txs, existing || []);
  let stmtRow = null;
  if (bank && meta) {
    try {
      stmtRow = await saveStatementToDb(userId, {
        bank, fileName: fileName || null,
        periodStart: meta.periodStart, periodEnd: meta.periodEnd,
        opening: meta.opening, closing: meta.closing,
      });
    } catch (e) { if (stmtErrorMsg && pushToast) pushToast(stmtErrorMsg, "error"); }
  }
  if (rawFile && bank && userId) {
    try {
      const path = userId + "/" + bank + "/" + Date.now() + "_" + (fileName || rawFile.name);
      await supabaseClient.storage.from("statements").upload(path, rawFile);
    } catch (e) {}
  }
  return { kept, skipped, stmtRow };
}
function importToast(imported, skipped) {
  return imported + " transaction" + (imported !== 1 ? "s" : "") + " imported" + (skipped > 0 ? " · " + skipped + " duplicate" + (skipped !== 1 ? "s" : "") + " skipped" : "");
}

/*
 * Reconciliation: for every statement of a bank, computed closing =
 * opening + sum of ALL stored transactions for that bank inside the period.
 * Re-run after every upload, so a later "longer period" upload that fills a
 * gap automatically flips an old mismatch to reconciled.
 * Also chains statements: previous closing should equal next opening.
 */
function reconcileStatements(statements, transactions) {
  const results = [];
  statements.forEach((s) => {
    if (s.opening === null || s.closing === null || !s.periodStart || !s.periodEnd) {
      results.push({ ...s, computed: null, difference: null, status: "unverified" });
      return;
    }
    const sum = transactions
      .filter((t) => t.bank === s.bank && t.date && t.date >= s.periodStart && t.date <= s.periodEnd)
      .reduce((a, t) => a + (t.amountNative !== undefined ? t.amountNative : t.amount), 0);
    const computed = Math.round((s.opening + sum) * 100) / 100;
    const difference = Math.round((s.closing - computed) * 100) / 100;
    results.push({ ...s, computed, difference, status: Math.abs(difference) <= 0.01 ? "reconciled" : "mismatch" });
  });
  return results;
}
function chainIssues(statements) {
  const byBank = {};
  statements.forEach((s) => { (byBank[s.bank] = byBank[s.bank] || []).push(s); });
  const issues = [];
  Object.entries(byBank).forEach(([bank, list]) => {
    const sorted = [...list].filter((s) => s.periodStart).sort((a, b) => a.periodStart.localeCompare(b.periodStart));
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1], cur = sorted[i];
      if (prev.periodEnd && cur.periodStart) {
        const gapDays = (new Date(cur.periodStart) - new Date(prev.periodEnd)) / 86400000;
        if (gapDays > 3) issues.push({ bank, type: "gap", text: "Possible missing statement between " + prev.periodEnd + " and " + cur.periodStart });
      }
      const overlaps = prev.periodEnd && cur.periodStart && cur.periodStart <= prev.periodEnd;
      if (!overlaps && prev.closing !== null && cur.opening !== null && Math.abs(prev.closing - cur.opening) > 0.01) {
        issues.push({ bank, type: "chain", text: "Closing balance (" + formatMoneyNative(prev.closing, FX.bankCurrency[bank] || "GBP") + ") doesn't match next opening (" + formatMoneyNative(cur.opening, FX.bankCurrency[bank] || "GBP") + ")" });
      }
    }
  });
  return issues;
}
async function persistReconciliation(oldStatements, newStatements) {
  const oldById = Object.fromEntries(oldStatements.map((s) => [s.id, s]));
  await Promise.all(newStatements.map((s) => {
    const o = oldById[s.id];
    if (o && o.status === s.status && o.computed === s.computed && o.difference === s.difference) return Promise.resolve();
    return supabaseClient.from("statements").update({ computed_closing: s.computed, difference: s.difference, status: s.status }).eq("id", s.id);
  }));
}

/* Current balance per bank: anchor on the latest statement closing balance,
   then roll forward any transactions dated after that statement. Falls back
   to the onboarding starting balance if no statement has balances yet. */
function computeBankBalance(bank, statements, transactions, bankRow) {
  const withClosing = statements.filter((s) => s.bank === bank && s.closing !== null && s.periodEnd).sort((a, b) => a.periodEnd.localeCompare(b.periodEnd));
  if (withClosing.length) {
    const anchor = withClosing[withClosing.length - 1];
    const after = transactions.filter((t) => t.bank === bank && t.date && t.date > anchor.periodEnd).reduce((a, t) => a + (t.amountNative !== undefined ? t.amountNative : t.amount), 0);
    return Math.round((anchor.closing + after) * 100) / 100;
  }
  if (bankRow && bankRow.starting_balance !== null && bankRow.starting_balance !== undefined) {
    const from = bankRow.as_of_date || "";
    const after = transactions.filter((t) => t.bank === bank && t.date && t.date >= from).reduce((a, t) => a + (t.amountNative !== undefined ? t.amountNative : t.amount), 0);
    return Math.round((Number(bankRow.starting_balance) + after) * 100) / 100;
  }
  /* No statement close and no starting balance to anchor on. Rather than dropping
     the bank entirely (which made combined balances understate reality and could
     even go negative), assume it opened at 0 across the data we have and use the
     net of its transactions — the same lenient basis the summary screen uses. */
  const bankTx = transactions.filter((t) => t.bank === bank && t.date);
  if (bankTx.length) {
    const net = bankTx.reduce((a, t) => a + (t.amountNative !== undefined ? t.amountNative : t.amount), 0);
    return Math.round(net * 100) / 100;
  }
  return null;
}

/* ---------------- Landing: immersive how-it-works demos ---------------- */

function LpUploadDemo() {
  return (
    <div className="lp-demo-card lpd-upload">
      <div className="lpd-file lpd-file-1">
        <div className="lpd-file-icon">&#128196;</div>
        <div className="lpd-file-meta">
          <div className="lpd-file-name">enbd_statement.pdf</div>
          <div className="lpd-file-bank">&#127462;&#127466; Emirates NBD &middot; AED</div>
        </div>
      </div>
      <div className="lpd-file lpd-file-2">
        <div className="lpd-file-icon">&#128196;</div>
        <div className="lpd-file-meta">
          <div className="lpd-file-name">hsbc_statement.csv</div>
          <div className="lpd-file-bank">&#127468;&#127463; HSBC &middot; GBP</div>
        </div>
      </div>
      <div className="lpd-zone">
        <div className="lpd-zone-inner">
          <span className="lpd-zone-hint">Drop statements from both banks here</span>
          <div className="lpd-progress"><div className="lpd-progress-fill" /></div>
          <div className="lpd-done">&#10003; 2 banks &middot; 58 transactions found</div>
        </div>
      </div>
    </div>
  );
}

const LP_DEMO_TXS = [
  { name: "WAITROSE DUBAI MALL", amount: "-\u00a380", cat: "Groceries" },
  { name: "NETFLIX.COM", amount: "-\u00a313", cat: "Subscriptions" },
  { name: "UBER TRIP HELP.UBER.COM", amount: "-\u00a315", cat: "Transport" },
  { name: "DEWA PAYMENT", amount: "-\u00a3308", cat: "Bills" },
  { name: "ZUMA DUBAI", amount: "-\u00a3145", cat: "Dining" },
];

function LpCategoriseDemo() {
  return (
    <div className="lp-demo-card lpd-cat">
      {LP_DEMO_TXS.map((t, i) => (
        <div className="lpd-tx" style={{ animationDelay: (0.25 + i * 0.55) + "s" }} key={t.name}>
          <div className="lpd-tx-left">
            <span className="lpd-tx-name">{t.name}</span>
            <span className="lpd-tx-amt">{t.amount}</span>
          </div>
          <span className="lpd-chip" style={{ background: catColor(t.cat) + "33", color: catColor(t.cat), animationDelay: (0.55 + i * 0.55) + "s" }}>
            <span className="cat-dot" style={{ background: catColor(t.cat) }} />{t.cat}
          </span>
        </div>
      ))}
      <div className="lpd-ai-note" style={{ animationDelay: (0.7 + LP_DEMO_TXS.length * 0.55) + "s" }}><Icon name="tag" size={13} /> Sorted automatically {"\u2014"} fix any of them once, and it remembers.</div>
    </div>
  );
}

function LpAskDemo() {
  const [stage, setStage] = useState(0); // 0 idle, 1 question, 2 typing, 3 answer
  useEffect(() => {
    const seq = [
      setTimeout(() => setStage(1), 500),
      setTimeout(() => setStage(2), 1100),
      setTimeout(() => setStage(3), 2100),
    ];
    return () => seq.forEach(clearTimeout);
  }, []);
  return (
    <div className="lp-demo-card lpd-ask">
      <div className="lpd-ask-thread">
        {stage >= 1 && (
          <div className="lpd-ask-q">How much did I spend on coffee last month?</div>
        )}
        {stage === 2 && (
          <div className="lpd-ask-row">
            <span className="lpd-ask-av"><Icon name="sparkles" size={13} /></span>
            <div className="lpd-ask-typing"><span /><span /><span /></div>
          </div>
        )}
        {stage >= 3 && (
          <div className="lpd-ask-row">
            <span className="lpd-ask-av"><Icon name="sparkles" size={13} /></span>
            <div className="lpd-ask-a">
              <p>You spent <strong>&pound;68.40</strong> on coffee across <strong>19 visits</strong> in June &mdash; mostly <strong>Starbucks</strong> and <strong>&#37; Arabica</strong>.</p>
              <div className="lpd-ask-chips">
                <span className="lpd-ask-chip up">&uarr; &pound;12 vs May</span>
                <span className="lpd-ask-chip">19 visits</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="lpd-ask-bar"><span>Ask about your money&hellip;</span><span className="lpd-ask-send">&uarr;</span></div>
    </div>
  );
}

function LpViewsDemo() {
  const [tab, setTab] = useState("breakdown");
  const tabs = [
    { key: "breakdown", label: "Breakdown" },
    { key: "trends", label: "Trends" },
    { key: "goals", label: "Goals" },
  ];
  const bars = [
    { name: "Bills", val: 355, pct: 100, cat: "Bills" },
    { name: "Shopping", val: 265, pct: 75, cat: "Shopping" },
    { name: "Groceries", val: 190, pct: 54, cat: "Groceries" },
    { name: "Dining", val: 99, pct: 28, cat: "Dining" },
  ];
  const bdTotal = bars.reduce((s, b) => s + b.val, 0);
  const bdMax = Math.max(...bars.map((b) => b.val));
  // Donut segments (each category's share of the total), drawn as stroke-dasharray on a 100-length circle.
  let acc = 0;
  const bdSlices = bars.map((b) => { const len = (b.val / bdTotal) * 100; const seg = { len, off: -acc, color: catColor(b.cat) }; acc += len; return seg; });
  const trendData = [
    { m: "Jan", v: 1240 }, { m: "Feb", v: 960 }, { m: "Mar", v: 1420 },
    { m: "Apr", v: 1100 }, { m: "May", v: 1600 }, { m: "Jun", v: 860 },
  ];
  const trMax = Math.max(...trendData.map((d) => d.v));
  const goals = [
    { icon: "\uD83C\uDFDD\uFE0F", name: "Holiday fund", have: 2400, target: 4000, pct: 60, color: "#2FBE7B", note: <React.Fragment>on pace for <b>November</b></React.Fragment> },
    { icon: "\uD83D\uDEE1\uFE0F", name: "Emergency fund", have: 4200, target: 10000, pct: 42, color: "var(--accent)", note: <React.Fragment>&pound;300/month &rarr; done by <b>next summer</b></React.Fragment> },
  ];
  return (
    <div className="lp-demo-card lpd-views lpd-views2">
      <div className="lpd-tabs">
        {tabs.map((t) => (
          <button key={t.key} className={"lpd-tab" + (tab === t.key ? " lpd-tab-active" : "")} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>
      {tab === "breakdown" && (
        <div className="lpd-pane">
          <div className="lpd2-bd">
            <div className="lpd2-donut">
              <svg viewBox="0 0 42 42">
                <circle className="lpd2-donut-bg" cx="21" cy="21" r="15.915" fill="none" strokeWidth="6" />
                {bdSlices.map((s, i) => (
                  <circle key={i} cx="21" cy="21" r="15.915" fill="none" stroke={s.color} strokeWidth="6"
                    strokeDasharray={s.len.toFixed(2) + " " + (100 - s.len).toFixed(2)} strokeDashoffset={s.off.toFixed(2)}
                    transform="rotate(-90 21 21)" />
                ))}
              </svg>
              <div className="lpd2-donut-mid"><span className="lpd2-donut-t">Spent</span><span className="lpd2-donut-v">&pound;{bdTotal}</span></div>
            </div>
            <div className="lpd2-legend">
              {bars.map((b) => (
                <div className="lpd2-lg" key={b.name}>
                  <span className="lpd2-lg-nm"><span className="cat-dot" style={{ background: catColor(b.cat) }} />{b.name}</span>
                  <span className="lpd2-lg-amt">&pound;{b.val}</span>
                  <span className="lpd2-lg-track"><i style={{ width: Math.round((b.val / bdMax) * 100) + "%", background: catColor(b.cat) }} /></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {tab === "trends" && (
        <div className="lpd-pane">
          <div className="lpd2-trend">
            <div className="lpd2-tgrid"><span>&pound;2k</span><span>&pound;1.5k</span><span>&pound;1k</span><span>&pound;0.5k</span><span>&pound;0</span></div>
            <div className="lpd2-tbars">
              {trendData.map((d) => (
                <div className="lpd2-tcol" key={d.m}>
                  <span className="lpd2-tval">&pound;{d.v.toLocaleString("en-GB")}</span>
                  <div className={"lpd2-tbar" + (d.v === trMax ? " hi" : "")} style={{ height: Math.round((d.v / 2000) * 100) + "%" }} />
                </div>
              ))}
            </div>
            <div className="lpd2-tmonths">
              {trendData.map((d) => (<span key={d.m}>{d.m}</span>))}
            </div>
          </div>
        </div>
      )}
      {tab === "goals" && (
        <div className="lpd-pane">
          {goals.map((g) => (
            <div className="lpd2-goal" key={g.name}>
              <div className="lpd2-ring">
                <svg viewBox="0 0 42 42">
                  <circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--surface-3)" strokeWidth="5" />
                  <circle cx="21" cy="21" r="15.915" fill="none" stroke={g.color} strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={g.pct + " " + (100 - g.pct)} transform="rotate(-90 21 21)" />
                </svg>
                <span className="lpd2-ring-p" style={{ color: g.color }}>{g.pct}%</span>
              </div>
              <div className="lpd2-gmeta">
                <div className="lpd2-gtop"><span className="lpd2-gname">{g.icon} {g.name}</span><span className="lpd2-gamt">&pound;{g.have.toLocaleString("en-GB")} / &pound;{g.target.toLocaleString("en-GB")}</span></div>
                <div className="lpd2-gnote">{g.note}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="lpd-views-hint">&#128070; Tap the tabs &mdash; this is a taste of the real dashboard.</div>
    </div>
  );
}

function LpCurrencyDemo() {
  const [home, setHome] = useState("GBP");
  const SYM = { GBP: "\u00a3", AED: "AED\u00a0" };
  const RATE = { "GBP>AED": 4.65, "AED>GBP": 0.215 };
  const conv = (n, from) => from === home ? n : Math.round(n * RATE[from + ">" + home]);
  const fmt = (n, cur) => (n < 0 ? "-" : "") + SYM[cur] + Math.abs(Math.round(n)).toLocaleString("en-GB");
  const txs = [
    { name: "SALARY · BRIGHTWAVE", bank: "HSBC", flag: "\uD83C\uDDEC\uD83C\uDDE7", cur: "GBP", native: 3400 },
    { name: "TESCO EXPRESS", bank: "HSBC", flag: "\uD83C\uDDEC\uD83C\uDDE7", cur: "GBP", native: -72 },
    { name: "CARREFOUR MOE", bank: "Emirates NBD", flag: "\uD83C\uDDE6\uD83C\uDDEA", cur: "AED", native: -452 },
    { name: "DEWA PAYMENT", bank: "Emirates NBD", flag: "\uD83C\uDDE6\uD83C\uDDEA", cur: "AED", native: -308 },
  ];
  const total = txs.reduce((s, t) => s + conv(t.native, t.cur), 0);
  return (
    <div className="lp-demo-card lpd-cur">
      <div className="lpd-cur-head">
        <span className="lpd-cur-label">Home currency</span>
        <div className="lpd-cur-toggle">
          {["GBP", "AED"].map((c) => (
            <button key={c} className={"lpd-cur-opt" + (home === c ? " lpd-cur-opt-on" : "")} onClick={() => setHome(c)}>{c}</button>
          ))}
        </div>
      </div>
      <div className="lpd-cur-accounts">
        <span className="lpd-cur-acc">🇬🇧 HSBC · GBP</span>
        <span className="lpd-cur-acc">🇦🇪 Emirates NBD · AED</span>
      </div>
      {txs.map((t) => (
        <div className="lpd-cur-tx" key={t.name}>
          <span className="lpd-cur-tx-name">{t.flag} {t.name}</span>
          <span className="lpd-cur-tx-amt">
            <span className={t.native > 0 ? "lpd-cur-pos" : ""}>{fmt(t.native, t.cur)}</span>
            {t.cur !== home && <span className="lpd-cur-conv">≈ {fmt(conv(t.native, t.cur), home)}</span>}
          </span>
        </div>
      ))}
      <div className="lpd-cur-total">
        <span>Combined, in {home}</span>
        <b className={total >= 0 ? "lpd-cur-pos" : ""}>{fmt(total, home)}</b>
      </div>
      <div className="lpd-views-hint">Switch your home currency — every account converts at a rate locked per month. More currencies coming soon.</div>
    </div>
  );
}

function LpInsightsDemo() {
  const items = [
    { tone: "warn", ico: "↑", text: (<span><strong>Dining</strong> is up <strong>34%</strong> vs the same point last month.</span>) },
    { tone: "pos",  ico: "✓", text: (<span>At this rate you&rsquo;ll finish <strong>~&pound;90 under</strong> your target.</span>) },
    { tone: "info", ico: "★", text: (<span>Biggest merchant this month: <strong>Waitrose</strong> (&pound;312).</span>) },
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 3200);
    return () => clearInterval(t);
  }, []);
  const it = items[idx];
  return (
    <div className="lp-demo-card lpd-insights">
      <div className="lpd-ins-head"><span className="lpd-ins-spark"><Icon name="sparkles" size={15} /></span><span>TwoPockets noticed&hellip;</span></div>
      <div className={"lpd-ins-row lpd-ins-" + it.tone} key={idx}>
        <span className="lpd-ins-ico">{it.ico}</span>{it.text}
      </div>
      <div className="lpd-ins-dots">{items.map((_, i) => <span key={i} className={"lpd-ins-dot" + (i === idx ? " on" : "")} />)}</div>
    </div>
  );
}

/* ---------------- Landing (marketing) ---------------- */

