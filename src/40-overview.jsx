const OVERVIEW_WIDGETS = [
  { key: "summary", label: "Monthly Summary" },
  { key: "transactions", label: "Recent Transactions" },
  { key: "breakdown", label: "Spending Breakdown" },
  { key: "trends", label: "Spending Trend" },
  { key: "bills", label: "Bills & Subscriptions" },
  { key: "accounts", label: "Bank Accounts" },
  { key: "merchants", label: "Top Merchants" },
  { key: "insights", label: "Insights" },
  { key: "empty", label: "+ Empty slot" },
];
const DEFAULT_OVERVIEW_SLOTS = ["summary", "transactions", "breakdown", "insights"];
function renderOverviewWidget(key, { targets, banks, hasData, transactions, goals, goalsApi, accountData, billExcludes, rollovers }) {
  switch (key) {
    case "summary": return hasData ? <SummaryCard targets={targets} transactions={transactions} rollovers={rollovers} /> : <EmptyState text="No transactions yet — upload a statement to see your monthly summary." />;
    case "transactions": return hasData ? <TransactionFeed limit={5} transactions={transactions} /> : <EmptyState text="No transactions yet — upload a statement to see them here." />;
    case "breakdown": return hasData ? <BreakdownCard transactions={transactions} targets={targets} /> : <EmptyState text="No spending data yet — upload a statement to see your breakdown." />;
    case "trends": return hasData ? <TrendsCard transactions={transactions} compact /> : <EmptyState text="No trend data yet — upload a few months of statements." />;
    case "bills": return hasData ? <BillsCard transactions={transactions} confirmed={billExcludes} /> : <EmptyState text="No bills detected yet — upload a statement to get started." />;
    case "accounts": return <BankAccountsCard banks={banks} transactions={transactions} accountData={accountData} />;
    case "merchants": return hasData ? <MerchantsCard transactions={transactions} /> : <EmptyState text="No merchant data yet — upload a statement to get started." />;
    case "insights": return hasData ? <InsightsCard transactions={transactions} targets={targets} /> : <EmptyState text="No insights yet — upload a statement to get started." />;
    case "empty": return <div className="slot-empty"><div className="slot-empty-icon">+</div><p>Pick a widget from the menu above</p></div>;
    default: return null;
  }
}

/* Tour copy must match what the hero actually renders. The hero is data-driven:
   no targets -> "Spent so far", targets set -> "Safe to spend". The month shown is
   the latest month with data, which is not necessarily the current month. */
function overviewTour({ hasTargets, monthLabel }) {
  const per = monthLabel ? "in " + monthLabel : "this month";
  return [
    hasTargets
      ? { title: "Safe to spend", body: "This is roughly what you can spend each day for the rest of the month and still stay on budget." }
      : { title: "Spent so far", body: "This is what you've spent " + per + ". Set targets to unlock a safe-to-spend figure." },
    { title: "Where it's gone", body: "See what you spent " + per + ", broken down by category." },
    { title: "The big picture", body: "Your overall net worth and how you're tracking towards your savings goal." },
    { title: "Needs you", body: "Anything that needs a quick action — like transactions to categorise — shows up here." },
    { title: "Add a statement", body: "Tap the blue plus whenever you want to add a new bank statement. The more you add, the sharper your numbers get.", spot: "upload" },
    { title: "You've got mail", body: "Your inbox is here. We'll pop a note in whenever something needs a look — a month-end review, or a few transactions to tidy up.", spot: "inbox" },
    { title: "Your views", body: "Every part of your money lives in the menu — spending, targets, bills, insights and more. Ready-made views you can jump into any time.", spot: "menu" },
  ];
}

/* The overview scrolls inside .main-content-wide on desktop, not on window, so a
   plain scrollIntoView can no-op. Find the nearest scrollable ancestor and drive it
   directly; fall back to scrollIntoView if none is found (mobile: page scrolls). */
/* Scroll the highlighted element so its TOP sits at `desiredTop` px from the top of
   the viewport, using an instant jump (no smooth animation — smooth scrolling was the
   source of the ~1s "lag" on mobile, and it also raced the reveal of freshly-mounted
   widgets). Drives both window scroll (mobile: whole page scrolls) and the nearest
   inner scroll container (desktop overview). Returns nothing; the overlay re-measures
   after calling this. */
function scrollTourTargetIntoView(el, desiredTop) {
  if (!el) return;
  const want = typeof desiredTop === "number" ? desiredTop : 96;
  // The whole app has `scroll-behavior: smooth` set globally on html/body, which
  // OVERRIDES a JS `behavior:"auto"` and makes every programmatic scroll animate
  // slowly (this was the 4–5s crawl between tour steps). Force instant scrolling by
  // flipping scroll-behavior to auto on the scrolling roots for the duration of the
  // jump, then restore whatever was there.
  const roots = [document.documentElement, document.body];
  const prev = roots.map((r) => (r && r.style ? r.style.scrollBehavior : ""));
  roots.forEach((r) => { if (r && r.style) r.style.scrollBehavior = "auto"; });
  try {
    // 1. Inner scroll container first (desktop overview can scroll inside a div).
    try {
      let node = el.parentElement;
      while (node && node !== document.body) {
        const st = window.getComputedStyle(node);
        if ((st.overflowY === "auto" || st.overflowY === "scroll") && node.scrollHeight > node.clientHeight + 4) {
          const prevNb = node.style.scrollBehavior;
          node.style.scrollBehavior = "auto";
          const er = el.getBoundingClientRect();
          const nr = node.getBoundingClientRect();
          node.scrollTop += (er.top - nr.top) - want;
          node.style.scrollBehavior = prevNb;
          break;
        }
        node = node.parentElement;
      }
    } catch (e) {}
    // 2. Window scroll (mobile + desktop where the page itself scrolls). Set the exact
    // target scrollTop instead of scrollBy — instant, no interpolation.
    try {
      const er = el.getBoundingClientRect();
      const cur = window.pageYOffset || document.documentElement.scrollTop || 0;
      const target = cur + (er.top - want);
      window.scrollTo(0, target);
    } catch (e) {
      try { el.scrollIntoView(); } catch (e2) {}
    }
  } finally {
    roots.forEach((r, i) => { if (r && r.style) r.style.scrollBehavior = prev[i]; });
  }
}

function TourTarget({ active, className, children }) {
  return <div className={(className || "") + (active ? " oh-tour-active" : "")} data-tour-active={active ? "1" : undefined}>{children}</div>;
}

/* Guided tour overlay: dims the whole screen, cuts a bright spotlight over the active
   element (marked data-tour-active), and places the card in whichever half has room so
   it never covers the thing it's describing. */
function TourOverlay({ stepIndex, total, title, body, spot, onNext, onSkip }) {
  const [rect, setRect] = useState(null);
  const cardRef = React.useRef(null);
  // cardPlace: "bottom" (default) or "top". Content steps flip it based on where the
  // target sits; chrome steps (upload/inbox/menu) always stay at the bottom.
  const [cardPlace, setCardPlace] = useState("bottom");
  const PAD = 8;
  const HEADER = 64;      // sticky top bar height to stay clear of
  const MARGIN = 16;      // gap between card and the highlighted element
  const isChromeStep = !!spot; // upload / inbox / menu — target is in the fixed chrome

  // Position the card and the spotlight so they never overlap. For content steps we
  // decide, from the card's measured height, whether the target fits ABOVE the card
  // (card stays bottom) or needs the card at the TOP (target sits below it). Then we
  // scroll the target into the free zone and read back its final rect — one instant
  // pass, no smooth-scroll lag.
  const pickTourEl = () => {
    const els = Array.from(document.querySelectorAll('[data-tour-active="1"]'));
    /* "Visible" must mean MOSTLY on screen — a closed side drawer whose edge peeks
       past x=0 was being picked over the bottom-nav burger on mobile, so the ring
       hugged a sliver at the left edge. Require at least half the element in view. */
    const vis = (n) => {
      const r = n.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      const ow = Math.min(r.right, window.innerWidth) - Math.max(r.left, 0);
      const oh = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
      return ow >= r.width * 0.5 && oh >= r.height * 0.5;
    };
    return els.find(vis) || els[0] || null;
  };
  const readRect = React.useCallback(() => {
    const el = pickTourEl();
    if (!el) { setRect(null); return; }
    const vw = window.innerWidth, vh = window.innerHeight;
    const r = el.getBoundingClientRect();
    const x = Math.max(0, r.left - PAD), y = Math.max(0, r.top - PAD);
    const w = Math.min(vw - x, r.width + PAD * 2), h = r.height + PAD * 2;
    setRect((prev) => (prev && Math.abs(prev.x - x) < 0.5 && Math.abs(prev.y - y) < 0.5 && Math.abs(prev.w - w) < 0.5 && Math.abs(prev.h - h) < 0.5 && prev.vw === vw && prev.vh === vh) ? prev : { x, y, w, h, vw, vh });
  }, []);
  const place = React.useCallback(() => {
    const el = pickTourEl();
    if (!el) { setRect(null); return; }
    const vw = window.innerWidth, vh = window.innerHeight;
    const cardH = cardRef.current ? cardRef.current.offsetHeight : 240;

    if (isChromeStep) {
      // Chrome target: on phones the target lives in the BOTTOM nav, so the card
      // flips to the top; on desktop it's in the top bar, card stays at the bottom.
      const mob = window.matchMedia && window.matchMedia("(max-width: 640px)").matches;
      setCardPlace(mob ? "top" : "bottom");
    } else {
      // Free vertical space above a bottom-pinned card vs below a top-pinned card.
      const targetH = el.getBoundingClientRect().height;
      const spaceAboveBottomCard = vh - (cardH + 20) - HEADER - MARGIN;   // gap under header, above bottom card
      const spaceBelowTopCard    = vh - (HEADER + 12 + cardH) - MARGIN;   // gap under a top card
      if (targetH <= spaceAboveBottomCard) {
        // Fits fully in the gap above a bottom card — the common case. Card stays at the
        // bottom (its normal home) and the target sits just under the header.
        setCardPlace("bottom");
        scrollTourTargetIntoView(el, HEADER + MARGIN);
      } else if (targetH <= spaceBelowTopCard) {
        // Doesn't fit above a bottom card, but does fit below a top card — flip up.
        setCardPlace("top");
        scrollTourTargetIntoView(el, HEADER + 12 + cardH + MARGIN);
      } else {
        // Taller than either gap (short viewport + tall widget). Keep the card at the
        // bottom and align the target's TOP just under the header, so its most important
        // part (headline number / first row) is always visible; the tail tucks behind
        // the card rather than the whole thing being pushed off-screen.
        setCardPlace("bottom");
        scrollTourTargetIntoView(el, HEADER + MARGIN);
      }
    }

    // Read back the final position for the ring + dim panels.
    const r = el.getBoundingClientRect();
    const x = Math.max(0, r.left - PAD), y = Math.max(0, r.top - PAD);
    const w = Math.min(vw - x, r.width + PAD * 2), h = r.height + PAD * 2;
    setRect({ x, y, w, h, vw, vh });
  }, [isChromeStep, spot]);

  React.useEffect(() => {
    // Two instant passes: one after the step's widgets mount, one after layout settles.
    // No smooth scrolling anywhere — that was the mobile "lag".
    const t0 = setTimeout(place, 60);
    const t1 = setTimeout(place, 240);
    const t2 = setTimeout(place, 520);
    /* Keep the ring glued to the target: the fixed chrome can shift after a
       one-off measure (banners mounting, sticky bars engaging, the browser
       toolbar collapsing), so track the element every frame while the step is
       up. readRect bails out of the state update when nothing moved. */
    let raf = 0;
    const track = () => { readRect(); raf = requestAnimationFrame(track); };
    raf = requestAnimationFrame(track);
    const onWin = () => readRect();
    window.addEventListener("resize", onWin);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); cancelAnimationFrame(raf); window.removeEventListener("resize", onWin); };
  }, [stepIndex, place, readRect]);

  const dim = "rgba(16,24,40,0.60)";
  const panels = rect ? [
    { left: 0, top: 0, width: rect.vw, height: rect.y },
    { left: 0, top: rect.y + rect.h, width: rect.vw, height: Math.max(0, rect.vh - (rect.y + rect.h)) },
    { left: 0, top: rect.y, width: rect.x, height: rect.h },
    { left: rect.x + rect.w, top: rect.y, width: Math.max(0, rect.vw - (rect.x + rect.w)), height: rect.h },
  ] : [{ left: 0, top: 0, width: "100%", height: "100%" }];

  const cardStyleTop = cardPlace === "top";

  return (
    <div className="tour-root">
      {panels.map((p, i) => (
        <div key={i} className="tour-dim" style={{ position: "fixed", background: dim, zIndex: 2147483000, left: p.left, top: p.top, width: p.width, height: p.height }} />
      ))}
      {rect && (
        <div className="tour-ring" style={{ position: "fixed", zIndex: 2147483001, left: rect.x, top: rect.y, width: rect.w, height: rect.h, border: "2px solid rgba(46,91,255,0.55)", borderRadius: 16, boxShadow: "0 0 0 3px rgba(46,91,255,0.10)", pointerEvents: "none" }} />
      )}
      <div ref={cardRef} className="tour-card-v2" style={{ position: "fixed", zIndex: 2147483002,
        left: 14, right: 14,
        top: cardStyleTop ? (HEADER + 12) : "auto",
        bottom: cardStyleTop ? "auto" : 20 }}>
        <button className="tour-skip-x" onClick={onSkip} aria-label="Skip tour"
          style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", color: "var(--ink-3)", fontSize: 16, lineHeight: 1, cursor: "pointer", padding: 4 }}>{"\u2715"}</button>
        <div className="tour-step-count">Step {stepIndex + 1} of {total}</div>
        <h3 className="tour-title">{title}</h3>
        <p className="tour-body">{body}</p>
        <div className="tour-dots">
          {Array.from({ length: total }).map((_, i) => <span key={i} className={"tour-dot " + (i <= stepIndex ? "tour-dot-on" : "")} />)}
        </div>
        <button className="glass-btn primary tour-next" onClick={onNext}>{stepIndex >= total - 1 ? "Finish" : "Next"}</button>
        <button className="tour-skip" onClick={onSkip}
          style={{ display: "block", width: "100%", marginTop: 8, background: "none", border: "none", color: "var(--ink-3)", fontSize: 13, cursor: "pointer" }}>Skip tour</button>
      </div>
    </div>
  );
}

function InsightPill({ transactions, targets }) {
  const ins = buildInsights(transactions || [], targets || {});
  const [idx, setIdx] = useState(0);
  if (!ins.length) return null;
  const top = ins[idx % ins.length];
  const icon = top.type === "warning" ? "alert" : (top.type === "positive" ? "trending" : "sparkles");
  return (
    <div className={"oh-pill oh-pill-" + top.type}>
      <span className="oh-pill-icon"><Icon name={icon} size={17} /></span>
      <span className="oh-pill-text">{top.text}</span>
      {ins.length > 1 && <button className="oh-pill-refresh" onClick={() => setIdx((i) => i + 1)} aria-label="Show another insight"><Icon name="refresh" size={14} /></button>}
    </div>
  );
}

/* Option B: this hero is pinned to the CURRENT month. It used to fall back to the
   latest month that had data, which produced June figures sitting under a July
   heading. Now an empty month reads as an empty month, with the gap stated
   plainly and last month's total demoted to a reference card below. */
function SpentSoFarHero({ transactions, onOpenUpload }) {
  const txs = transactions || [];
  const key = currentMonthKey();
  const spent = spendForMonth(txs, key);
  const lastKey = latestMonthKey(txs);
  const hasAnyData = txs.some((t) => t.date);
  const noDataThisMonth = spent <= 0 && hasAnyData && lastKey < key;
  const lastDate = txs.filter((t) => t.date).map((t) => t.date).sort().pop();
  return (
    <>
      <div className="safe-hero">
        <div className="safe-hero-row">
          <div className="safe-hero-main">
            <span className="safe-hero-label">Spent so far {"·"} {monthLabelFromKey(key)}</span>
            <span className="safe-hero-num">{formatMoney(spent)}</span>
          </div>
          <div className="safe-hero-side">
            <span>day {today().getDate()} of {daysInCurrentMonth()}</span>
          </div>
        </div>
        {noDataThisMonth && (
          <div className="oh-gapnote">
            <span className="oh-gapnote-ic"><Icon name="calendar" size={15} /></span>
            <span className="oh-gapnote-tx">Your last statement ended {formatTxDate(lastDate)}. Upload {monthLabelFromKey(key)} to see your real numbers.</span>
            {onOpenUpload && <button className="oh-gapnote-cta" onClick={onOpenUpload}>Upload {"›"}</button>}
          </div>
        )}
      </div>
      {noDataThisMonth && <LastFullMonthCard transactions={txs} monthKey={lastKey} />}
    </>
  );
}

/* Last month's total, demoted to a reference card. It is real data and still
   useful, it just must not masquerade as this month's headline. */
function LastFullMonthCard({ transactions, monthKey }) {
  const spent = spendForMonth(transactions || [], monthKey);
  if (spent <= 0) return null;
  const byCat = spendByCategoryForMonth(transactions || [], monthKey);
  const top = Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a]).slice(0, 2);
  const topShare = top.reduce((s, c) => s + (byCat[c] || 0), 0);
  const pct = spent > 0 ? Math.round((topShare / spent) * 100) : 0;
  return (
    <div className="glass-card dash-card oh-lastmonth">
      <div className="oh-lastmonth-head">
        <span className="card-label">Last full month {"·"} {monthLabelFromKey(monthKey)}</span>
        <span className="oh-lastmonth-tag">for reference</span>
      </div>
      <div className="oh-lastmonth-row">
        <span className="oh-lastmonth-num">{formatMoney(spent)}</span>
        <span className="oh-lastmonth-sub">spent</span>
      </div>
      {top.length > 0 && <div className="oh-sub">{top.map(displayCat).join(" and ")} made up {pct}% of it.</div>}
    </div>
  );
}

function SetupPushBand({ onResumeSetup }) {
  return (
    <div className="oh-setup-band">
      <span className="oh-setup-ic"><Icon name="sliders" size={17} /></span>
      <span className="oh-setup-text"><strong>Want sharper insights?</strong> You're only seeing part of what {APP_NAME} can do {"—"} set your targets to unlock safe-to-spend, pacing alerts and tailored tips. It takes 3 minutes.</span>
      <button className="oh-setup-cta" onClick={onResumeSetup}>Set up {"›"}</button>
    </div>
  );
}

function MiniBreakdown({ transactions }) {
  const k = currentMonthKey();
  const cats = spendByCategoryForMonth(transactions || [], k);
  const entries = Object.entries(cats).filter(([c, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, e) => s + e[1], 0);
  if (!total) return (<div className="glass-card dash-card"><span className="card-label">Where it's gone</span><div className="oh-sub" style={{ marginTop: 8 }}>No spending yet this month.</div></div>);
  const top = entries.slice(0, 4);
  const otherTotal = entries.slice(4).reduce((s, e) => s + e[1], 0);
  const seg = top.map(([c, v]) => ({ label: displayCat(c), v, color: catColor(c) }));
  if (otherTotal > 0) seg.push({ label: "Other", v: otherTotal, color: "#9aa4b8" });
  let acc = 0;
  const stops = seg.map((sg) => { const start = (acc / total) * 100; acc += sg.v; const end = (acc / total) * 100; return sg.color + " " + start + "% " + end + "%"; }).join(", ");
  return (
    <div className="glass-card dash-card">
      <span className="card-label">Where it's gone</span>
      <div className="mb2">
        <div className="mb2-donut" style={{ background: "conic-gradient(" + stops + ")" }}>
          <div className="mb2-hole"><span className="mb2-amt">{formatMoney(total)}</span><span className="mb2-lb">SPENT</span></div>
        </div>
        <div className="mb2-legend">
          {seg.map((sg, i) => (
            <React.Fragment key={i}>
              <span className="mb2-name"><span className="mb2-dot" style={{ background: sg.color }} />{sg.label}</span>
              <span className="mb2-val">{formatMoney(sg.v)}</span>
              <span className="mb2-pct">{Math.round((sg.v / total) * 100)}%</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function InOutCard({ transactions }) {
  const key = currentMonthKey();
  const txs = transactions || [];
  const income = incomeForMonth(txs, key);
  const out = spendForMonth(txs, key);
  if (income <= 0) return (
    <div className="glass-card dash-card">
      <span className="card-label">In vs out {"·"} {currentMonthName()}</span>
      <div className="oh-sub" style={{ marginTop: 8 }}>No income recorded yet this month.</div>
    </div>
  );
  return (
    <div className="glass-card dash-card">
      <span className="card-label">In vs out {"·"} {currentMonthName()}</span>
      <div className="oh-io">
        <div><div className="oh-io-k">In</div><div className="oh-io-v" style={{ color: "var(--pos)" }}>{formatMoney(income)}</div></div>
        <div><div className="oh-io-k">Out</div><div className="oh-io-v">{formatMoney(out)}</div></div>
      </div>
    </div>
  );
}

function NetWorthCard({ banks, accountData, transactions }) {
  const netWorth = totalEstimatedBalance(banks, accountData, transactions || []);
  if (netWorth === null) return (
    <div className="glass-card dash-card">
      <span className="card-label">Net worth</span>
      <div className="oh-sub" style={{ marginTop: 8 }}>Add opening balances to your statements to see an estimate.</div>
    </div>
  );
  const statements = (accountData && accountData.statements) || [];
  const bankRows = (accountData && accountData.bankRows) || [];
  const names = Array.from(new Set([...(banks || []).filter(Boolean), ...((transactions || []).map((t) => t.bank).filter(Boolean))]));
  const acctRows = names.map((b) => ({ b, bal: computeBankBalance(b, statements, transactions || [], bankRows.find((r) => r.bank_name === b)) })).filter((r) => r.bal !== null);
  const byCur = {};
  acctRows.forEach((r) => { const cur = FX.bankCurrency[r.b] || "GBP"; byCur[cur] = (byCur[cur] || 0) + r.bal; });
  const curs = Object.keys(byCur);
  const multiCur = curs.length > 1;
  const homeTotals = curs.map((c) => ({ c, native: byCur[c], home: c === FX.home ? byCur[c] : fxConvert(byCur[c], c, nowMonth()) }));
  const totalHome = homeTotals.reduce((s, x) => s + x.home, 0) || 1;
  const curPalette = ["var(--accent-solid)", "#1D9E75", "#B54708", "#7A5AF8"];
  return (
    <div className="glass-card dash-card nw-card2">
      <span className="card-label">Net worth</span>
      <div className="nw2-big">{formatMoney(netWorth)}</div>
      {acctRows.length > 0 && (
        <div className="nw2-accts">
          {acctRows.map((r, i) => (
            <div className="nw2-acct" key={i}>
              <span className="nw2-acct-l"><span className="nw2-av">{String(r.b || "?").charAt(0).toUpperCase()}</span>{r.b}</span>
              <strong>{formatMoneyNative(r.bal, FX.bankCurrency[r.b] || "GBP")}</strong>
            </div>
          ))}
        </div>
      )}
      {multiCur && (
        <React.Fragment>
          <div className="nwp-bar">
            {homeTotals.map((x, i) => <div key={x.c} style={{ width: Math.max(2, (x.home / totalHome) * 100) + "%", background: curPalette[i % curPalette.length] }} />)}
          </div>
          <div className="nwp-legend">
            {homeTotals.map((x, i) => (
              <div className="nwp-leg" key={x.c}>
                <span className="nwp-leg-l"><span className="seg-dot" style={{ background: curPalette[i % curPalette.length] }} /> {x.c}</span>
                <span className="nwp-leg-r"><strong>{(CURRENCY_SYMBOLS[x.c] || "")}{Math.round(x.native).toLocaleString()}</strong>{x.c !== FX.home ? " ≈ " + formatMoney(Math.round(x.home)) : ""} {"·"} {Math.round((x.home / totalHome) * 100)}%</span>
              </div>
            ))}
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

function GoalCard({ goals, plan, banks, accountData, transactions }) {
  let goal = goals && goals.length ? goals[0] : null;
  if (!goal && plan && plan.targetBalance > 0) { const nw = totalEstimatedBalance(banks, accountData, transactions || []); goal = { name: "Savings plan", saved: Math.max(0, nw || 0), target: plan.targetBalance, targetDate: null }; }
  if (!goal) return (
    <div className="glass-card dash-card">
      <span className="card-label">Savings goal</span>
      <div className="oh-sub" style={{ marginTop: 8 }}>Set a savings goal to track your big-picture progress here.</div>
    </div>
  );
  const pct = goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;
  const remain = Math.max(0, goal.target - goal.saved);
  const months = monthsUntil(goal.targetDate);
  return (
    <div className="glass-card dash-card">
      <span className="card-label">{goal.name || "Savings goal"}</span>
      <div className="oh-big">{formatMoney(goal.saved)} <span className="oh-big-sub">of {formatMoney(goal.target)}</span></div>
      <div className="oh-track"><div className="oh-track-fill" style={{ width: pct + "%" }} /></div>
      <div className="oh-track-cap">{formatMoney(remain)} to go{months !== null ? " · " + months + " month" + (months !== 1 ? "s" : "") + " left" : ""}</div>
    </div>
  );
}

const CAT_ICON = { Groceries: "groceries", Dining: "dining", Transport: "transport", Shopping: "shopping", Subscriptions: "subscriptions", Bills: "bills" };

function CategoryStatusCard({ transactions, targets }) {
  const key = currentMonthKey();
  const cats = spendByCategoryForMonth(transactions || [], key);
  const day = today().getDate(), dim = daysInCurrentMonth();
  const rows = TX_CATEGORIES.map((c) => {
    const spent = cats[c] || 0;
    const target = Number((targets || {})[c]) || 0;
    return { c, spent, target };
  }).filter((r) => r.spent > 0 || r.target > 0);
  if (!rows.length) return <div className="glass-card dash-card"><span className="card-label">Where it's gone</span><div className="oh-sub" style={{ marginTop: 8 }}>No spending yet this month.</div></div>;
  const spentRows = rows.filter((r) => r.spent > 0).sort((a, b) => b.spent - a.spent);
  const totalSpent = spentRows.reduce((s, r) => s + r.spent, 0) || 1;
  if (!spentRows.length) return <div className="glass-card dash-card"><span className="card-label">Where it's gone</span><div className="oh-sub" style={{ marginTop: 8 }}>No spending yet this month.</div></div>;
  return (
    <div className="glass-card dash-card">
      <span className="card-label">Where it's gone</span>
      <div className="cst-list">
        {spentRows.map((r) => {
          const width = Math.min(100, (r.spent / totalSpent) * 100);
          return (
            <div className="cst-row" key={r.c}>
              <span className="cst-ic" style={{ color: catColor(r.c) }}><Icon name={CAT_ICON[r.c] || "tag"} size={15} /></span>
              <span className="cst-nm">{displayCat(r.c)}</span>
              <div className="cst-bar"><div style={{ width: width + "%", background: catColor(r.c) }} /></div>
              <span className="cst-amt">{formatMoney(r.spent)} <em>{Math.round((r.spent / totalSpent) * 100)}%</em></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PaceGaugeCard({ transactions, targets }) {
  const key = currentMonthKey();
  const budget = TX_CATEGORIES.reduce((s, c) => s + (Number((targets || {})[c]) || 0), 0);
  const spent = spendForMonth(transactions || [], key);
  const day = today().getDate(), dim = daysInCurrentMonth();
  const expected = budget > 0 ? budget * (day / dim) : null;
  if (expected === null) return <div className="glass-card dash-card"><span className="card-label">Your pace</span><div className="oh-sub" style={{ marginTop: 8 }}>Set targets to see your spending pace.</div></div>;
  const under = spent <= expected;
  const diff = Math.round(expected - spent);
  const pctSpent = Math.min(100, (spent / Math.max(budget, 1)) * 100);
  const pctExpected = Math.min(100, (expected / Math.max(budget, 1)) * 100);
  return (
    <div className="glass-card dash-card">
      <div className="pace-head-row"><span className="card-label" style={{ margin: 0 }}>Your pace</span><span className={"cst-chip " + (under ? "cst-ok" : "cst-warn")}>{under ? "Under pace" : "Over pace"}</span></div>
      <div className="pace-track">
        <div className="pace-fill2" style={{ width: pctSpent + "%", background: under ? "var(--pos)" : "var(--neg)" }} />
        <div className="pace-mark" style={{ left: pctExpected + "%" }} />
        <div className="pace-mark-lb" style={{ left: pctExpected + "%" }}>expected by today</div>
      </div>
      <div className="oh-sub" style={{ marginTop: 26 }}>You've spent <strong>{formatMoney(spent)}</strong> so far. By day {day} you'd typically be around <strong>{formatMoney(Math.round(expected))}</strong> — you're <strong>{formatMoney(Math.abs(diff))} {under ? "under" : "over"} your usual pace</strong> by now.</div>
    </div>
  );
}

function PaceFullCard({ transactions, targets, rollovers, billExcludes }) {
  const s = computeSafeToSpend(targets, transactions, rollovers, billExcludes);
  if (s.budget <= 0) return <div className="glass-card dash-card"><span className="card-label">Your pace</span><div className="oh-sub" style={{ marginTop: 8 }}>Set targets to see your spending pace.</div></div>;
  const day = s.dayOfMonth, dim = s.daysInMonth;
  const expected = s.budget * (day / dim);
  const under = s.spent <= expected;
  const diff = Math.round(expected - s.spent);
  const projEnd = Math.round(projectMonthEnd(s.spent));
  const pctSpent = Math.min(100, (s.spent / Math.max(s.budget, 1)) * 100);
  const pctExpected = Math.min(100, (expected / Math.max(s.budget, 1)) * 100);
  const pctOf = (v) => Math.min(100, Math.max(0, (v / Math.max(s.budget, 1)) * 100));
  const spentPct = pctOf(s.spent), resPct = pctOf(s.reserved), expPct = pctOf(expected);
  return (
    <div className="glass-card dash-card pf-card">
      <div className="pace-head-row"><span className="card-label" style={{ margin: 0 }}>Your pace</span><span className={"cst-chip " + (under ? "cst-ok" : "cst-warn")}>{under ? "Under pace" : "Over pace"}</span></div>
      <div className="fs-budget-row" style={{ marginTop: 16 }}><span className="safe-hero-label" style={{ fontSize: 11 }}>This month's spend budget</span><span className="fs-budget-val" style={{ fontSize: 16 }}>{formatMoney(s.spent)} <span className="fs-budget-of">of {formatMoney(s.budget)}</span></span></div>
      <div className="pf-bar-wrap">
        <div className="pf-bar">
          <div className="pf-bar-seg pf-seg-spent" style={{ width: spentPct + "%" }} />
          {s.reserved > 0 && <div className="pf-bar-seg pf-seg-res" style={{ width: resPct + "%" }} />}
        </div>
        <div className="pf-bar-mark" style={{ left: expPct + "%" }} />
        <div className="pf-bar-lb" style={{ left: expPct + "%" }}>expected by today</div>
      </div>
      <div className="safe-hero-legend pf-legend">
        <span><span className="seg-dot seg-dot-spent" /> {formatMoney(s.spent)} spent</span>
        {s.reserved > 0 && <span><span className="seg-dot seg-dot-res" /> {formatMoney(s.reserved)} bills set aside</span>}
        <span><span className="seg-dot seg-dot-free" /> {formatMoney(Math.max(0, s.free))} {s.over ? "over" : "free"}</span>
      </div>
    </div>
  );
}

function BillsUpcomingCard({ transactions, billExcludes }) {
  const bills = remainingBillsThisMonth(transactions, billExcludes);
  const upcoming = bills.filter((b) => b.upcoming).slice(0, 5);
  const paid = bills.filter((b) => b.paid).length;
  if (!bills.length) return <div className="glass-card dash-card"><span className="card-label">Bills coming up</span><div className="oh-sub" style={{ marginTop: 8 }}>No recurring bills detected yet {"—"} they appear after 2+ months of statements.</div></div>;
  return (
    <div className="glass-card dash-card">
      <span className="card-label">Bills coming up</span>
      {upcoming.length === 0
        ? <div className="oh-sub" style={{ marginTop: 8 }}>All done {"—"} {paid} bill{paid !== 1 ? "s" : ""} paid this month.</div>
        : (
          <>
            <div className="bup-list">
              {upcoming.map((b, i) => (
                <div className="bup-row" key={i}>
                  <span className="bup-nm">{b.name} {"·"} {b.due}</span>
                  <span className="bup-amt">{formatMoney(b.amount)}</span>
                  <span className="bup-tick"><Icon name="checkcircle" size={15} /></span>
                </div>
              ))}
            </div>
            <div className="oh-sub" style={{ marginTop: 8 }}><Icon name="checkcircle" size={11} /> means it's already set aside in your safe-to-spend.</div>
          </>
        )}
    </div>
  );
}

function SinceLastMonthCard({ transactions }) {
  const cur = currentMonthKey();
  const prev = lastNMonthKeys(cur, 2)[0];
  const sCur = spendForMonth(transactions || [], cur), sPrev = spendForMonth(transactions || [], prev);
  const iCur = incomeForMonth(transactions || [], cur);
  const kept = iCur > 0 ? Math.round(((iCur - sCur) / iCur) * 100) : null;
  const cCur = spendByCategoryForMonth(transactions || [], cur), cPrev = spendByCategoryForMonth(transactions || [], prev);
  let drop = null, rise = null;
  Object.keys({ ...cCur, ...cPrev }).forEach((c) => {
    const d = (cCur[c] || 0) - (cPrev[c] || 0);
    if (d < 0 && (!drop || d < drop.d)) drop = { c, d };
    if (d > 0 && (!rise || d > rise.d)) rise = { c, d };
  });
  const spendD = sCur - sPrev;
  const chips = [];
  if (sPrev > 0) chips.push({ v: (spendD <= 0 ? "\u2193 " : "\u2191 ") + formatMoney(Math.abs(spendD)), k: "Spending", good: spendD <= 0 });
  if (drop) chips.push({ v: "\u2193 " + formatMoney(Math.abs(drop.d)), k: displayCat(drop.c), good: true });
  if (rise) chips.push({ v: "\u2191 " + formatMoney(rise.d), k: displayCat(rise.c), good: false });
  if (!chips.length) return <div className="glass-card dash-card"><span className="card-label">Since last month</span><div className="oh-sub" style={{ marginTop: 8 }}>Upload another month of statements to compare.</div></div>;
  return (
    <div className="glass-card dash-card">
      <span className="card-label">Since last month</span>
      <div className="slm-grid">
        {chips.slice(0, 4).map((c, i) => (
          <div className="slm-chip" key={i}>
            <div className={"slm-v " + (c.good ? "slm-good" : "slm-bad")}>{c.v}</div>
            <div className="slm-k">{c.k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function goalProjection(goal, transactions) {
  if (!goal || goal.target <= 0) return null;
  const remaining = Math.max(0, goal.target - goal.saved);
  const keys = lastNMonthKeys(currentMonthKey(), 4).filter((k) => k !== currentMonthKey()).slice(0, 3);
  const paces = keys.map((k) => incomeForMonth(transactions || [], k) - spendForMonth(transactions || [], k)).filter((v) => v > 0);
  const pace = paces.length ? paces.reduce((a, b) => a + b, 0) / paces.length : 0;
  if (pace <= 0) return { remaining, pace: 0, projected: null };
  const monthsNeeded = remaining / pace;
  const proj = new Date(today());
  proj.setDate(proj.getDate() + Math.round(monthsNeeded * 30.44));
  return { remaining, pace, projected: proj };
}
function shortDate(d) { return d ? d.getDate() + " " + MONTHS_LABEL[d.getMonth()] : null; }

function GoalRingCard({ goals, transactions, plan, banks, accountData }) {
  let goal = goals && goals.length ? goals[0] : null;
  if (!goal && plan && plan.targetBalance > 0) { const nw = totalEstimatedBalance(banks, accountData, transactions || []); goal = { name: "Savings plan", saved: Math.max(0, nw || 0), target: plan.targetBalance, targetDate: plan.targetMonth ? plan.targetMonth + "-" + String(new Date(Number(plan.targetMonth.slice(0, 4)), Number(plan.targetMonth.slice(5, 7)), 0).getDate()).padStart(2, "0") : null, synthetic: true }; }
  if (!goal) return (
    <div className="glass-card dash-card">
      <span className="card-label">Savings goal</span>
      <div className="oh-sub" style={{ marginTop: 8 }}>Set a savings goal to see your progress ring here.</div>
    </div>
  );
  const pct = goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;
  const proj = goal.synthetic ? null : goalProjection(goal, transactions);
  const targetD = goal.targetDate ? new Date(goal.targetDate + "T00:00:00") : null;
  let etaChip = null;
  if (proj && proj.projected && targetD && !isNaN(targetD)) {
    const wks = Math.round((targetD - proj.projected) / (7 * 864e5));
    etaChip = wks >= 0
      ? { cls: "cst-ok", text: (wks === 0 ? "Right on schedule" : wks + " week" + (wks !== 1 ? "s" : "") + " early") }
      : { cls: "cst-warn", text: Math.abs(wks) + " week" + (Math.abs(wks) !== 1 ? "s" : "") + " behind" };
  }
  const R = 52, C = 2 * Math.PI * R;
  const milestones = [0.25, 0.5, 0.75].map((f) => {
    const a = -Math.PI / 2 + f * 2 * Math.PI;
    return { x: 65 + R * Math.cos(a), y: 65 + R * Math.sin(a), passed: pct / 100 >= f };
  });
  const nextM = [0.25, 0.5, 0.75, 1].find((f) => pct / 100 < f);
  const nextAmt = nextM ? Math.round(goal.target * nextM) : null;
  const nextWks = nextM && proj && proj.pace > 0 ? Math.max(1, Math.round(((goal.target * nextM - goal.saved) / proj.pace) * 4.33)) : null;
  return (
    <div className="glass-card dash-card">
      <span className="card-label">{goal.name || "Savings goal"}</span>
      <div className="grc-row">
        <div className="grc-donut" style={{ background: "conic-gradient(var(--accent-solid) 0% " + pct + "%, var(--surface-3) " + pct + "% 100%)" }}>
          <div className="grc-hole"><span className="grc-hole-pct">{pct}%</span><span className="grc-hole-lb">SAVED</span></div>
        </div>
        <div className="grc-side">
          <div className="grc-amt">{formatMoney(goal.saved)} <span>of {formatMoney(goal.target)}</span></div>
          <div className="grc-tog"><strong>{formatMoney(Math.max(0, goal.target - goal.saved))}</strong> to go{targetD && !isNaN(targetD) ? " · target " + shortDate(targetD) : ""}</div>
        </div>
      </div>
    </div>
  );
}

function MoneyFlowCard({ transactions }) {
  const key = currentMonthKey();
  const income = incomeForMonth(transactions || [], key);
  const out = spendForMonth(transactions || [], key);
  const kept = Math.max(0, income - out);
  if (income <= 0) return (
    <div className="glass-card dash-card">
      <span className="card-label">Money flow {"·"} {currentMonthName()}</span>
      <div className="oh-sub" style={{ marginTop: 8 }}>No income recorded yet this month.</div>
    </div>
  );
  const outPct = Math.min(100, Math.max(1.5, (out / income) * 100));
  return (
    <div className="glass-card dash-card">
      <span className="card-label">Money flow {"·"} {currentMonthName()}</span>
      <div className="mf2-row">
        <div><div className="mf2-k">In</div><div className="mf2-v mf2-in">{formatMoney(income)}</div></div>
        <div style={{ textAlign: "right" }}><div className="mf2-k">Out</div><div className="mf2-v">{formatMoney(out)}</div></div>
      </div>
      <div className="mf2-bar"><div className="mf2-kept" style={{ width: (100 - outPct) + "%" }} /><div className="mf2-out" style={{ width: outPct + "%" }} /></div>
    </div>
  );
}

function SavingsRateCard({ transactions }) {
  const [showInfo, setShowInfo] = useState(false);
  const keys = lastNMonthKeys(currentMonthKey(), 6);
  const pts = keys.map((k) => {
    const i = incomeForMonth(transactions || [], k);
    const s = spendForMonth(transactions || [], k);
    return i > 0 ? Math.round(((i - s) / i) * 100) : null;
  });
  const valid = pts.filter((v) => v !== null);
  if (valid.length < 2) return (
    <div className="glass-card dash-card">
      <span className="card-label">Savings rate</span>
      <div className="oh-sub" style={{ marginTop: 8 }}>Upload a couple of months of statements to see your trend.</div>
    </div>
  );
  const cur = pts[pts.length - 1];
  const isBest = cur !== null && cur >= Math.max(...valid);
  const avg = Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  const climbing = cur !== null && cur > avg;
  const W = 150, H = 44;
  const step = W / Math.max(pts.length - 1, 1);
  const line = pts.map((v, i) => v === null ? null : (i * step) + "," + (H - 4 - (Math.max(0, Math.min(100, v)) / 100) * (H - 10))).filter(Boolean).join(" ");
  return (
    <div className="glass-card dash-card">
      <div className="sr2-head">
        <span className="card-label" style={{ margin: 0 }}>Savings rate {"·"} 6 mo</span>
        <div className="sr2-head-right">{isBest && <span className="cst-chip cst-ok">best month yet</span>}<button className="sr-info-btn" onClick={() => setShowInfo((v) => !v)} aria-label="What is savings rate?" title="What is savings rate?"><Icon name="info" size={15} /></button></div>
      </div>
      <div className="sr2-body">
        <span className="sr2-num" style={cur !== null && cur < 0 ? { color: "var(--neg)" } : undefined}>{cur !== null ? cur + "%" : "—"}</span>
        <svg viewBox={"0 0 " + W + " " + H} width="150" height={H} preserveAspectRatio="none"><polyline points={line} fill="none" stroke="var(--pos)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <div className="oh-sub" style={{ marginTop: 12 }}>{climbing ? "Climbing steadily — up from a " + avg + "% average." : "Holding around your " + avg + "% average."}</div>
      {showInfo && <div className="sr-info-note">Savings rate = money kept ÷ income — that’s (income − spending) ÷ income, shown as an average across the last 6 months.</div>}
    </div>
  );
}

function ContributionBarsCard({ transactions }) {
  const [sel, setSel] = React.useState(null);
  const keys = lastNMonthKeys(currentMonthKey(), 6);
  const vals = keys.map((k) => Math.max(0, incomeForMonth(transactions || [], k) - spendForMonth(transactions || [], k)));
  const max = Math.max(...vals, 1);
  const any = vals.some((v) => v > 0);
  if (!any) return (
    <div className="glass-card dash-card">
      <span className="card-label">Added each month</span>
      <div className="oh-sub" style={{ marginTop: 8 }}>Contributions appear once a month ends with money kept.</div>
    </div>
  );
  const n = vals.length;
  const curIsMax = vals[n - 1] >= max;
  const shade = (i) => i === n - 1 ? "var(--accent-solid)" : "color-mix(in srgb, var(--accent-solid) " + Math.round(28 + (i / Math.max(n - 1, 1)) * 52) + "%, transparent)";
  return (
    <div className="glass-card dash-card">
      <div className="cb2-head">
        <span className="card-label" style={{ margin: 0 }}>Added each month</span>
        {sel != null && <span className="cb2-readout">{monthLabelFromKey(keys[sel])} {"·"} <strong>{formatMoney(Math.round(vals[sel]))}</strong></span>}
      </div>
      <div className="cb2-bars">
        {vals.map((v, i) => <div key={i} className={"cb2-col" + (sel === i ? " cb2-col-sel" : "")} role="button" tabIndex={0} title={monthLabelFromKey(keys[i]) + ": " + formatMoney(Math.round(v))} onClick={() => setSel(sel === i ? null : i)}><div className="cb2-bar" style={{ height: Math.max(4, (v / max) * 100) + "%", background: shade(i) }} /></div>)}
      </div>
      <div className="cb2-x">{keys.map((k, i) => <span key={k} className={i === n - 1 ? "cb2-now" : ""}>{monthLabelFromKey(k).slice(0, 3)}</span>)}</div>
      {curIsMax && sel == null && <div className="oh-sub" style={{ marginTop: 12 }}>{monthLabelFromKey(keys[n - 1])} is your biggest yet.</div>}
    </div>
  );
}



/* ---------------- Budget Hawk components ---------------- */


function CategoryVsTargetCard({ transactions, targets, billExcludes }) {
  const key = currentMonthKey();
  const cats = spendByCategoryForMonth(transactions || [], key);
  const day = today().getDate(), dim = daysInCurrentMonth();
  const elapsed = day / dim;
  const rows = TX_CATEGORIES.map((c) => ({ c, spent: cats[c] || 0, target: Number((targets || {})[c]) || 0 }))
    .filter((r) => r.spent > 0 || r.target > 0);
  if (!rows.length) return <div className="glass-card dash-card"><span className="card-label">Category vs target</span><div className="oh-sub" style={{ marginTop: 8 }}>Set targets to compare against.</div></div>;
  const upcomingBills = remainingBillsThisMonth(transactions, billExcludes).filter((b) => b.upcoming);
  const earliestDue = upcomingBills.length ? Math.min(...upcomingBills.map((b) => b.dueDay || 31)) : null;
  const tickPct = Math.round(elapsed * 100);
  /* Compact layout (Option C, 2026-07-23): one line per category — name · spent/short
     target · over/under — then a slim bar. Tick stays INSIDE the bar. */
  const shortT = (t) => t >= 1000 ? ((t / 1000).toFixed(1).replace(/\.0$/, "") + "k") : String(Math.round(t));
  return (
    <div className="glass-card dash-card">
      <span className="card-label">Category vs target</span>
      <div style={{ marginTop: 10 }}>
        {rows.map((r) => {
          const over = r.spent - r.target * elapsed > 0;
          const fill = r.target > 0 ? Math.min(100, (r.spent / r.target) * 100) : 0;
          const isBillsPending = r.c === "Bills" && r.spent === 0 && r.target > 0 && earliestDue !== null;
          const d = r.spent - r.target * elapsed;
          return (
            <div className="cvt3-row" key={r.c}>
              <div className="cvt3-top">
                <span className="cvt3-nm"><span className="cat-dot" style={{ background: catColor(r.c) }} />{displayCat(r.c)}</span>
                <span className="cvt3-spent">{formatMoney(Math.round(r.spent))}{r.target > 0 ? <small> / {shortT(r.target)}</small> : null}</span>
                {isBillsPending
                  ? <span className="cvt3-d cvt3-mut">due {ordinalDay(earliestDue)}</span>
                  : r.target > 0
                  ? <span className={"cvt3-d " + (over ? "cvt3-bad" : "cvt3-ok")}>{formatMoney(Math.round(Math.abs(d)))} {over ? "over" : "under"}</span>
                  : <span className="cvt3-d cvt3-mut">—</span>}
              </div>
              <div className="cvt3-track"><div className="cvt3-fill" style={{ width: fill + "%", background: catColor(r.c) }} /><div className="cvt3-tick" style={{ left: tickPct + "%" }} /></div>
            </div>
          );
        })}
      </div>
      <div className="cvt3-foot">Bar fills to target · black tick = day-{day} pace ({tickPct}%). Left of the tick = tracking under.</div>
    </div>
  );
}

function SpendByWeekCard({ transactions }) {
  const key = currentMonthKey();
  const txs = (transactions || []).filter((t) => t.amount < 0 && t.date && t.date.slice(0, 7) === key);
  const dim = daysInCurrentMonth();
  const nWeeks = Math.ceil(dim / 7);
  const weeks = Array.from({ length: nWeeks }, () => 0);
  txs.forEach((t) => { const d = parseInt(t.date.slice(8, 10), 10) || 1; weeks[Math.min(nWeeks - 1, Math.floor((d - 1) / 7))] += Math.abs(t.amount); });
  const curW = Math.min(nWeeks - 1, Math.floor((today().getDate() - 1) / 7));
  const max = Math.max(...weeks, 1);
  const hotIdx = weeks.indexOf(Math.max(...weeks));
  const anySpend = weeks.some((v) => v > 0);
  return (
    <div className="glass-card dash-card">
      <span className="card-label">Spend by week</span>
      <div className="sbw2-plot">
        {weeks.map((v, i) => {
          const future = i > curW, now = i === curW;
          const bg = future ? "var(--surface-3)" : now ? "color-mix(in srgb, var(--accent-solid) 45%, transparent)" : "var(--accent-solid)";
          return (
            <div className="sbw2-col" key={i}>
              {(now || (!future && v > 0)) && <span className="sbw2-val">{formatMoney(Math.round(v))}</span>}
              <div className="sbw2-bar" style={{ height: (!future && v > 0) ? Math.max(8, (v / max) * 100) + "%" : "6px", background: bg }} />
            </div>
          );
        })}
      </div>
      <div className="sbw2-x">{weeks.map((_, i) => <span key={i} className={i === curW ? "sbw2-xnow" : (i > curW ? "sbw2-xfut" : "")}>W{i + 1}{i === curW ? " · now" : ""}</span>)}</div>
      {anySpend
        ? <div className="oh-sub" style={{ marginTop: 16 }}>W{hotIdx + 1} is your heaviest so far at <strong>{formatMoney(Math.round(weeks[hotIdx]))}</strong>.{weeks[curW] === 0 ? " This week you've spent nothing yet." : ""}</div>
        : <div className="oh-sub" style={{ marginTop: 16 }}>No spending yet this month.</div>}
    </div>
  );
}

function Next7DaysCard({ transactions, billExcludes }) {
  const todayDay = today().getDate();
  const upcoming = remainingBillsThisMonth(transactions, billExcludes)
    .filter((b) => b.upcoming && b.dueDay <= todayDay + 7)
    .sort((a, b) => a.dueDay - b.dueDay);
  const total = upcoming.reduce((s, b) => s + b.amount, 0);
  return (
    <div className="glass-card dash-card">
      <span className="card-label">Next 7 days</span>
      {upcoming.length === 0
        ? <div className="oh-sub" style={{ marginTop: 8 }}>Nothing due in the next week.</div>
        : (
          <>
            {upcoming.slice(0, 4).map((b, i) => (
              <div className="n7-row" key={i}><span className="n7-dt">{ordinalDay(b.dueDay)}</span><span className="n7-nm">{b.name}</span><span className="n7-amt">{formatMoney(b.amount)}</span></div>
            ))}
            <div className="n7-row n7-total"><span className="n7-dt" /><span className="n7-nm">Total leaving</span><span className="n7-amt">{formatMoney(total)}</span></div>
          </>
        )}
    </div>
  );
}

function MonthEndProjectionCard({ transactions, targets }) {
  const key = currentMonthKey();
  const spent = spendForMonth(transactions || [], key);
  const budget = TX_CATEGORIES.reduce((s, c) => s + (Number((targets || {})[c]) || 0), 0);
  const day = today().getDate();
  const proj = Math.round(projectMonthEnd(spent));
  const rate = day > 0 ? spent / day : 0;
  const diff = budget - proj;
  return (
    <div className="glass-card dash-card mep2-card">
      <span className="card-label">Month-end projection</span>
      <div className="mep2-big">{formatMoney(proj)}<span>projected spend</span></div>
      {budget > 0 && <span className={"mep2-pill " + (diff >= 0 ? "mep2-ok" : "mep2-bad")}>{formatMoney(Math.abs(Math.round(diff)))} {diff >= 0 ? "under" : "over"} budget</span>}
      <div className="oh-sub" style={{ marginTop: 12 }}>Based on your current rate of <strong>{formatMoney(Math.round(rate))}/day</strong>.</div>
    </div>
  );
}

function PaceOutlookCard({ transactions, targets, billExcludes }) {
  const key = currentMonthKey();
  const budget = TX_CATEGORIES.reduce((s, c) => s + (Number((targets || {})[c]) || 0), 0);
  const spent = spendForMonth(transactions || [], key);
  const day = today().getDate(), dim = daysInCurrentMonth();
  if (budget <= 0) return <div className="glass-card dash-card"><span className="card-label">Your pace</span><div className="oh-sub" style={{ marginTop: 8 }}>Set targets to see your spending pace.</div></div>;
  const expected = budget * (day / dim);
  const under = spent <= expected;
  const diff = Math.round(Math.abs(expected - spent));
  const spentPct = Math.min(100, (spent / Math.max(budget, 1)) * 100);
  const expPct = Math.min(100, (expected / Math.max(budget, 1)) * 100);
  const todayDay = today().getDate();
  const upcoming = remainingBillsThisMonth(transactions, billExcludes).filter((b) => b.upcoming && b.dueDay <= todayDay + 7).sort((a, b) => a.dueDay - b.dueDay);
  const n7 = upcoming.length === 0 ? "nothing due." : upcoming.map((b) => b.name + " " + formatMoney(b.amount)).join(", ") + ".";
  return (
    <div className="glass-card dash-card pace2-card">
      <div className="pace2-head">
        <span className="card-label" style={{ margin: 0 }}>Your pace</span>
        <span className={"cst-chip " + (under ? "cst-ok" : "cst-warn")}>{under ? "Under pace" : "Over pace"}</span>
      </div>
      <div className="pace2-barwrap">
        <div className="pace2-bar"><div className="pace2-fill" style={{ width: spentPct + "%", background: under ? "var(--accent-solid)" : "var(--neg)" }} /></div>
        <div className="pace2-mark" style={{ left: expPct + "%" }} />
        <div className="pace2-lb" style={{ left: expPct + "%" }}><span className="fsr-caret">{"▴"}</span>expected by today</div>
      </div>
      <div className="oh-sub" style={{ marginTop: 4 }}>You've spent <strong>{formatMoney(spent)}</strong>. By day {day} you'd typically be near <strong>{formatMoney(Math.round(expected))}</strong> — so you're <strong className={under ? "pace2-good" : ""}>{formatMoney(diff)} {under ? "under" : "over"} your usual pace</strong> by now.</div>
      <div className="pace2-foot"><strong>Next 7 days:</strong> {n7}</div>
    </div>
  );
}

/* ---------------- Power View components ---------------- */

function avg3moSpendByCategory(transactions) {
  const keys = lastNMonthKeys(currentMonthKey(), 4).slice(0, 3);
  const acc = {};
  keys.forEach((k) => {
    const c = spendByCategoryForMonth(transactions || [], k);
    Object.keys(c).forEach((cat) => { acc[cat] = (acc[cat] || 0) + c[cat]; });
  });
  const out = {};
  Object.keys(acc).forEach((cat) => { out[cat] = acc[cat] / keys.length; });
  return out;
}


function CategoryDeltaCard({ transactions }) {
  const key = currentMonthKey();
  const cur = spendByCategoryForMonth(transactions || [], key);
  const avg = avg3moSpendByCategory(transactions);
  const elapsed = today().getDate() / daysInCurrentMonth();
  const rows = TX_CATEGORIES.map((c) => {
    const s = cur[c] || 0;
    const a = (avg[c] || 0) * elapsed;
    if (s === 0 && a === 0) return null;
    const pct = a > 0 ? Math.round(((s - a) / a) * 100) : null;
    return { c, s, pct };
  }).filter(Boolean).sort((x, y) => y.s - x.s);
  if (!rows.length) return <div className="glass-card dash-card"><span className="card-label">{"Δ"} vs 3-mo avg</span><div className="oh-sub" style={{ marginTop: 8 }}>Needs a few months of statements.</div></div>;
  const hot = rows.filter((r) => r.pct !== null && r.pct > 0).sort((a, b) => b.pct - a.pct)[0];
  return (
    <div className="glass-card dash-card">
      <span className="card-label">Categories vs your average</span>
      <p className="pv-desc">Compares what you’ve spent so far with what you’d usually have spent by this point in the month, based on your last 3 months.</p>
      <div className="pvg">
        {rows.slice(0, 5).map((r) => (
          <React.Fragment key={r.c}>
            <span className="pvg-n"><span className="cat-dot" style={{ background: catColor(r.c) }} />{displayCat(r.c)}</span>
            <span className="pvg-v">{formatMoney(Math.round(r.s))}</span>
            <span className={"pvg-d " + (r.pct === null ? "pvg-mut" : (r.pct > 0 ? "cvt-bad" : "cvt-ok"))}>{r.pct === null ? "—" : (r.pct > 0 ? "+" : "−") + Math.abs(r.pct) + "%"}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="cvt2-foot">{hot ? displayCat(hot.c) + " is running ahead of its usual pace; everything else is below where you’d normally be by now." : "Everything’s below where you’d normally be by this point in the month."}</div>
    </div>
  );
}

function MerchantsProCard({ transactions }) {
  const key = currentMonthKey();
  const txs = (transactions || []).filter((t) => t.amount < 0 && t.date && t.date.slice(0, 7) === key);
  const norm = (n) => String(n || "Unknown").toLowerCase().replace(/\d+/g, "").replace(/\s+/g, " ").trim() || "unknown";
  const by = {};
  txs.forEach((t) => {
    const k = norm(t.name);
    const a = Math.abs(t.amount);
    if (!by[k]) by[k] = { amt: 0, disp: t.name || "Unknown", dispAmt: 0, cats: {} };
    by[k].amt += a;
    by[k].cats[t.category] = (by[k].cats[t.category] || 0) + a;
    if (a > by[k].dispAmt) { by[k].dispAmt = a; by[k].disp = t.name || "Unknown"; }
  });
  const rows = Object.values(by).map((g) => ({ disp: g.disp, amt: g.amt, cat: (Object.entries(g.cats).sort((a, b) => b[1] - a[1])[0] || ["Uncategorized"])[0] })).sort((a, b) => b.amt - a.amt);
  const total = rows.reduce((s, r) => s + r.amt, 0);
  if (!rows.length) return <div className="glass-card dash-card"><span className="card-label">Top merchants</span><div className="oh-sub" style={{ marginTop: 8 }}>No spending yet this month.</div></div>;
  const top = rows.slice(0, 3);
  const conc = Math.round((top.reduce((s, r) => s + r.amt, 0) / Math.max(total, 1)) * 100);
  const shades = ["var(--accent-solid)", "color-mix(in srgb, var(--accent-solid) 68%, transparent)", "color-mix(in srgb, var(--accent-solid) 42%, transparent)"];
  return (
    <div className="glass-card dash-card">
      <div className="mpc2-head"><span className="card-label" style={{ margin: 0 }}>Top merchants</span></div>
      <p className="pv-desc">Where most of your money went this month.</p>
      <div className="mpc2-list">
        {top.map((r, i) => {
          const pc = Math.round((r.amt / Math.max(total, 1)) * 100);
          return (
            <div key={i}>
              <div className="mpc2-row"><span className="mpc2-nm"><span className="cat-dot" style={{ background: catColor(r.cat) }} />{r.disp}</span><span className="mpc2-v">{formatMoney(Math.round(r.amt))}</span></div>
              <div className="mpc2-track"><div style={{ width: pc + "%", background: shades[i] }} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BiggestMoversCard({ transactions }) {
  const cur = spendByCategoryForMonth(transactions || [], currentMonthKey());
  const avg = avg3moSpendByCategory(transactions);
  const elapsed = today().getDate() / daysInCurrentMonth();
  const movers = Object.keys({ ...cur, ...avg }).map((c) => {
    const a = cur[c] || 0, b = (avg[c] || 0) * elapsed;
    const d = a - b;
    const pct = b > 0 ? Math.round((d / b) * 100) : null;
    return { c, d, pct };
  }).filter((m) => Math.abs(m.d) >= 1).sort((x, y) => Math.abs(y.d) - Math.abs(x.d));
  if (!movers.length) return <div className="glass-card dash-card"><span className="card-label">Biggest changes vs your usual</span><div className="oh-sub" style={{ marginTop: 8 }}>Needs a few months of statements to compare.</div></div>;
  return (
    <div className="glass-card dash-card">
      <span className="card-label">Biggest changes vs your usual</span>
      <p className="pv-desc">The categories furthest from what you’d typically have spent by this point in the month, based on your last 3 months.</p>
      <div className="pvg">
        {movers.slice(0, 5).map((m) => (
          <React.Fragment key={m.c}>
            <span className="pvg-n"><span className="cat-dot" style={{ background: catColor(m.c) }} />{displayCat(m.c)}</span>
            <span className={"pvg-v " + (m.d > 0 ? "cvt-bad" : "cvt-ok")}>{m.d > 0 ? "+" : "−"}{formatMoney(Math.round(Math.abs(m.d)))}</span>
            <span className={"pvg-d " + (m.pct === null ? "pvg-mut" : (m.d > 0 ? "cvt-bad" : "cvt-ok"))}>{m.pct === null ? "new" : (m.d > 0 ? "↑" : "↓") + Math.abs(m.pct) + "%"}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function Trend12Card({ transactions }) {
  const keys = lastNMonthKeys(currentMonthKey(), 12);
  const vals = keys.map((k) => spendForMonth(transactions || [], k));
  const withData = vals.filter((v) => v > 0);
  if (withData.length < 3) return <div className="glass-card dash-card"><span className="card-label">Spend {"·"} trailing 12 mo</span><div className="oh-sub" style={{ marginTop: 8 }}>Upload more history to unlock the long trend.</div></div>;
  const avg = withData.reduce((a, b) => a + b, 0) / withData.length;
  const max = Math.max(...vals, avg, 1);
  const W = 560, H = 64;
  const step = W / Math.max(vals.length - 1, 1);
  const pts = vals.map((v, i) => (i * step) + "," + (H - 6 - (v / max) * (H - 14))).join(" ");
  const avgY = H - 6 - (avg / max) * (H - 14);
  return (
    <div className="glass-card dash-card">
      <span className="card-label">Spending {"—"} last 12 months</span>
      <p className="pv-desc">Your total spend each month. The dashed line is your average ({formatMoney(Math.round(avg))}).</p>
      <svg viewBox={"0 0 " + W + " " + H} width="100%" height={H + 10} preserveAspectRatio="none" style={{ marginTop: 2, overflow: "visible" }}>
        <polygon points={pts + " " + W + "," + H + " 0," + H} fill="var(--accent-soft)" />
        <line x1="0" y1={avgY} x2={W} y2={avgY} stroke="var(--ink-3)" strokeWidth="1" strokeDasharray="4 5" opacity="0.55" vectorEffect="non-scaling-stroke" />
        <polyline points={pts} fill="none" stroke="var(--accent-solid)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="tr12-x"><span>{monthLabelFromKey(keys[0]).slice(0, 3)}</span><span>{monthLabelFromKey(keys[Math.floor(keys.length / 2)]).slice(0, 3)}</span><span>{monthLabelFromKey(keys[keys.length - 1]).slice(0, 3)}</span></div>
    </div>
  );
}

function NetSavedCard({ transactions }) {
  const tx = transactions || [];
  const keys = lastNMonthKeys(currentMonthKey(), 13).slice(0, 12);
  const inc = keys.map((k) => incomeForMonth(tx, k));
  const spd = keys.map((k) => spendForMonth(tx, k));
  const net = keys.map((_, i) => inc[i] - spd[i]);
  const active = keys.map((_, i) => inc[i] > 0 || spd[i] > 0);
  const activeCount = active.filter(Boolean).length;
  if (activeCount < 3) return <div className="glass-card dash-card"><span className="card-label">Net saved each month</span><div className="oh-sub" style={{ marginTop: 8 }}>Upload more history to unlock the trend.</div></div>;
  const maxAbs = Math.max(...net.map((v) => Math.abs(v)), 1);
  const avgNet = net.reduce((a, b, i) => a + (active[i] ? b : 0), 0) / activeCount;
  const W = 560, H = 76, mid = H / 2, pad = 7, half = mid - pad, n = keys.length, slot = W / n, bw = slot * 0.5;
  return (
    <div className="glass-card dash-card">
      <span className="card-label">Net saved each month</span>
      <p className="pv-desc">Money in minus money out each month. Green months you saved; red months you overspent.</p>
      <svg viewBox={"0 0 " + W + " " + H} width="100%" height={H + 10} preserveAspectRatio="none" style={{ marginTop: 2, overflow: "visible" }}>
        <line x1="0" y1={mid} x2={W} y2={mid} stroke="var(--line-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        {net.map((v, i) => {
          if (!active[i]) return null;
          const bh = Math.max((Math.abs(v) / maxAbs) * half, 1.5);
          const x = i * slot + (slot - bw) / 2;
          const y = v >= 0 ? mid - bh : mid;
          return <rect key={i} x={x} y={y} width={bw} height={bh} rx="2" fill={v >= 0 ? "var(--pos)" : "var(--neg)"} opacity={i === n - 1 ? 1 : 0.85} />;
        })}
      </svg>
      <div className="tr12-x"><span>{monthLabelFromKey(keys[0]).slice(0, 3)}</span><span>{monthLabelFromKey(keys[Math.floor(n / 2)]).slice(0, 3)}</span><span>{monthLabelFromKey(keys[n - 1]).slice(0, 3)}</span></div>
      <div className="cvt2-foot">{avgNet >= 0 ? "On average you saved " + formatMoney(Math.round(avgNet)) + " a month." : "On average you overspent by " + formatMoney(Math.round(Math.abs(avgNet))) + " a month."}</div>
    </div>
  );
}

function NetWorthProCard({ banks, accountData, transactions }) {
  const nw = totalEstimatedBalance(banks, accountData, transactions || []);
  if (nw === null) return <NetWorthCard banks={banks} accountData={accountData} transactions={transactions} />;
  const { statements = [], bankRows = [] } = accountData || {};
  const names = new Set(banks || []);
  (transactions || []).forEach((t) => { if (t.bank) names.add(t.bank); });
  const byCur = {};
  names.forEach((b) => {
    const row = bankRows.find((r) => r.bank_name === b);
    const bal = computeBankBalance(b, statements, transactions, row);
    if (bal !== null) { const cur = FX.bankCurrency[b] || "GBP"; byCur[cur] = (byCur[cur] || 0) + bal; }
  });
  const curs = Object.keys(byCur);
  let homeTotals = curs.map((c) => ({ c, native: byCur[c], home: c === FX.home ? byCur[c] : fxConvert(byCur[c], c, nowMonth()) }));
  if (!homeTotals.length) homeTotals = [{ c: FX.home || "GBP", native: nw, home: nw }];
  const totalHome = homeTotals.reduce((s, x) => s + x.home, 0) || 1;
  const palette = ["var(--accent-solid)", "#1D9E75", "#B54708", "#7A5AF8"];
  return (
    <div className="glass-card dash-card">
      <span className="card-label">Net worth</span>
      <p className="pv-desc">Your total balance across all accounts, split by currency.</p>
      <div className="oh-big">{formatMoney(Math.round(nw))}</div>
      <div className="nwp-bar">
        {homeTotals.map((x, i) => <div key={x.c} style={{ width: Math.max(2, (x.home / totalHome) * 100) + "%", background: palette[i % palette.length] }} />)}
      </div>
      <div className="nwp-legend">
        {homeTotals.map((x, i) => (
          <div className="nwp-leg" key={x.c}>
            <span className="nwp-leg-l"><span className="seg-dot" style={{ background: palette[i % palette.length] }} /> {x.c}</span>
            <span className="nwp-leg-r"><strong>{(CURRENCY_SYMBOLS[x.c] || "")}{Math.round(x.native).toLocaleString()}</strong>{x.c !== FX.home ? " ≈ " + formatMoney(Math.round(x.home)) : ""} {"·"} {Math.round((x.home / totalHome) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MoneyScoreCard({ transactions, targets, billExcludes }) {
  const s = computeSafeToSpend(targets, transactions, null, billExcludes);
  const key = currentMonthKey();
  const spent = spendForMonth(transactions || [], key);
  const income = incomeForMonth(transactions || [], key);
  const day = today().getDate(), dim = daysInCurrentMonth();
  const budget = TX_CATEGORIES.reduce((t, c) => t + (Number((targets || {})[c]) || 0), 0);
  const parts = [];
  let score = 50;
  if (budget > 0) {
    const under = spent <= budget * (day / dim);
    score += under ? 15 : -10;
    parts.push({ t: "pace", ok: under });
  }
  if (income > 0) {
    const rate = (income - spent) / income;
    const ok = rate >= 0.2;
    score += ok ? 15 : -5;
    parts.push({ t: "savings", ok });
  }
  const bills = remainingBillsThisMonth(transactions, billExcludes);
  if (bills.length) {
    const covered = budget <= 0 || s.free >= 0;
    score += covered ? 10 : -10;
    parts.push({ t: "bills", ok: covered });
  }
  let drag = null;
  if (budget > 0) {
    const cats = spendByCategoryForMonth(transactions || [], key);
    const overs = TX_CATEGORIES.filter((c) => { const t = Number((targets || {})[c]) || 0; return t > 0 && (cats[c] || 0) > t; });
    if (overs.length) { score -= 4 * Math.min(3, overs.length); drag = displayCat(overs[0]); }
  }
  score = Math.max(5, Math.min(98, Math.round(score)));
  const ringCol = score >= 70 ? "var(--pos)" : score >= 45 ? "var(--warn)" : "var(--neg)";
  const partLabel = { pace: "Spending pace", savings: "Savings rate", bills: "Bills covered" };
  return (
    <div className="glass-card dash-card">
      <span className="card-label">Money score</span>
      <p className="pv-desc">A quick 0–100 health check of your month, based on your spending pace, savings rate and bills.</p>
      <div className="ms2-row">
        <div className="ms2-ring" style={{ background: "conic-gradient(" + ringCol + " 0% " + score + "%, var(--surface-3) " + score + "% 100%)" }}>
          <div className="ms2-hole">{score}</div>
        </div>
        <div className="ms2-legend">
          {parts.map((pt, i) => <div className="ms2-leg" key={i}><span>{partLabel[pt.t] || pt.t}</span><span className={pt.ok ? "ms-ok" : "ms-bad"}>{pt.ok ? "✓" : "✗"}</span></div>)}
          {drag && <div className="ms2-drag">{drag} is pulling it down</div>}
        </div>
      </div>
    </div>
  );
}

function BillsChecklistCard({ transactions, billExcludes }) {
  const bills = remainingBillsThisMonth(transactions, billExcludes)
    .slice().sort((a, b) => (a.paid ? 1 : 0) - (b.paid ? 1 : 0) || (a.dueDay || 31) - (b.dueDay || 31));
  if (!bills.length) return (
    <div className="glass-card dash-card"><span className="card-label">Bills this month</span><div className="oh-sub" style={{ marginTop: 8 }}>Nothing's a bill until you say so {"\u2014"} pick your regular payments and they'll show up here.</div><button className="link-btn inline" style={{ marginTop: 10 }} onClick={() => goToView("bills")}>Choose your bills {"\u203A"}</button></div>
  );
  const overdueTotal = bills.filter((b) => !b.paid && !b.upcoming).reduce((s, b) => s + b.amount, 0);
  const upcomingTotal = bills.filter((b) => !b.paid && b.upcoming).reduce((s, b) => s + b.amount, 0);
  return (
    <div className="glass-card dash-card">
      <span className="card-label">Bills this month</span>
      {bills.map((b, i) => {
        const overdue = !b.paid && !b.upcoming;
        const KEEP_UP = ["DD", "UK", "US", "EU", "UAE", "USA", "LLC", "PLC", "VAT"];
        const nm = String(b.name || "").toLowerCase().split(" ").map((w) => KEEP_UP.includes(w.toUpperCase()) ? w.toUpperCase() : (w.charAt(0).toUpperCase() + w.slice(1))).join(" ");
        return (
          <div className="blc-row" key={i}>
            <span className={"blc-dot " + (b.paid ? "blc-dot-paid" : overdue ? "blc-dot-od" : "blc-dot-up")} />
            <span className={"blc-nm" + (b.paid ? " blc-done" : "")}>{nm}{b.paid ? "" : overdue ? <span className="blc-od-lb"> · overdue</span> : <span className="blc-due-lb"> · due {ordinalDay(b.dueDay)}</span>}</span>
            <span className={"blc-amt" + (b.paid ? " blc-done" : overdue ? " blc-amt-od" : "")}>{formatMoney(b.amount)}</span>
          </div>
        );
      })}
      <div className="oh-sub" style={{ marginTop: 8 }}>
        {overdueTotal > 0
          ? <><strong className="blc-od-txt">{formatMoney(overdueTotal)} overdue</strong>{upcomingTotal > 0 ? <> · {formatMoney(upcomingTotal)} still to come</> : ""}</>
          : upcomingTotal > 0
          ? <><strong>{formatMoney(upcomingTotal)}</strong> still to come this month.</>
          : "All paid — you're clear for " + currentMonthName() + "."}
      </div>
    </div>
  );
}

const HOME_WIDGETS = {
  breakdown_mini: { label: "Where it's gone", section: "month", render: (p) => <MiniBreakdown transactions={p.transactions} /> },
  breakdown_wide: { label: "Where it's gone (wide)", section: "month", full: true, render: (p) => <MiniBreakdown transactions={p.transactions} /> },
  in_out: { label: "In vs out", section: "month", render: (p) => <InOutCard transactions={p.transactions} /> },
  transactions_mini: { label: "Recent transactions", section: "month", render: (p) => <TransactionFeed limit={5} transactions={p.transactions} /> },
  merchants: { label: "Top merchants", section: "month", render: (p) => <MerchantsCard transactions={p.transactions} /> },
  bills: { label: "Bills & subscriptions", section: "month", render: (p) => <BillsCard transactions={p.transactions} confirmed={p.billExcludes} /> },
  bills_checklist: { label: "Bills checklist", section: "month", render: (p) => <BillsChecklistCard transactions={p.transactions} billExcludes={p.billExcludes} /> },
  trend: { label: "Spending trend", section: "month", render: (p) => <TrendsCard transactions={p.transactions} compact /> },
  category_status: { label: "Where it's gone (bars)", section: "month", render: (p) => <CategoryStatusCard transactions={p.transactions} targets={p.targets} /> },
  pace_gauge: { label: "Your pace", section: "month", render: (p) => <PaceGaugeCard transactions={p.transactions} targets={p.targets} /> },
  pace_full: { label: "Your pace (wide)", section: "month", full: true, render: (p) => <PaceFullCard transactions={p.transactions} targets={p.targets} rollovers={p.rollovers} billExcludes={p.billExcludes} /> },
  bills_upcoming: { label: "Bills coming up", section: "month", render: (p) => <BillsUpcomingCard transactions={p.transactions} billExcludes={p.billExcludes} /> },
  net_worth: { label: "Net worth", section: "big", render: (p) => <NetWorthCard banks={p.banks} accountData={p.accountData} transactions={p.transactions} /> },
  since_last_month: { label: "Since last month", section: "big", render: (p) => <SinceLastMonthCard transactions={p.transactions} /> },
  goal_ring: { label: "Goal ring & forecast", section: "big", render: (p) => <GoalRingCard goals={p.goals} transactions={p.transactions} plan={p.plan} banks={p.banks} accountData={p.accountData} /> },
  money_flow: { label: "Money flow", section: "month", render: (p) => <MoneyFlowCard transactions={p.transactions} /> },
  savings_rate: { label: "Savings rate", section: "month", render: (p) => <SavingsRateCard transactions={p.transactions} /> },
  contribution_bars: { label: "Added each month", section: "big", render: (p) => <ContributionBarsCard transactions={p.transactions} /> },
  category_vs_target: { label: "Category vs target (table)", section: "month", full: true, render: (p) => <CategoryVsTargetCard transactions={p.transactions} targets={p.targets} billExcludes={p.billExcludes} /> },
  pace_outlook: { label: "Your pace + outlook", section: "month", render: (p) => <PaceOutlookCard transactions={p.transactions} targets={p.targets} billExcludes={p.billExcludes} /> },
  spend_by_week: { label: "Spend by week", section: "month", render: (p) => <SpendByWeekCard transactions={p.transactions} /> },
  next_7_days: { label: "Next 7 days", section: "month", render: (p) => <Next7DaysCard transactions={p.transactions} billExcludes={p.billExcludes} /> },
  category_delta: { label: "Δ vs 3-mo average", section: "month", render: (p) => <CategoryDeltaCard transactions={p.transactions} /> },
  merchants_pro: { label: "Top merchants (share)", section: "month", render: (p) => <MerchantsProCard transactions={p.transactions} /> },
  biggest_movers: { label: "Biggest movers", section: "month", render: (p) => <BiggestMoversCard transactions={p.transactions} /> },
  trend_12: { label: "12-month trend", section: "month", render: (p) => <Trend12Card transactions={p.transactions} /> },
  net_saved: { label: "Net saved each month", section: "month", render: (p) => <NetSavedCard transactions={p.transactions} /> },
  month_end_projection: { label: "Month-end projection", section: "big", render: (p) => <MonthEndProjectionCard transactions={p.transactions} targets={p.targets} /> },
  net_worth_pro: { label: "Net worth + currency split", section: "big", render: (p) => <NetWorthProCard banks={p.banks} accountData={p.accountData} transactions={p.transactions} /> },
  money_score: { label: "Money score", section: "big", render: (p) => <MoneyScoreCard transactions={p.transactions} targets={p.targets} billExcludes={p.billExcludes} /> },
  goal: { label: "Savings goal", section: "big", render: (p) => <GoalCard goals={p.goals} plan={p.plan} banks={p.banks} accountData={p.accountData} transactions={p.transactions} /> },
  accounts: { label: "Bank accounts", section: "big", render: (p) => <BankAccountsCard banks={p.banks} transactions={p.transactions} accountData={p.accountData} /> },
};


/* ================= Overview V2 tops (staged redesign) ================= */

/* Lets a deeply-nested card ask for a page change without threading setView down
   through every intermediate component. DashboardScreen listens. */
function goToView(v) { window.dispatchEvent(new CustomEvent("mbp-goto", { detail: v })); }

/* ---- Hash routing -------------------------------------------------------
   Keeps the dashboard page in the URL (#/overview, #/transactions, ...) so the
   browser's back/forward buttons work and a refresh lands on the same page.
   Drop-in replacement for useState: every existing setView(...) call now also
   pushes a history entry. */
const ROUTE_KEYS = VIEWS.map((v) => v.key).concat(["settings", "mapping", "ask"]);
function readHashView(fallback) {
  if (typeof window === "undefined") return fallback;
  const raw = (window.location.hash || "").replace(/^#\/?/, "").split("?")[0];
  return ROUTE_KEYS.includes(raw) ? raw : fallback;
}
function writeHashView(v, replace) {
  if (typeof window === "undefined") return;
  const next = "#/" + v;
  if (window.location.hash === next) return;
  const url = window.location.pathname + window.location.search + next;
  if (replace) window.history.replaceState({ mbpView: v }, "", url);
  else window.history.pushState({ mbpView: v }, "", url);
}
function useHashView(initial) {
  const [view, setViewRaw] = React.useState(() => readHashView(initial));
  /* Stamp the starting page into the URL so the first Back press has a target. */
  React.useEffect(() => { writeHashView(readHashView(initial), true); }, []);
  /* Back / forward, and any manual hash edit. */
  React.useEffect(() => {
    const onPop = () => setViewRaw(readHashView(initial));
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onPop);
    return () => { window.removeEventListener("popstate", onPop); window.removeEventListener("hashchange", onPop); };
  }, [initial]);
  const setView = React.useCallback((v) => {
    setViewRaw((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      if (next !== prev) writeHashView(next, false);
      return next;
    });
  }, []);
  return [view, setView];
}

function computePaceV2(s) {
  const day = today().getDate();
  const dim = s.daysInMonth;
  /* Round for display only. Projecting from the ROUNDED £/day multiplied the
     rounding error by the whole month and disagreed with the Insights figure
     (£907 vs £911 on the same data). */
  const paceDayRaw = day > 0 ? s.spent / day : 0;
  const paceDay = Math.round(paceDayRaw);
  const projected = paceDayRaw * dim + s.reserved;
  const rawDiff = s.pot - projected;
  const under = rawDiff >= 0;
  const diff = Math.round(Math.abs(rawDiff));
  const showProj = day >= 5;
  const pw = (v) => Math.min(100, Math.max(0, (v / Math.max(s.pot, 1)) * 100));
  const spentPct = pw(s.spent);
  const resPct = pw(s.reserved);
  const expPct = Math.min(100, Math.max(0, (day / dim) * 100));
  const usedPct = Math.round((s.spent / Math.max(s.pot, 1)) * 100);
  return { day, dim, paceDay, projected, diff, under, showProj, spentPct, resPct, expPct, usedPct };
}

function PaceTileV2({ s, p, pre, post, legendPos }) {
  const pos = legendPos || "caption";
  const legend = (
    <div className={"v2-legend " + (pos === "caption" ? "v2-legend-tr" : pos === "above" ? "v2-legend-above" : "v2-legend-below")}>
      <span><span className="v2-dot" style={{ background: "var(--accent-solid)" }} /> {formatMoney(s.spent)} spent</span>
      <span><span className="v2-dot" style={{ background: "var(--line-strong)" }} /> {formatMoney(Math.max(0, s.free))} free</span>
      {s.reserved > 0 && <span><span className="v2-dot v2-hatch" /> {formatMoney(s.reserved)} bills to come</span>}
    </div>
  );
  return (
    <div className="v2-ptile">
      <div className="v2-ptile-head">
        <span className="v2-lab" style={{ margin: 0 }}>Your pace this month</span>
        <span className={"v2-pill " + (p.under ? "v2-pill-g" : "v2-pill-r")}>{p.under ? "On track" : "Over budget"}</span>
      </div>
      <div className="v2-ptile-big">{formatMoney(s.spent)}<span className="v2-of">of {formatMoney(s.pot)}</span></div>
      <div className="v2-ptile-caprow">
        <div className="v2-ptile-cap">day {p.day} of {p.dim} {"\u00B7"} {s.noDataYet ? "nothing recorded yet" : p.usedPct + "% used"}</div>
        {pos === "caption" && legend}
      </div>
      {s.noDataYet && <p className="v2-fore">No {currentMonthName()} spending recorded yet {"\u2014"} upload your latest statement to be sure.</p>}
      {pre}
      {pos === "above" && legend}
      <div className="v2-pace-wrap">
        <div className="v2-pace-bar">
          <div className="v2-spent" style={{ width: p.spentPct + "%" }} />
          {s.reserved > 0 && <div className="v2-resv" style={{ width: p.resPct + "%" }} />}
        </div>
        <div className="v2-mark" style={{ left: p.expPct + "%" }} />
        <div className="v2-mark-lb" style={{ left: p.expPct + "%" }}><span className="fsr-caret">{"\u25B4"}</span>expected by today</div>
      </div>
      {pos === "below" && legend}
      {post}
    </div>
  );
}

/* Option B for the V2 heroes: the safe-to-spend figure is arithmetically correct
   but derived purely from budget when no spending has been recorded, so it must
   say so next to the number rather than in small grey text further down. */
function NoDataNoteV2({ s }) {
  if (!s || !s.noDataYet) return null;
  return (
    <div className="oh-gapnote oh-gapnote-v2">
      <span className="oh-gapnote-ic"><Icon name="calendar" size={15} /></span>
      <span className="oh-gapnote-tx"><strong>Estimate only.</strong> No {currentMonthName()} spending recorded yet {"\u2014"} this comes from your budget, not from what you{"\u2019"}ve actually spent.</span>
    </div>
  );
}

function FreshStartHeroV2({ targets, transactions, rollovers, billExcludes }) {
  const s = computeSafeToSpend(targets, transactions, rollovers, billExcludes);
  if (s.budget <= 0) return null;
  const p = computePaceV2(s);
  const post = p.showProj ? (
    <p className="v2-fore">You{"\u2019"}ve spent about <b>{formatMoney(p.paceDay)} a day</b> so far. If you stick at {formatMoney(p.paceDay)}/day, you{"\u2019"}ll <span className={"v2-u" + (p.under ? "" : " v2-u-neg")}>{p.under ? "save about " + formatMoney(p.diff) + " more than planned" : "go about " + formatMoney(p.diff) + " over budget"}</span>.</p>
  ) : null;
  return (
    <div className="v2-wrap">
      <div className="v2-hero">
        <span className="v2-lab">Safe to spend {"\u00B7"} {currentMonthName()}</span>
        <div className="v2-big">{formatMoney(s.perDay)}<em>a day</em></div>
        <p className="v2-fs-line">{s.noDataYet ? "That's your budget spread across the days left \u2014 upload " + currentMonthName() + " to see what you've really spent." : "That\u2019s what you can still spend each day for the rest of " + currentMonthName() + " and finish on budget."}</p>
        <NoDataNoteV2 s={s} />
      </div>
      <PaceTileV2 s={s} p={p} post={post} />
    </div>
  );
}

function BudgetHawkHeroV2({ targets, transactions, rollovers, billExcludes }) {
  const s = computeSafeToSpend(targets, transactions, rollovers, billExcludes);
  if (s.budget <= 0) return null;
  const p = computePaceV2(s);
  const pre = p.showProj ? (
    <div className="v2-ledger v2-calc-ledger">
      <div className="v2-ln"><span>Your pace: {formatMoney(s.spent)} {"\u00F7"} {p.day} days</span><span className="v2-dots" /><b>{formatMoney(p.paceDay)}/day</b></div>
      <div className="v2-ln"><span>At {formatMoney(p.paceDay)}/day for {p.dim} days</span><span className="v2-dots" /><b>{formatMoney(p.paceDay * p.dim)}</b></div>
      {s.reserved > 0 && <div className="v2-ln"><span>+ Bills still to come</span><span className="v2-dots" /><b>{formatMoney(s.reserved)}</b></div>}
      <div className="v2-ln"><span>= Projected {currentMonthName()} spend</span><span className="v2-dots" /><b>{formatMoney(p.projected)}</b></div>
      <div className="v2-ln v2-total"><span>{p.under ? "Saved vs" : "Over"} your {formatMoney(s.pot)} plan</span><span className="v2-dots-blank" /><b className={p.under ? "v2-total-pos" : "v2-total-neg"}>{formatMoney(p.diff)}</b></div>
    </div>
  ) : null;
  return (
    <div className="v2-wrap">
      <div className="v2-hero">
        <span className="v2-lab">Safe to spend {"\u00B7"} {currentMonthName()}</span>
        <div className="v2-big" style={{ marginBottom: 6 }}>{formatMoney(s.perDay)}<em>/day</em></div>
        <div className="v2-ledger">
          <div className="v2-ln"><span>Budget this month{s.roll !== 0 ? " (incl. rollover)" : ""}</span><span className="v2-dots" /><b>{formatMoney(s.pot)}</b></div>
          <div className="v2-ln"><span>{"\u2212"} Spent so far</span><span className="v2-dots" /><b>{formatMoney(s.spent)}</b></div>
          {s.reserved > 0 && <div className="v2-ln"><span>{"\u2212"} Bills to come</span><span className="v2-dots" /><b>{formatMoney(s.reserved)}</b></div>}
          <div className="v2-ln"><span>= Left, {"\u00F7"} {s.daysLeft} days remaining</span><span className="v2-dots" /><b>{formatMoney(Math.max(0, s.free))}</b></div>
          <div className="v2-ln v2-total"><span>Can still spend / day</span><span className="v2-dots-blank" /><b>{"\u2248"} {formatMoney(s.perDay)}/day</b></div>
        </div>
        <NoDataNoteV2 s={s} />
      </div>
      <PaceTileV2 s={s} p={p} pre={pre} legendPos="above" />
    </div>
  );
}

function PowerViewHeroV2({ targets, transactions, rollovers, billExcludes }) {
  const s = computeSafeToSpend(targets, transactions, rollovers, billExcludes);
  if (s.budget <= 0) return null;
  const p = computePaceV2(s);
  const post = p.showProj ? (
    <p className="v2-fore">You{"\u2019"}ve spent about <b>{formatMoney(p.paceDay)}/day</b> so far. If you stick at {formatMoney(p.paceDay)}/day, you{"\u2019"}ll finish about <span className={"v2-u" + (p.under ? "" : " v2-u-neg")}>{formatMoney(p.diff)} {p.under ? "under" : "over"} your {formatMoney(s.pot)} budget</span>.</p>
  ) : null;
  return (
    <div className="v2-wrap">
      <div className="v2-hero">
        <span className="v2-lab">Safe to spend {"\u00B7"} {currentMonthName()}</span>
        <div className="v2-pv">
          <div className="v2-pvk"><div className="v2-pvk-k">Can still spend / day</div><div className="v2-pvk-v">{formatMoney(s.perDay)}</div><div className="v2-pvk-s">{formatMoney(Math.max(0, s.free))} left {"\u00F7"} {s.daysLeft} days</div></div>
          <div className="v2-pvk"><div className="v2-pvk-k">Spent / day so far</div><div className="v2-pvk-v">{formatMoney(p.paceDay)}</div><div className="v2-pvk-s">{formatMoney(s.spent)} {"\u00F7"} {p.day} days</div></div>
        </div>
        <NoDataNoteV2 s={s} />
      </div>
      <PaceTileV2 s={s} p={p} post={post} />
    </div>
  );
}

function GoalGetterHeroV2(props) {
  const { targets, transactions, rollovers, billExcludes, goals, plan, banks, accountData } = props;
  const s = computeSafeToSpend(targets, transactions, rollovers, billExcludes);
  const target = plan && plan.targetBalance > 0 ? plan.targetBalance : (goals && goals.length ? goals[0].target : 0);
  const targetMonth = plan && plan.targetMonth ? plan.targetMonth : null;
  if (target <= 0) return <FreshStartHeroV2 targets={targets} transactions={transactions} rollovers={rollovers} billExcludes={billExcludes} />;
  const nw = totalEstimatedBalance(banks, accountData, transactions || []);
  const saved = Math.max(0, nw !== null ? nw : (goals && goals.length ? goals[0].saved : 0));
  const toGo = Math.max(0, target - saved);
  const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
  const targetDateStr = targetMonth ? (monthLabelFromKey(targetMonth).slice(0, 3) + " " + targetMonth.slice(0, 4)) : null;
  const proj = goalProjection({ target, saved }, transactions);
  const targetDateObj = targetMonth ? new Date(Number(targetMonth.slice(0, 4)), Number(targetMonth.slice(5, 7)), 0) : null;
  const onTrack = proj && proj.projected && targetDateObj ? proj.projected <= targetDateObj : true;
  const p = computePaceV2(s);
  const post = (s.budget > 0 && p.showProj) ? (
    <p className="v2-fore">You{"\u2019"}ve spent about <b>{formatMoney(p.paceDay)}/day</b> so far. If you stick at {formatMoney(p.paceDay)}/day, that ~<span className={"v2-u" + (p.under ? "" : " v2-u-neg")}>{formatMoney(p.diff)} {p.under ? "underspend" : "overspend"}</span> {p.under ? "goes toward" : "comes off"} your {formatMoney(target)} goal.</p>
  ) : null;
  return (
    <div className="v2-wrap">
      <div className="v2-hero">
        <div className="v2-gg-head"><span className="v2-lab">Your {formatMoney(target)} goal</span><span className="v2-gg-pct">{pct}% there</span></div>
        <div className="v2-gg-togo">{formatMoney(toGo)}<em>to go</em></div>
        <div className="v2-gg-bar"><div className="v2-gg-fill" style={{ width: pct + "%" }} /></div>
        <div className="v2-gg-scale"><span><b>{formatMoney(saved)}</b> saved</span><span>{formatMoney(target)}</span></div>
        {targetDateStr && onTrack && <div className="v2-gg-note">{"\uD83C\uDFAF"} On track for your {formatMoney(target)} by {targetDateStr}</div>}
        {targetDateStr && !onTrack && <div className="v2-gg-note v2-gg-note-warn">Lift your pace to reach your {formatMoney(target)} by {targetDateStr}</div>}
        {s.budget > 0 && <div className="v2-gg-second"><span className="v2-lab">Safe to spend {"\u00B7"} {currentMonthName()}</span><span className="v2-gg-safe">{formatMoney(s.perDay)}<em>/day</em></span></div>}
        {s.budget > 0 && <NoDataNoteV2 s={s} />}
      </div>
      {s.budget > 0 && <PaceTileV2 s={s} p={p} post={post} />}
    </div>
  );
}


function CompositionCardV2({ transactions, depth }) {
  const k = currentMonthKey();
  const cats = spendByCategoryForMonth(transactions || [], k);
  const entries = Object.entries(cats).filter(([c, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, e) => s + e[1], 0);
  if (!total) return (<div className="glass-card dash-card"><span className="card-label">Where it's gone</span><div className="oh-sub" style={{ marginTop: 8 }}>No spending yet this month.</div></div>);
  const pctOf = (v) => Math.round((v / total) * 100);
  const topName = displayCat(entries[0][0]);
  const topPct = pctOf(entries[0][1]);

  if (depth === "compact") {
    const top = entries.slice(0, 4);
    const otherTotal = entries.slice(4).reduce((s, e) => s + e[1], 0);
    const seg = top.map(([c, v]) => ({ label: displayCat(c), v, color: catColor(c) }));
    if (otherTotal > 0) seg.push({ label: "Other", v: otherTotal, color: "#9aa4b8" });
    let acc = 0;
    const stops = seg.map((sg) => { const start = (acc / total) * 100; acc += sg.v; const end = (acc / total) * 100; return sg.color + " " + start + "% " + end + "%"; }).join(", ");
    const twoSum = entries.slice(0, 2).reduce((s, e) => s + e[1], 0);
    const foot = entries.length >= 2
      ? displayCat(entries[0][0]) + " and " + displayCat(entries[1][0]) + " make up " + Math.round((twoSum / total) * 100) + "% of your spend."
      : displayCat(entries[0][0]) + " is all of your spend so far.";
    return (
      <div className="glass-card dash-card v2wg">
        <div className="v2wg-head"><span className="card-label" style={{ margin: 0 }}>Where it's gone</span><span className="v2wg-ctx">% = share of total spend</span></div>
        <div className="v2wg-compact">
          <div className="v2wg-donut" style={{ background: "conic-gradient(" + stops + ")" }}>
            <div className="v2wg-hole"><span className="v2wg-amt">{formatMoney(total)}</span><span className="v2wg-lb">SPENT</span></div>
          </div>
          <div className="v2wg-leg">
            {(() => { const lp = sharePercents(seg.map((sg) => sg.v), total); return seg.map((sg, i) => (
              <React.Fragment key={i}>
                <span className="v2wg-nm"><span className="v2wg-dot" style={{ background: sg.color }} />{sg.label}</span>
                <span className="v2wg-v">{formatMoney(sg.v)}</span>
                <span className="v2wg-p">{lp[i]}%</span>
              </React.Fragment>
            )); })()}
          </div>
        </div>
        <div className="v2wg-foot">{foot}</div>
      </div>
    );
  }

  const maxV = entries[0][1] || 1;
  /* Whole-column rounding so the % values sum to exactly 100. */
  const rowPcts = sharePercents(entries.map((e) => e[1]), total);
  return (
    <div className="glass-card dash-card v2wg">
      <div className="v2wg-head"><span className="card-label" style={{ margin: 0 }}>Where it's gone</span><span className="v2wg-ctx">{formatMoney(total)} this month</span></div>
      <div className="v2wg-cap">bar = size vs biggest {"\u00B7"} % = share of total</div>
      <div className="v2wg-rows">
        {entries.map(([c, v], i) => (
          <div className="v2wg-row" key={c}>
            <span className="v2wg-nm"><span className="v2wg-dot" style={{ background: catColor(c) }} />{displayCat(c)}</span>
            <div className="v2wg-bar"><i style={{ width: Math.max(4, (v / maxV) * 100) + "%", background: catColor(c) }} /></div>
            <span className="v2wg-amt">{formatMoney(v)}</span>
            <span className="v2wg-pc">{rowPcts[i]}%</span>
          </div>
        ))}
      </div>
      <div className="v2wg-foot">{topName} is your biggest at {topPct}% of spend.</div>
    </div>
  );
}

function PacingVsTargetV2({ transactions, targets, depth }) {
  /* Pace is a "right now" question, so it must key off the real current month.
     Using the with-data fallback showed the previous month's spend against this
     month's target on this month's clock. */
  const key = currentMonthKey();
  const isCurrentMonth = true;
  const cats = spendByCategoryForMonth(transactions || [], key);
  const day = today().getDate(), dim = daysInCurrentMonth();
  const elapsed = day / dim;
  const rows = TX_CATEGORIES.map((c) => ({ c, spent: cats[c] || 0, target: Number((targets || {})[c]) || 0 })).filter((r) => r.target > 0);
  if (!rows.length) return (<div className="glass-card dash-card"><span className="card-label">Category vs target</span><div className="oh-sub" style={{ marginTop: 8 }}>Set targets to compare against.</div></div>);
  const tickPct = Math.round(elapsed * 100);
  const enrich = rows.map((r) => {
    const expected = r.target * elapsed;
    const over = r.spent - expected > 0.5;
    const delta = Math.round(Math.abs(r.spent - expected));
    const fill = r.spent > 0 ? Math.max(2, Math.min(100, (r.spent / r.target) * 100)) : 0;
    return { ...r, expected, over, delta, fill };
  });
  const overs = enrich.filter((r) => r.over);
  const onTrackN = enrich.length - overs.length;
  const netUnder = Math.round(enrich.reduce((s, r) => s + (r.expected - r.spent), 0));
  const overNames = overs.map((r) => displayCat(r.c));
  const aheadPhrase = isCurrentMonth
    ? (overs.length === 0 ? "every category is under its day-" + day + " pace"
      : overs.length === 1 ? "only " + overNames[0] + " is running ahead"
      : overNames.length + " categories are running ahead")
    : (overs.length === 0 ? "every category came in under target"
      : overs.length === 1 ? "only " + overNames[0] + " went over target"
      : overNames.length + " categories went over target");

  if (depth === "chips") {
    return (
      <div className="glass-card dash-card">
        <span className="card-label">How each budget is doing</span>
        <div className="v2pt-rows" style={{ marginTop: 14 }}>
          {enrich.map((r) => (
            <div className="v2pt-row v2pt-chips" key={r.c}>
              <span className="v2pt-nm"><span className="v2-dotc" style={{ background: catColor(r.c) }} />{displayCat(r.c)}</span>
              <div className="v2pt-track"><i style={{ width: r.fill + "%", background: catColor(r.c) }} /></div>
              <span className="v2pt-val">{formatMoney(Math.round(r.spent))} / {formatMoney(Math.round(r.target))}</span>
              <span className={"v2pt-chip " + (r.over ? "v2pt-over" : "v2pt-ok")}>{r.over ? (isCurrentMonth ? "over pace" : "over") : (isCurrentMonth ? "on track" : "under")}</span>
            </div>
          ))}
        </div>
        <div className="v2wg-foot"><strong>{onTrackN} of {enrich.length}</strong> budget{enrich.length !== 1 ? "s" : ""} {isCurrentMonth ? "on track" : "under target"}{overs.length ? " — just " + overNames.join(", ") + (isCurrentMonth ? " running a little fast." : " over.") : (isCurrentMonth ? " — nothing running ahead of pace." : " — nothing over target.")}</div>
      </div>
    );
  }

  if (depth === "full") {
    return (
      <div className="glass-card dash-card">
        <span className="card-label">Category vs target</span>
        <div className="v2pt-cap">{isCurrentMonth ? <>bar fills to target · <span className="v2pt-tk">tick = day-{day} pace ({tickPct}%)</span></> : <>bar fills to target · full month</>}</div>
        <div className="v2pt-rows">
          {enrich.map((r) => (
            <div className="v2pt-row v2pt-full" key={r.c}>
              <span className="v2pt-nm"><span className="v2-dotc" style={{ background: catColor(r.c) }} />{displayCat(r.c)}</span>
              <div className="v2pt-track"><i style={{ width: r.fill + "%", background: catColor(r.c) }} />{isCurrentMonth && <span className="v2pt-tick" style={{ left: tickPct + "%" }} />}</div>
              <span className="v2pt-st"><strong>{formatMoney(Math.round(r.spent))}</strong> / {formatMoney(Math.round(r.target))}</span>
              <span className={"v2pt-dd " + (r.over ? "v2-bad" : "v2-good")}>{formatMoney(r.delta)} {r.over ? "over" : "under"}</span>
            </div>
          ))}
        </div>
        <div className="v2wg-foot">{isCurrentMonth
          ? (overs.length === 0 ? "Every category is left of the pace tick — tracking under where you'd expect by day " + day + "." : (overs.length === 1 ? "Only " + overNames[0] + " is past the pace tick" : overNames.join(", ") + " are past the pace tick") + " — everything else is tracking under.")
          : (overs.length === 0 ? "Every category came in under target this month." : (overs.length === 1 ? "Only " + overNames[0] + " went over target" : overNames.join(", ") + " went over target") + " — everything else came in under.")}</div>
      </div>
    );
  }

  const goal = depth === "simple_goal";
  return (
    <div className="glass-card dash-card">
      <span className="card-label">{goal ? "Staying inside your budgets" : "Pacing vs target"}</span>
      <div className="v2pt-rows" style={{ marginTop: 14 }}>
        {enrich.map((r) => (
          <div className="v2pt-row" key={r.c}>
            <span className="v2pt-nm"><span className="v2-dotc" style={{ background: catColor(r.c) }} />{displayCat(r.c)}</span>
            <div className="v2pt-track"><i style={{ width: r.fill + "%", background: catColor(r.c) }} /></div>
            <span className="v2pt-val"><strong>{formatMoney(Math.round(r.spent))}</strong> / {formatMoney(Math.round(r.target))}</span>
          </div>
        ))}
      </div>
      <div className="v2wg-foot">You're <strong className={netUnder >= 0 ? "v2-good" : "v2-bad"}>{formatMoney(Math.abs(netUnder))} {netUnder >= 0 ? "under" : "over"}</strong> {isCurrentMonth ? "your day-" + day + " pace" : "your targets"} — {goal ? (netUnder >= 0 ? "that underspend is heading toward your goal" : "worth easing off to keep the goal on track") : aheadPhrase}.</div>
    </div>
  );
}

function titleCaseBill(name) {
  const KEEP_UP = ["DD", "UK", "US", "EU", "UAE", "USA", "LLC", "PLC", "VAT"];
  return String(name || "").toLowerCase().split(" ").map((w) => KEEP_UP.includes(w.toUpperCase()) ? w.toUpperCase() : (w.charAt(0).toUpperCase() + w.slice(1))).join(" ");
}

function BillsV2({ transactions, billExcludes, depth }) {
  const bills = remainingBillsThisMonth(transactions, billExcludes).slice();
  const rank = (b) => b.paid ? 2 : (!b.upcoming ? 0 : 1);
  bills.sort((a, b) => rank(a) - rank(b) || (a.dueDay || 31) - (b.dueDay || 31));
  if (!bills.length) return (<div className="glass-card dash-card"><span className="card-label">Bills this month</span><div className="oh-sub" style={{ marginTop: 8 }}>Nothing's a bill until you say so {"\u2014"} pick your regular payments and they'll show up here.</div><button className="link-btn inline" style={{ marginTop: 10 }} onClick={() => goToView("bills")}>Choose your bills {"\u203A"}</button></div>);
  const monthly = bills.reduce((s, b) => s + b.amount, 0);
  const overdue = bills.filter((b) => !b.paid && !b.upcoming).reduce((s, b) => s + b.amount, 0);
  const upcoming = bills.filter((b) => !b.paid && b.upcoming).reduce((s, b) => s + b.amount, 0);
  const paid = bills.filter((b) => b.paid).reduce((s, b) => s + b.amount, 0);
  const toLeave = overdue + upcoming;
  const todayDay = today().getDate();
  const next7 = bills.filter((b) => b.upcoming && b.dueDay <= todayDay + 7).sort((a, b) => a.dueDay - b.dueDay);
  const biggest = bills.slice().sort((a, b) => b.amount - a.amount)[0];

  let foot = null, extra = null;
  if (depth === "plain") {
    foot = overdue > 0
      ? <span><strong className="v2-bad">{formatMoney(overdue)} is overdue</strong> — worth paying soon. {formatMoney(upcoming)} more still to come this month.</span>
      : upcoming > 0 ? <span>{formatMoney(upcoming)} still to come this month.</span>
      : <span>All paid — you're clear for {currentMonthName()}.</span>;
  } else if (depth === "detailed") {
    foot = <span>{overdue > 0 ? <><strong className="v2-bad">{formatMoney(overdue)} overdue</strong> · </> : null}{formatMoney(upcoming)} still to come · {formatMoney(paid)} paid.</span>;
    if (next7.length) extra = <div className="v2-blnext"><strong>Next 7 days:</strong> {next7.map((b) => b.name + " " + formatMoney(b.amount) + " (" + b.due + ")").join(", ")}.</div>;
  } else if (depth === "analytical") {
    const pctLeave = monthly > 0 ? Math.round((toLeave / monthly) * 100) : 0;
    const pctBig = monthly > 0 ? Math.round((biggest.amount / monthly) * 100) : 0;
    foot = <span><strong>{formatMoney(toLeave)} of {formatMoney(monthly)} ({pctLeave}%)</strong> still to leave{overdue > 0 ? " · " + formatMoney(overdue) + " overdue" : ""} · {pctBig}% is {titleCaseBill(biggest.name)}.</span>;
  }

  return (
    <div className="glass-card dash-card">
      <div className="v2wg-head"><span className="card-label" style={{ margin: 0 }}>Bills this month</span><span className="v2wg-ctx">{formatMoney(monthly)} total</span></div>
      <div className="v2-bl">
        {bills.map((b, i) => {
          const od = !b.paid && !b.upcoming;
          return (
            <div className={"v2-blrow" + (b.paid ? " v2-bl-paid" : "")} key={i}>
              {b.paid
                ? <span className="v2-bdot v2-bd-tick"><Icon name="check" size={8} strokeWidth={4} /></span>
                : <span className={"v2-bdot " + (od ? "v2-bd-od" : "v2-bd-up")} />}
              <span className="v2-bnm">{titleCaseBill(b.name)}{b.paid ? <span className="v2-bpaid">Paid</span> : od ? <span className="v2-bmeta-od"> · overdue</span> : <span className="v2-bmeta"> · due {b.due}</span>}</span>
              <span className={"v2-bamt" + (od ? " v2-bamt-od" : "")}>{formatMoney(b.amount)}</span>
            </div>
          );
        })}
      </div>
      {depth === "goal"
        ? <div className="v2wg-foot"><strong>{formatMoney(toLeave)} still needs to leave</strong> for bills — whatever's left after that is free to move toward your goal.</div>
        : <div className="v2wg-foot">{foot}</div>}
      {extra}
    </div>
  );
}

function TopMerchantsV2({ transactions, depth }) {
  const key = currentMonthKey();
  const txs = (transactions || []).filter((t) => t.amount < 0 && t.date && t.date.slice(0, 7) === key);
  const norm = (n) => String(n || "Unknown").toLowerCase().replace(/\d+/g, "").replace(/\s+/g, " ").trim() || "unknown";
  const by = {};
  txs.forEach((t) => {
    const kk = norm(t.name);
    const a = Math.abs(t.amount);
    if (!by[kk]) by[kk] = { amt: 0, disp: t.name || "Unknown", dispAmt: 0, cats: {} };
    by[kk].amt += a;
    by[kk].cats[t.category] = (by[kk].cats[t.category] || 0) + a;
    if (a > by[kk].dispAmt) { by[kk].dispAmt = a; by[kk].disp = t.name || "Unknown"; }
  });
  const all = Object.values(by).map((g) => ({ disp: g.disp, amt: g.amt, cat: (Object.entries(g.cats).sort((a, b) => b[1] - a[1])[0] || ["Uncategorized"])[0] })).sort((a, b) => b.amt - a.amt);
  const total = all.reduce((s, r) => s + r.amt, 0);
  if (!all.length) return (<div className="glass-card dash-card"><span className="card-label">Top merchants</span><div className="oh-sub" style={{ marginTop: 8 }}>No spending yet this month.</div></div>);
  const top = all.slice(0, 3);
  const conc = Math.round((top.reduce((s, r) => s + r.amt, 0) / Math.max(total, 1)) * 100);
  const maxAmt = top[0].amt || 1;

  let foot = null;
  if (depth === "plain") foot = <span>{top[0].disp} was your biggest this month, at {formatMoney(top[0].amt)}.</span>;
  else if (depth === "detailed") foot = <span>Your top {top.length} merchants are <strong>{formatMoney(top.reduce((s, r) => s + r.amt, 0))}</strong> — {conc}% of your spend this month.</span>;
  else if (depth === "analytical") foot = <span>Your top {top.length} merchants account for <strong>{conc}%</strong> of spend this month.</span>;

  return (
    <div className="glass-card dash-card">
      <div className="v2wg-head"><span className="card-label" style={{ margin: 0 }}>Top merchants</span><span className="v2wg-ctx">top {top.length} = {conc}% of spend</span></div>
      <div className="v2-mm">
        {top.map((r, i) => (
          <div className="v2-mmrow" key={i}>
            <div className="v2-mmtop"><span className="v2-mmnm"><span className="v2-dotc" style={{ background: catColor(r.cat) }} />{r.disp}</span><span className="v2-mmv">{formatMoney(r.amt)}</span></div>
            <div className="v2-mmbar"><i style={{ width: Math.max(6, (r.amt / maxAmt) * 100) + "%", background: catColor(r.cat) }} /></div>
          </div>
        ))}
      </div>
      {depth === "goal"
        ? <div className="v2wg-foot">Easing back on your top few merchants is the quickest way to free up more for your goal.</div>
        : <div className="v2wg-foot">{foot}</div>}
    </div>
  );
}

/* Only ever rendered blurred, behind the "set your targets" veil — gives the
   locked card a realistic shape instead of an empty one. Never shown as fact. */
const PREVIEW_TARGETS = { Groceries: 400, Dining: 200, Transport: 120, Shopping: 150, Subscriptions: 50, Bills: 600, Entertainment: 100 };
const V2_DEPTHS = {
  fresh_start: { comp: "compact", pace: "chips", bills: "plain", merch: "plain" },
  goal_getter: { comp: "compact", pace: "simple_goal", bills: "goal", merch: "goal" },
  budget_hawk: { comp: "compact", pace: "full", bills: "detailed", merch: "detailed" },
  power_view: { comp: "compact", pace: "simple", bills: "analytical", merch: "analytical" },
};

/* Wraps a card that can't work yet, blurring it behind a single prompt. Showing
   the real thing underneath (rather than an empty state) makes it obvious what
   setting targets unlocks. */
function LockedCard({ children, onUnlock }) {
  return (
    <div className="lockw">
      <div className="lockw-under" aria-hidden="true">{children}</div>
      <div className="lockw-veil">
        <span className="lockw-ic"><Icon name="sliders" size={18} /></span>
        <p className="lockw-t">Set your targets to unlock this</p>
        <button className="glass-btn primary lockw-btn" onClick={onUnlock}>Set targets</button>
      </div>
    </div>
  );
}
function ThisMonthV2({ persona, transactions, targets, billExcludes, onResumeSetup }) {
  const d = V2_DEPTHS[persona] || V2_DEPTHS.budget_hawk;
  /* The "Default (no targets)" persona is a view switch and doesn't wipe saved
     targets, so checking the data alone meant the locked state was unreachable. */
  const hasTargets = persona !== "no_targets" && TX_CATEGORIES.some((c) => Number((targets || {})[c]) > 0);
  const unlock = () => (onResumeSetup ? onResumeSetup() : goToView("targets"));
  return (
    <div className="oh-grid oh-grid-v2">
      <div className="oh-grid-cell"><CompositionCardV2 transactions={transactions} depth={d.comp} /></div>
      <div className="oh-grid-cell">
        {hasTargets
          ? <PacingVsTargetV2 transactions={transactions} targets={targets} depth={d.pace} />
          : <LockedCard onUnlock={unlock}><PacingVsTargetV2 transactions={transactions} targets={PREVIEW_TARGETS} depth={d.pace} /></LockedCard>}
      </div>
      <div className="oh-grid-cell"><BillsV2 transactions={transactions} billExcludes={billExcludes} depth={d.bills} /></div>
      <div className="oh-grid-cell"><TopMerchantsV2 transactions={transactions} depth={d.merch} /></div>
    </div>
  );
}

/* Option A: everything that nags collapses into a single pill placed BELOW the
   hero, so the first thing on screen is always a number. Expanding the pill
   reveals the same rows that used to sit above the fold. */
function NeedsPill({ items, expanded, onToggle }) {
  if (!items || items.length === 0) return null;
  const n = items.length;
  return (
    <div className="oh-needs-wrap">
      <button className="oh-needs-pill" onClick={onToggle} aria-expanded={expanded}>
        <span className="oh-needs-pill-ic"><Icon name="bell" size={15} /></span>
        <span className="oh-needs-pill-tx">{n} thing{n !== 1 ? "s" : ""} need{n === 1 ? "s" : ""} you</span>
        <span className="oh-needs-pill-cta">{expanded ? "Hide" : "View"} <span className={"oh-needs-chev" + (expanded ? " oh-needs-chev-open" : "")}>{"\u203A"}</span></span>
      </button>
      {expanded && (
        <div className="oh-needs oh-needs-open">
          {items.map((n2, i) => (
            <div className="oh-need" key={i}>
              <span className="oh-need-ic" style={{ color: n2.color }}><Icon name={n2.icon} size={17} /></span>
              <span className="oh-need-text">{n2.text}</span>
              {n2.action && <button className="oh-need-cta" onClick={n2.action}>{n2.cta} {"\u203A"}</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OverviewHome({ name, targets, transactions, rollovers, banks, accountData, goals, billExcludes, uncatCount, onOpenCatReview, runTour, tourStep, hasData, homeLayout, onChangeHomeLayout, onResumeSetup, persona, plan, onOpenUpload, billsNudge, onOpenBillsSetup, onDismissBillsNudge }) {
  const key = currentMonthKey();
  const txs = transactions || [];
  const lk = txs.length ? latestMonthKey(txs) : null;
  /* Option B: the greeting always names the CURRENT month. It used to name the
     latest month with data, which meant it said "here's how Jun went" while the
     divider underneath said July and the hero showed a July figure. The month
     shown must never lag behind the calendar; the missing data is flagged
     instead of being papered over by silently rewinding the month. */
  const greetLine = "here's how " + currentMonthName() + " is looking";

  const layout = homeLayout || DEFAULT_HOME_LAYOUT;
  const widgetProps = { transactions, banks, accountData, goals, billExcludes, targets, plan, rollovers, persona };
  const totalBudget = TX_CATEGORIES.reduce((s, c) => s + (Number((targets || {})[c]) || 0), 0);
  const noBudget = totalBudget <= 0 || persona === "no_targets";

  const [needsOpen, setNeedsOpen] = useState(false);
  /* One list feeds the single pill. The data gap and the bills nudge used to be
     separate banners stacked above the hero; they are the same kind of thing as
     "Needs you", so they join it rather than pushing the number down. */
  const gapDays = dataGapDays(transactions);
  const needs = [];
  if (uncatCount > 0) needs.push({ icon: "tag", color: "var(--accent)", text: uncatCount + " transaction" + (uncatCount !== 1 ? "s need" : " needs") + " a category", cta: "Review", action: onOpenCatReview });
  if (gapDays != null && gapDays >= 3 && onOpenUpload) needs.push({ icon: "calendar", color: "#B26A00", text: "Missing the last " + gapDays + " days of data", cta: "Upload", action: onOpenUpload });
  if (billsNudge > 0 && onOpenBillsSetup) needs.push({ icon: "bills", color: "var(--accent)", text: "We spotted " + billsNudge + " regular payment" + (billsNudge !== 1 ? "s" : "") + " to set up", cta: "Review", action: onOpenBillsSetup });
  const showNeeds = runTour || needs.length > 0;

  if (!hasData && !runTour) {
    return (
      <div className="oh">
        <div className="overview-greeting">Hi {name || "there"}, {greetLine}{"\u2026"}</div>
        <EmptyState text="Upload a statement to see your overview." />
      </div>
    );
  }

  return (
    <div className="oh">
      <div className="oh-greet-row">
        <div className="overview-greeting" style={{ margin: 0 }}>Hi {name || "there"}, {greetLine}{"\u2026"}</div>
      </div>

      <div className="oh-sec"><span>This month</span><span className="oh-sec-ctx">{currentMonthName()} {"·"} day {today().getDate()} of {daysInCurrentMonth()}</span><div className="oh-rule" /></div>

      {/* Option 2: the pill sits between the divider and the hero. This is above the
          persona branch on purpose, so all five heroes get the identical treatment
          and it can never fall below the fold on a tall hero like Goal Getter. */}
      {showNeeds && (!runTour || tourStep >= 3) && (
        <TourTarget active={runTour && tourStep === 3}>
          <NeedsPill items={needs} expanded={needsOpen || (runTour && tourStep === 3)} onToggle={() => setNeedsOpen((v) => !v)} />
        </TourTarget>
      )}

      <TourTarget active={runTour && tourStep === 0}>
        {noBudget ? (
          <>
            <InsightPill transactions={transactions} targets={targets} />
            <SpentSoFarHero transactions={transactions} onOpenUpload={onOpenUpload} />
            <SetupPushBand onResumeSetup={onResumeSetup} />
          </>
        ) : (
          <>
            {persona === "fresh_start"
              ? <FreshStartHeroV2 targets={targets} transactions={transactions} rollovers={rollovers} billExcludes={billExcludes} />
              : persona === "goal_getter"
              ? <GoalGetterHeroV2 targets={targets} transactions={transactions} rollovers={rollovers} billExcludes={billExcludes} goals={goals} plan={plan} banks={banks} accountData={accountData} />
              : persona === "budget_hawk"
              ? <BudgetHawkHeroV2 targets={targets} transactions={transactions} rollovers={rollovers} billExcludes={billExcludes} />
              : persona === "power_view"
              ? <PowerViewHeroV2 targets={targets} transactions={transactions} rollovers={rollovers} billExcludes={billExcludes} />
              : <SafeToSpendHero targets={targets} transactions={transactions} rollovers={rollovers} billExcludes={billExcludes} />}
            <InsightPill transactions={transactions} targets={targets} />
          </>
        )}
      </TourTarget>

      {(!runTour || tourStep >= 1) && (
        <TourTarget active={runTour && tourStep === 1}>
          <ThisMonthV2 persona={persona} transactions={transactions} targets={targets} billExcludes={billExcludes} onResumeSetup={onResumeSetup} />
        </TourTarget>
      )}

      {(!runTour || tourStep >= 2) && (
        <>
          <div className="oh-sec"><span>The big picture</span><div className="oh-rule" /></div>
          <TourTarget active={runTour && tourStep === 2}>
            <div className="oh-grid">
              {["net_worth", "goal_ring"].map((k) => (
                <div className="oh-grid-cell" key={k}>{HOME_WIDGETS[k].render(widgetProps)}</div>
              ))}
            </div>
          </TourTarget>
        </>
      )}
    </div>
  );
}

function UncatBanner({ count, onSort, label }) {
  const [hidden, setHidden] = useState(false);
  if (!count || hidden) return null;
  return (
    <div className="catrev-banner uncat-banner-block">
      <span className="catrev-banner-text"><Icon name="tag" size={13} /> <strong>{count}</strong> transaction{count !== 1 ? "s" : ""} {label || (count !== 1 ? "still need a category" : "still needs a category")} {"—"} still counted in your spending, just not assigned to a category yet.</span>
      <div className="catrev-banner-actions">
        <button className="catrev-banner-btn" onClick={onSort}>Sort now</button>
        <button className="catrev-banner-later" onClick={() => setHidden(true)}>Later</button>
      </div>
    </div>
  );
}

function computeSafeToSpend(targets, transactions, rollovers, billExcludes) {
  /* Always the real current month, never the with-data fallback: this card is
     "how am I doing right now", so an empty month means zero spent so far, not
     "show me the last month that had data". */
  const key = currentMonthKey();
  const budget = TX_CATEGORIES.reduce((s, c) => s + (Number((targets || {})[c]) || 0), 0);
  const roll = rolloverForMonth(rollovers, key);
  const spent = spendForMonth(transactions || [], key);
  const reserved = remainingBillsThisMonth(transactions, billExcludes).filter((b) => b.upcoming).reduce((s, b) => s + b.amount, 0);
  const pot = budget + roll;
  const free = pot - spent - reserved;
  const now = today();
  /* The day-count must come from the month being SHOWN, not from today. When the
     overview falls back to an earlier month (gap months), pairing that month's
     spend with today's date produced a nonsense pace / safe-to-spend figure. */
  const isCurrent = key === currentMonthKey();
  const daysInMonth = new Date(+key.slice(0, 4), +key.slice(5, 7), 0).getDate();
  const dayOfMonth = isCurrent ? now.getDate() : daysInMonth;
  const daysLeft = isCurrent ? Math.max(1, daysInMonth - dayOfMonth + 1) : 0;
  const over = free < 0;
  const perDay = (over || !isCurrent) ? 0 : Math.floor(free / daysLeft);
  /* Part-way through a month with nothing recorded almost always means the
     latest statement hasn't been uploaded, not that nothing was spent. The
     per-day figure is arithmetically right but reads as optimistic, so flag
     what it rests on. */
  const noDataYet = spent <= 0 && dayOfMonth > 3;
  return { key, budget, roll, spent, reserved, pot, free, daysLeft, daysInMonth, dayOfMonth, isCurrent, over, perDay, noDataYet };
}

function SafeToSpendHero({ targets, transactions, rollovers, billExcludes }) {
  const s = computeSafeToSpend(targets, transactions, rollovers, billExcludes);
  if (s.budget <= 0) return null;
  const { spent, reserved, pot, free, daysLeft, over, perDay, roll } = s;
  const pw = (v) => Math.min(100, Math.max(0, (v / Math.max(pot, 1)) * 100));
  const spentPct = pw(spent), resPct = pw(reserved);
  const noDataYet = s.noDataYet;
  return (
    <div className="safe-hero">
      <div className="safe-hero-row">
        <div className="safe-hero-main">
          <span className="safe-hero-label">Safe to spend today</span>
          <span className={"safe-hero-num" + (over ? " safe-hero-over" : "")}><CountUp value={perDay} format={formatMoney} /></span>
        </div>
        <div className="safe-hero-side">
          {over
            ? <span className="safe-hero-overtext">{formatMoney(Math.abs(free))} over budget this month{reserved > 0 ? " (incl. bills to come)" : ""}</span>
            : <span>{formatMoney(free)} free {"·"} {daysLeft} day{daysLeft !== 1 ? "s" : ""} to go</span>}
          {reserved > 0 && <span className="safe-hero-roll">{formatMoney(reserved)} bills set aside</span>}
          {roll !== 0 && <span className="safe-hero-roll">{roll < 0 ? "after " + formatMoney(Math.abs(roll)) + " rollover" : "incl. " + formatMoney(roll) + " rollover"}</span>}

        </div>
      </div>
      {noDataYet && (
        <div className="oh-gapnote">
          <span className="oh-gapnote-ic"><Icon name="calendar" size={15} /></span>
          <span className="oh-gapnote-tx"><strong>Estimate only.</strong> No {currentMonthName()} spending recorded yet {"\u2014"} this is based on your budget, not on what you've actually spent.</span>
        </div>
      )}
      {!over && (
        <>
          <div className="safe-hero-track safe-hero-seg">
            <div className="seg-spent" style={{ width: spentPct + "%" }} />
            <div className="seg-reserved" style={{ width: resPct + "%" }} />
          </div>
          <div className="safe-hero-legend">
            <span><span className="seg-dot seg-dot-spent" /> {formatMoney(spent)} spent</span>
            {reserved > 0 && <span><span className="seg-dot seg-dot-res" /> {formatMoney(reserved)} bills set aside</span>}
            <span><span className="seg-dot seg-dot-free" /> {formatMoney(Math.max(0, free))} free</span>
          </div>
        </>
      )}
    </div>
  );
}

