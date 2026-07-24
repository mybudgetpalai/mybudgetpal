function TopBar({ onToggleMenu, name, onOpenSettings, onOpenMapping, onOpenCategories, onLogout, onOpenUpload, onGoHome, onOpenAsk, tasks, dataGap, isAdmin, onOpenAdmin, tourSpot }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const menuRef = React.useRef(null);
  const inboxRef = React.useRef(null);
  React.useEffect(() => {
    if (!menuOpen) return;
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("pointerdown", h);
    return () => document.removeEventListener("pointerdown", h);
  }, [menuOpen]);
  React.useEffect(() => {
    if (!inboxOpen) return;
    const h = (e) => { if (inboxRef.current && !inboxRef.current.contains(e.target)) setInboxOpen(false); };
    document.addEventListener("pointerdown", h);
    return () => document.removeEventListener("pointerdown", h);
  }, [inboxOpen]);
  const taskList = tasks || [];
  const initial = (name[0] || "?").toUpperCase();
  return (
    <div className={"topbar" + (tourSpot === "upload" || tourSpot === "inbox" ? " topbar-tour-lift" : "")}>
      <div className="topbar-left">
        <button className="icon-btn" onClick={onToggleMenu} aria-label="Toggle menu"><span className="hamburger" /></button>
        <div className="brand brand-clickable" role="button" tabIndex={0} onClick={onGoHome} title="Go to Overview"><span className="brand-logo-tile"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="12" width="5.2" height="10" rx="2" fill="#fff"/><rect x="9.4" y="6.5" width="5.2" height="15.5" rx="2" fill="#fff"/><rect x="16.8" y="2" width="5.2" height="20" rx="2" fill="#fff"/></svg></span><span className="brand-word">Two<span className="brand-word-2">Pockets</span></span></div>
      </div>
      <div className="topbar-right">
        <button className="topbar-ask-btn" onClick={() => { setMenuOpen(false); setInboxOpen(false); onOpenAsk && onOpenAsk(); }} aria-label="Ask TwoPockets" title="Ask TwoPockets"><Icon name="ask" size={15} /><span className="topbar-ask-label">Ask</span></button>
        <div className={"upload-statement-wrap" + (tourSpot === "upload" ? " tour-spot" : "")} data-tour-active={tourSpot === "upload" ? "1" : undefined}>
          <button className="glass-btn primary upload-statement-btn" onClick={() => { setMenuOpen(false); setInboxOpen(false); onOpenUpload(); }} aria-label="Upload statement" title="Upload statement"><Icon name="plus" size={17} className="upload-btn-icon" /></button>
          {dataGap != null && dataGap >= 3 && <span className="upload-alert" title={dataGap + " days of data missing"}>!</span>}
        </div>
        <div className={"inbox-wrap" + (tourSpot === "inbox" ? " tour-spot" : "")} ref={inboxRef} data-tour-active={tourSpot === "inbox" ? "1" : undefined}>
          <button className="inbox-btn" onClick={() => { setInboxOpen((v) => !v); setMenuOpen(false); }} aria-label="Tasks" title="Tasks">
            <Icon name="bell" size={18} />{taskList.length > 0 && <span className="inbox-badge">{taskList.length}</span>}
          </button>
          {inboxOpen && (
            <div className="inbox-menu">
              <div className="inbox-menu-head">Your tasks{taskList.length ? " · " + taskList.length : ""}</div>
              {taskList.length === 0 ? (
                <div className="inbox-empty"><Icon name="checkcircle" size={15} /> All caught up &mdash; nothing to do right now.</div>
              ) : taskList.map((t) => (
                <button key={t.id} className="inbox-item" onClick={() => { setInboxOpen(false); t.action(); }}>
                  <span className="inbox-item-icon"><Icon name={t.icon} size={16} /></span>
                  <span className="inbox-item-text"><span className="inbox-item-title">{t.title}</span><span className="inbox-item-desc">{t.desc}</span></span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="avatar-wrap" ref={menuRef}>
        <button className="avatar" onClick={() => { setMenuOpen((v) => !v); setInboxOpen(false); }}>{initial}</button>
        {menuOpen && <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />}
        {menuOpen && (
          <div className="avatar-menu">
            <button className="menu-item" onClick={() => { setMenuOpen(false); onOpenSettings(); }}>Settings</button>
            <button className="menu-item" onClick={() => { setMenuOpen(false); onOpenCategories && onOpenCategories(); }}>Categories</button>
            <button className="menu-item" onClick={() => { setMenuOpen(false); onOpenMapping(); }}>Mapping</button>
            {isAdmin && <button className="menu-item menu-item-admin" onClick={() => { setMenuOpen(false); onOpenAdmin(); }}>Admin tools</button>}
            <button className="menu-item menu-item-logout" onClick={onLogout}>Log out</button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
function SidePanel({ open, active, setActive, isDev, onResetDev, views, onCustomise, onClose, tourSpot, onOpenSettings, onLogout }) {
  const list = views || VIEWS;
  return (
    <div className={"side-panel " + (open ? "side-panel-open" : "")} data-tour-active={tourSpot === "menu" && open ? "1" : undefined}>
      <div className="side-panel-label-row">
        <span className="side-panel-label">Views</span>
        <div className="side-panel-label-actions">
          {onCustomise && <button className="side-edit-views" onClick={onCustomise} aria-label="Customise menu" title="Customise menu"><Icon name="edit" size={13} /></button>}
          <button className="side-close-btn" onClick={onClose} aria-label="Close menu" title="Close menu">×</button>
        </div>
      </div>
      {list.filter((v) => v.key !== "accounts" && v.key !== "categories").map((v) => (
        <button key={v.key} className={"side-item " + (active === v.key ? "side-item-active" : "")} onClick={() => setActive(v.key)}>{v.label}</button>
      ))}
      {list.some((v) => v.key === "accounts") && (
        <div className="side-accounts-wrap">
          <div className="side-divider" />
          <button className={"side-item side-item-accounts " + (active === "accounts" ? "side-item-active" : "")} onClick={() => setActive("accounts")}>
            <span>Bank Accounts</span>
          </button>
        </div>
      )}
      <button className={"side-item side-item-accounts " + (active === "settings" ? "side-item-active" : "")} onClick={() => onOpenSettings && onOpenSettings()}>
        <span>Settings</span>
      </button>
      <button className="side-item side-item-logout" onClick={() => onLogout && onLogout()}>
        <span>Log out</span>
      </button>
      {isDev && <button className="side-reset-btn" onClick={onResetDev}>RESET</button>}
    </div>
  );
}
function CustomiseMenuModal({ current, onClose, onSave }) {
  const [sel, setSel] = useState(current || VIEWS.map((v) => v.key));
  const toggle = (key) => {
    if (key === "overview") return;
    setSel((s) => s.includes(key) ? s.filter((k) => k !== key) : [...s, key]);
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-card modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="brand-row" style={{ marginBottom: 12, justifyContent: "space-between" }}>
          <span className="brand-name">Customise menu</span>
          <button className="icon-btn" onClick={onClose} aria-label="Close" style={{ color: "var(--ink)" }}>×</button>
        </div>
        <p className="subtitle" style={{ margin: "0 0 12px" }}>Choose which pages appear in your sidebar.</p>
        <div className="customise-list">
          {VIEWS.map((v) => {
            const on = sel.includes(v.key);
            const locked = v.key === "overview";
            return (
              <button key={v.key} className={"customise-row" + (on ? " customise-on" : "")} onClick={() => toggle(v.key)} disabled={locked}>
                <span>{v.label}{locked ? " (always on)" : ""}</span>
                <span className="customise-check">{on ? "✓" : ""}</span>
              </button>
            );
          })}
        </div>
        <div className="nav-row" style={{ marginTop: 14 }}>
          <button className="glass-btn primary" onClick={() => { onSave(VIEWS.map((v) => v.key).filter((k) => sel.includes(k))); onClose(); }}>Save</button>
        </div>
      </div>
    </div>
  );
}
function BudgetRing({ spent, target }) {
  const t = target || 1;
  const pct = Math.min(100, Math.round((spent / t) * 100));
  const overspent = spent > t;
  const R = 70, CIRC = 2 * Math.PI * R;
  const ringColor = overspent ? "var(--neg)" : "var(--accent)";
  return (
    <div className="budget-ring-wrap">
      <svg className="budget-ring" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="14" />
        <circle cx="80" cy="80" r={R} fill="none" stroke={ringColor} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={CIRC} strokeDashoffset={CIRC - CIRC * (Math.min(100, pct) / 100)} transform="rotate(-90 80 80)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div className="budget-ring-center">
        <span className="budget-ring-pct" style={overspent ? { color: "var(--neg)" } : null}><CountUp value={pct} duration={700} />%</span>
        <span className="budget-ring-sub">of budget</span>
      </div>
    </div>
  );
}
function SummaryCard({ targets, transactions, rollovers }) {
  const lastIdx = MONTH_LABELS.length - 1;
  const spent = spendForMonth(transactions || [], latestMonthKey(transactions || []));
  const target = TX_CATEGORIES.reduce((s, c) => s + (Number((targets || {})[c]) || 0), 0) || 1;
  const pct = Math.min(100, Math.round((spent / target) * 100));
  const expectedPct = Math.round((DAYS_INTO_MONTH() / daysInCurrentMonth()) * 100);
  const dataMonth = (transactions && transactions.length > 0) ? latestMonthKey(transactions) : null;
  const isCurrentMonth = dataMonth === currentMonthKey();
  const projected = isCurrentMonth ? projectMonthEnd(spent) : null;
  const overPace = projected !== null ? projected > target : spent > target;
  const paceNote = projected !== null
    ? (projected > target
      ? "At this rate you'll spend ~" + formatMoney(projected) + " — " + formatMoney(projected - target) + " over target"
      : "At this rate you'll spend ~" + formatMoney(projected) + " — " + formatMoney(target - projected) + " under target")
    : null;
  const overspent = spent > target;
  const filledPct = Math.min(100, pct);
  const R = 70, CIRC = 2 * Math.PI * R;
  const ringColor = overspent ? "var(--neg)" : "var(--accent)";
  return (
    <div className="glass-card dash-card">
      <div className="summary-head">
        <span className="card-label">{isCurrentMonth ? "This month" : (dataMonth ? monthLabelFromKey(dataMonth) : "This month")}</span>
        <span className={"pace-badge " + (overPace ? "pace-over" : "pace-good")}>{isCurrentMonth ? (overPace ? "Over pace" : "On track") : (overPace ? "Over budget" : "Within budget")}</span>
      </div>
      <BudgetRing spent={spent} target={target} />
      {overspent && <div className="overspend-alert"><Icon name="alert" size={13} /> Over budget — {formatMoney(spent - target)} over your {formatMoney(target)} target</div>}
      <div className="summary-amounts" style={{ justifyContent: "center" }}>
        <span className="summary-spent"><CountUp value={spent} format={formatMoney} /></span>
        <span className="summary-target">of {formatMoney(target)} target</span>
      </div>
      {(() => {
        const rb = rolloverForMonth(rollovers, currentMonthKey());
        if (!rb) return null;
        return <p className={"summary-note rollover-note " + (rb > 0 ? "rn-up" : "rn-down")}>{rb < 0 ? "↓" : "↑"} {formatMoney(Math.abs(rb))} rollover {rb < 0 ? "trimmed from" : "added to"} this month's spendable</p>;
      })()}
      {paceNote && <p className={"summary-note pace-note " + (overPace ? "pace-note-over" : "pace-note-under")}>{paceNote}</p>}
    </div>
  );
}
function DAYS_INTO_MONTH() { return today().getDate(); }

function CategoryEditor({ value, onChange }) {
  const [open, setOpen] = useState(false);
  if (!open) return (<span className="cat-view"><span className="cat-dot" style={{ background: catColor(value) }} />{displayCat(value)} <button className="edit-link" onClick={() => setOpen(true)}>Edit</button></span>);
  /* Keep the dot while editing — swapping the whole span for a bare <select> made
     it disappear, so the row lost its colour cue mid-edit. */
  return (
    <span className="cat-view">
      <span className="cat-dot" style={{ background: catColor(value) }} />
      <select className="cat-select" autoFocus value={value} onBlur={() => setOpen(false)}
        onChange={(e) => { onChange(e.target.value); setOpen(false); }}>
        {allSpendCategories().map((c) => <option key={c} value={c}>{displayCat(c)}</option>)}
      </select>
    </span>
  );
}
function TransactionFeed({ limit, transactions, onRecategorize }) {
  const source = transactions || [];
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [month, setMonth] = useState("all");
  const [type, setType] = useState("all");
  const [minAmt, setMinAmt] = useState("");
  const [sort, setSort] = useState("new");
  const monthsWithData = React.useMemo(() => {
    const set = new Set(source.filter((t) => t.date).map((t) => t.date.slice(0, 7)));
    return [...set].sort().reverse();
  }, [source]);
  const catsPresent = React.useMemo(() => {
    const set = new Set(source.map((t) => t.category).filter(Boolean));
    return [...set].sort();
  }, [source]);

  if (limit) {
    const list = source.slice(0, limit);
    return (
      <div className="glass-card dash-card">
        <span className="card-label">Recent transactions</span>
        <div className="tx-list">
          {list.map((t, i) => (
            <div className="tx-row" key={i}>
              <span className="tx-cat-ico" style={{ color: catColor(t.category) }}><Icon name={CATEGORY_ICONS[t.category] || "tag"} size={14} /></span><div className="tx-info"><span className="tx-name">{t.name}</span><span className="tx-category">{displayCat(t.category)} {"\u00B7"} {formatTxDate(t.date)}</span></div>
              <span className={"tx-amount " + (t.amount > 0 ? "tx-positive" : "")}>{t.currency && t.currency !== FX.home ? (<span className="tx-amt-stack"><span>{formatMoneyNative(t.amountNative, t.currency)}</span><span className="tx-amt-conv">&asymp; {formatMoney(t.amount)}</span></span>) : formatMoney(t.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const minVal = Number(minAmt) > 0 ? Number(minAmt) : 0;
  let filtered = source.filter((t) => {
    if (cat !== "all" && t.category !== cat) return false;
    if (month !== "all" && (t.date || "").slice(0, 7) !== month) return false;
    if (type === "out" && !(t.amount < 0)) return false;
    if (type === "in" && !(t.amount > 0)) return false;
    if (minVal > 0 && Math.abs(t.amount) < minVal) return false;
    if (q) {
      const hay = (t.name + " " + (t.category || "") + " " + (t.date ? monthLabelFromKey(t.date.slice(0, 7)) : "")).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  filtered = filtered.slice().sort((a, b) => sort === "amt" ? Math.abs(b.amount) - Math.abs(a.amount) : (b.date || "").localeCompare(a.date || ""));

  const spentTotal = filtered.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const inTotal = filtered.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  /* Header used to always say "out", so filtering to Money in read "£0 out" next to a
     £2,500 inflow. Report whichever sides are actually present. */
  const totalParts = [];
  if (spentTotal > 0) totalParts.push(formatMoney(spentTotal) + " out");
  if (inTotal > 0) totalParts.push(formatMoney(inTotal) + " in");
  const hasFilter = q || cat !== "all" || month !== "all" || type !== "all" || minVal > 0;

  return (
    <div className="glass-card dash-card">
      <div className="summary-head">
        <span className="card-label">Transactions</span>
        <span className="tx-count"><span className="tx-count-n">{filtered.length} {filtered.length === 1 ? "result" : "results"}</span>{totalParts.length ? <span className="tx-count-io">{totalParts.join(" \u00B7 ")}</span> : null}</span>
      </div>
      <p className="page-intro">Search or filter to find any transaction. Hit <b>EDIT</b> under a category to recategorise it — the change applies to that merchant everywhere.</p>
      <div className="tx-filters">
        <input className="tx-input tx-search" type="text" placeholder="Search merchant, category, month…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="bd-month-select" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All categories</option>
          {catsPresent.map((c) => (<option key={c} value={c}>{displayCat(c)}</option>))}
        </select>
        <select className="bd-month-select" value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="all">All months</option>
          {monthsWithData.map((k) => (<option key={k} value={k}>{monthLabelFromKey(k)} {k.slice(0, 4)}</option>))}
        </select>
        <select className="bd-month-select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">Money in &amp; out</option>
          <option value="out">Money out</option>
          <option value="in">Money in</option>
        </select>
        <input className="tx-input tx-min" type="number" inputMode="numeric" placeholder={"Min " + homeSym()} value={minAmt} onChange={(e) => setMinAmt(e.target.value)} />
        <select className="bd-month-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="new">Newest first</option>
          <option value="amt">Highest amount</option>
        </select>
        {hasFilter && <button className="tx-clear" onClick={() => { setQuery(""); setCat("all"); setMonth("all"); setType("all"); setMinAmt(""); }}>Clear</button>}
      </div>
      <div className="tx-list">
        {filtered.length === 0 ? (
          <div className="tx-empty">No transactions match your filters.</div>
        ) : filtered.map((t, i) => (
          <div className="tx-row" key={t.id || i}>
            <span className="tx-cat-ico" style={{ color: catColor(t.category) }}><Icon name={CATEGORY_ICONS[t.category] || "tag"} size={14} /></span><div className="tx-info"><span className="tx-name">{t.name}</span><span className="tx-category">{onRecategorize ? (<CategoryEditor value={t.category} onChange={(c2) => onRecategorize(t.name, c2)} />) : displayCat(t.category)} {"\u00B7"} {formatTxDate(t.date)}</span></div>
            <span className={"tx-amount " + (t.amount > 0 ? "tx-positive" : "")}>{t.currency && t.currency !== FX.home ? (<span className="tx-amt-stack"><span>{formatMoneyNative(t.amountNative, t.currency)}</span><span className="tx-amt-conv">&asymp; {formatMoney(t.amount)}</span></span>) : formatMoney(t.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function bdArc(cx, cy, r, a0, a1) {
  const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
  const large = (a1 - a0) > Math.PI ? 1 : 0;
  return "M " + cx + " " + cy + " L " + x0 + " " + y0 + " A " + r + " " + r + " 0 " + large + " 1 " + x1 + " " + y1 + " Z";
}
function PieChart({ slices, total, activeName, onPick }) {
  const [hover, setHover] = useState(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const wrapRef = React.useRef(null);
  const cx = 100, cy = 100, r = 92;
  let ang = -Math.PI / 2;
  const paths = slices.map((s, i) => {
    const frac = total > 0 ? s.value / total : 0;
    const start = ang, end = ang + frac * Math.PI * 2;
    ang = end;
    return { name: s.name, color: s.color, i, start, end, frac, full: frac >= 0.9999 };
  });
  function onMove(e) {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }
  /* A picked category beats a hover: once you've clicked, the rest stay muted. */
  const opacityFor = (p) => {
    if (activeName) return p.name === activeName ? 1 : 0.18;
    return hover === null || hover === p.i ? 1 : 0.4;
  };
  const pick = (p) => { if (onPick) onPick(activeName === p.name ? null : p.name); };
  return (
    <div className="bd-pie-wrap" ref={wrapRef} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox="0 0 200 200" className="bd-pie-svg">
        {paths.map((p) => (
          p.full
            ? <circle key={p.i} data-slice={p.name} cx={cx} cy={cy} r={r} fill={p.color} fillOpacity={opacityFor(p)} style={{ transition: "fill-opacity .18s", cursor: onPick ? "pointer" : "default" }} onMouseEnter={() => setHover(p.i)} onClick={() => pick(p)} />
            : <path key={p.i} data-slice={p.name} d={bdArc(cx, cy, r, p.start, p.end)} fill={p.color} fillOpacity={opacityFor(p)} style={{ transition: "fill-opacity .18s", cursor: onPick ? "pointer" : "default" }} onMouseEnter={() => setHover(p.i)} onClick={() => pick(p)} />
        ))}
      </svg>
      {hover !== null && (
        <div className="bd-pie-tip" style={{ left: pos.x, top: pos.y }}>
          <span className="cat-dot" style={{ background: paths[hover].color }} />{paths[hover].name} {Math.round(paths[hover].frac * 100)}%
        </div>
      )}
    </div>
  );
}
function BreakdownPage({ transactions, targets, allTargets, onOpenCatReview }) {
  const txs = transactions || [];
  const monthsWithData = React.useMemo(() => {
    const set = new Set(txs.filter((t) => t.date && t.amount < 0).map((t) => t.date.slice(0, 7)));
    return [...set].sort().reverse();
  }, [txs]);
  const [monthKey, setMonthKey] = useState(overviewMonthKey(txs));
  const [openCat, setOpenCat] = useState(null);
  const [compareTargets, setCompareTargets] = useState(false);
  const activeKey = monthsWithData.includes(monthKey) ? monthKey : (monthsWithData[0] || monthKey);
  const isCurrentMonth = activeKey === currentMonthKey();
  /* Targets for the month actually on screen, not whatever the current month is.
     Same precedence as Monthly Review: own targets, then nearest earlier month,
     then earliest on record (covers months that predate signup). borrowedFrom is
     surfaced in the copy so a cross-month comparison is never silent. */
  const [monthTargets, borrowedFrom] = (() => {
    const own = (allTargets && allTargets[activeKey]) || null;
    if (own && TX_CATEGORIES.some((c) => Number(own[c]) > 0)) return [own, null];
    const all = allTargets ? Object.keys(allTargets).sort() : [];
    const earlier = all.filter((k) => k <= activeKey);
    for (let i = earlier.length - 1; i >= 0; i--) {
      const t = allTargets[earlier[i]] || {};
      if (TX_CATEGORIES.some((c) => Number(t[c]) > 0)) return [t, earlier[i]];
    }
    for (let i = 0; i < all.length; i++) {
      const t = allTargets[all[i]] || {};
      if (TX_CATEGORIES.some((c) => Number(t[c]) > 0)) return [t, all[i]];
    }
    return [targets || {}, null];
  })();
  const bdTarget = monthTargets ? TX_CATEGORIES.reduce((s, c) => s + (Number(monthTargets[c]) || 0), 0) : 0;

  const byCat = spendByCategoryForMonth(txs, activeKey);
  const prevKey = addMonths(activeKey, -1);
  const byCatPrev = spendByCategoryForMonth(txs, prevKey);
  const avgKeys = lastNMonthKeys(addMonths(activeKey, -1), 3);
  const avgByCat = {};
  const avgCntByCat = {};
  avgKeys.forEach((k) => { const o = spendByCategoryForMonth(txs, k); Object.keys(o).forEach((c) => { if (o[c] > 0) { avgByCat[c] = (avgByCat[c] || 0) + o[c]; avgCntByCat[c] = (avgCntByCat[c] || 0) + 1; } }); });
  Object.keys(avgByCat).forEach((c) => { avgByCat[c] = avgByCat[c] / (avgCntByCat[c] || 1); });

  const monthUncat0 = txs.filter((t) => t.amount < 0 && t.category === "Uncategorized" && t.date.slice(0, 7) === activeKey).length;
  const catSet = new Set([...spendCategories(), ...Object.keys(byCat).filter((c) => byCat[c] > 0)]);
  if (monthUncat0 > 0) catSet.add("Uncategorized");
  const cats = [...catSet].sort((a, b) => (byCat[b] || 0) - (byCat[a] || 0));
  const total = cats.reduce((s, c) => s + (byCat[c] || 0), 0);
  const topAmount = cats.length ? (byCat[cats[0]] || 0) : 0;
  const prevTotal = Object.values(byCatPrev).reduce((s, v) => s + v, 0);
  const totalDiff = total - prevTotal;
  const totalPct = prevTotal > 0 ? Math.round((totalDiff / prevTotal) * 100) : null;

  const movers = cats
    .map((c) => ({ name: c, diff: byCat[c] - (avgByCat[c] || 0), avg: avgByCat[c] || 0 }))
    .filter((m) => m.avg > 0 && Math.abs(m.diff) >= 25 && Math.abs(Math.round((m.diff / m.avg) * 100)) >= 10)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 4);
  const showTrend = !isCurrentMonth && movers.length > 0;

  const pieSlices = cats.filter((c) => (byCat[c] || 0) > 0).map((c) => ({ name: displayCat(c), value: byCat[c], color: catColor(c) }));
  const spentTitle = isCurrentMonth ? "You've spent so far in " + monthLabelFromKey(activeKey) : "You spent in " + monthLabelFromKey(activeKey);
  const whereTitle = isCurrentMonth ? "Where your money is going" : "Where your money went";

  const monthUncat = txs.filter((t) => t.amount < 0 && t.category === "Uncategorized" && t.date.slice(0, 7) === activeKey).length;
  /* Facts for the hero's dead middle — all from data this page already has. */
  const heroTxs = txs.filter((t) => t.amount < 0 && t.date && t.date.slice(0, 7) === activeKey);
  const topCatName = cats.find((c) => (byCat[c] || 0) > 0);
  const daysElapsed = isCurrentMonth ? today().getDate() : new Date(Number(activeKey.slice(0, 4)), Number(activeKey.slice(5, 7)), 0).getDate();
  const heroFacts = [];

  return (
    <div className="bd-page">
      {onOpenCatReview && <UncatBanner count={monthUncat} onSort={onOpenCatReview} label={"in " + monthLabelFromKey(activeKey) + " aren\u2019t categorised"} />}
      <div className="glass-card dash-card bd-box bd-box-hero">
        <div className="summary-head">
          <span className="card-label">Spending Breakdown</span>
          <select className="bd-month-select" value={activeKey} onChange={(e) => { setMonthKey(e.target.value); setOpenCat(null); }}>
            {monthsWithData.map((k) => (<option key={k} value={k}>{monthLabelFromKey(k)} {k.slice(0, 4)}</option>))}
          </select>
        </div>
        <div className="bd-header">
          <div className="bd-hero-left">
            <div className="bd-headline">{formatMoney(total)}</div>
            <div className="bd-sub">{spentTitle}</div>
            {!isCurrentMonth && totalPct !== null && totalDiff !== 0 && (
              <div className={"bd-total-delta " + (totalDiff > 0 ? "delta-up" : "delta-down")}>
                {totalDiff > 0 ? "\u25B2" : "\u25BC"}{Math.abs(totalPct)}% &middot; {formatMoney(Math.abs(totalDiff))} {totalDiff > 0 ? "more" : "less"} than {monthLabelFromKey(prevKey)}
              </div>
            )}
            {!isCurrentMonth && totalDiff === 0 && prevTotal > 0 && <div className="bd-total-delta delta-flat">About the same as {monthLabelFromKey(prevKey)}</div>}
          </div>
          {heroFacts.length > 0 && (
          <div className="bd-hero-facts">
            {heroFacts.map((f) => (
              <div className="bd-fact" key={f.label}>
                <span className="bd-fact-val">{f.value}</span>
                <span className="bd-fact-label">{f.label}</span>
              </div>
            ))}
          </div>
          )}
          <div className="bd-hero-right">
            {bdTarget > 0 && <div className="bd-hero-ring"><BudgetRing spent={total} target={bdTarget} /></div>}
          </div>
        </div>
      </div>

      <div className="bd-row">
        <div className="glass-card dash-card bd-box bd-box-where">
          <div className="summary-head">
            <span className="card-label">{whereTitle}<span className="bd-box-hint">Tap a category to see its transactions</span></span>
            <label className="bd-check">
              <input type="checkbox" checked={compareTargets} onChange={(e) => setCompareTargets(e.target.checked)} />
              <span>Compare to targets</span>
            </label>
          </div>
          {compareTargets && borrowedFrom && borrowedFrom !== activeKey && (
            <p className="subtitle" style={{ margin: "-4px 0 12px", fontSize: 12 }}>
              You hadn't set budgets yet in {monthLabelFromKey(activeKey)}, so we're comparing against your {monthLabelFromKey(borrowedFrom)} targets.
            </p>
          )}
          <div className={"category-list bd-list" + (openCat ? " bd-has-open" : "")}>
            {cats.map((name) => {
              const amount = byCat[name] || 0;
              const color = catColor(name);
              const sharePct = total > 0 && amount > 0 ? Math.round((amount / total) * 100) : 0;
              const budget = monthTargets && Number(monthTargets[name]) > 0 ? Number(monthTargets[name]) : 0;
              const isOpen = openCat === name;
              let fillPct, amtLabel, noTarget = false, over = false, shareLabel;
              if (compareTargets) {
                if (budget > 0) {
                  over = amount > budget;
                  fillPct = Math.min(100, (amount / budget) * 100);
                  amtLabel = formatMoney(amount) + " / " + formatMoney(budget);
                  shareLabel = Math.round((amount / budget) * 100) + "% used";
                } else {
                  fillPct = 0; amtLabel = formatMoney(amount); noTarget = true; shareLabel = null;
                }
              } else {
                fillPct = topAmount > 0 && amount > 0 ? Math.max(4, (amount / topAmount) * 100) : 0;
                amtLabel = formatMoney(amount); shareLabel = amount > 0 ? sharePct + "%" : null;
              }
              const catTxs = txs
                .filter((t) => t.amount < 0 && t.category === name && t.date.slice(0, 7) === activeKey)
                .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
              return (
                <div className={"bd-cat" + (openCat && !isOpen ? " bd-cat-dim" : "")} key={name}>
                  <div className={"bd-cat-row" + (isOpen ? " bd-open" : "")} onClick={() => setOpenCat(isOpen ? null : name)}>
                    <div className="category-top">
                      <span className="category-name">
                        <span className="cat-dot" style={{ background: color }} />{displayCat(name)}
                        {shareLabel && <span className={"bd-share" + (over ? " bd-share-over" : "")}>&middot; {shareLabel}</span>}
                        <i className={"ti ti-chevron-down bd-chev" + (isOpen ? " bd-chev-open" : "")} />
                      </span>
                      <span className={"category-amount bd-amt" + (over ? " bd-amt-over" : "")}>{amtLabel}{noTarget && <span className="bd-notarget"> &middot; no target</span>}</span>
                    </div>
                    <div className={"category-track" + (over ? " bd-track-over" : "")}><div className="category-fill" style={{ width: fillPct + "%", background: color }} /></div>
                  </div>
                  {isOpen && (
                    <div className="bd-tx-list">
                      {catTxs.length === 0 ? (
                        <div className="bd-tx-empty">No transactions.</div>
                      ) : catTxs.map((t, i) => (
                        <div className="bd-tx-row" key={t.id || i}>
                          <span className="bd-tx-name">{t.name}<span className="bd-tx-date"> &middot; {formatTxDate(t.date)}</span></span>
                          <span className="bd-tx-amt">{formatMoney(Math.abs(t.amount))}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card dash-card bd-box bd-box-pie">
          <span className="card-label">Spending mix</span>
          <div className="bd-pie-body">
            <PieChart slices={pieSlices} total={total} activeName={openCat ? displayCat(openCat) : null} onPick={(n) => setOpenCat(n ? (cats.find((c) => displayCat(c) === n) || null) : null)} />
            <div className="bd-legend">
              {pieSlices.map((s) => {
                const dim = openCat && displayCat(openCat) !== s.name;
                return (
                  <span className={"bd-legend-item" + (dim ? " bd-legend-dim" : "")} key={s.name}
                    onClick={() => setOpenCat(displayCat(openCat) === s.name ? null : (cats.find((c) => displayCat(c) === s.name) || null))}>
                    <span className="cat-dot" style={{ background: s.color }} />{s.name}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {showTrend && (
          <div className="glass-card dash-card bd-box bd-box-trend">
            <span className="card-label">Trend analysis</span>
            <div className="bd-movers">
              {movers.map((m) => {
                const up = m.diff > 0;
                const pctv = Math.abs(Math.round((m.diff / m.avg) * 100));
                return (
                  <div className="bd-mover" key={m.name}>
                    <span className="category-name"><span className="cat-dot" style={{ background: catColor(m.name) }} />{displayCat(m.name)}</span>
                    <span className={"bd-mover-delta " + (up ? "delta-up" : "delta-down")}>
                      {up ? "\u25B2" : "\u25BC"} {pctv}% {up ? "higher" : "lower"} &middot; {formatMoney(Math.abs(m.diff))} {up ? "more" : "less"} than usual
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BreakdownCard({ transactions, targets }) {
  const txs = transactions || [];
  const [compareTargets, setCompareTargets] = useState(false);
  const monthKey = latestMonthKey(txs);
  const isCurrentMonth = monthKey === currentMonthKey();
  const byCat = spendByCategoryForMonth(txs, monthKey);
  const monthUncat = txs.filter((t) => t.amount < 0 && t.category === "Uncategorized" && t.date.slice(0, 7) === monthKey).length;
  const catSet = new Set([...spendCategories(), ...Object.keys(byCat).filter((c) => byCat[c] > 0)]);
  if (monthUncat > 0) catSet.add("Uncategorized");
  const cats = [...catSet].sort((a, b) => (byCat[b] || 0) - (byCat[a] || 0));
  const total = cats.reduce((s, c) => s + (byCat[c] || 0), 0);
  const topAmount = cats.length ? (byCat[cats[0]] || 0) : 0;
  const whereTitle = isCurrentMonth ? "Where your money is going" : "Where your money went";
  return (
    <div className="glass-card dash-card">
      <div className="summary-head">
        <span className="card-label">{whereTitle}</span>
        <label className="bd-check">
          <input type="checkbox" checked={compareTargets} onChange={(e) => setCompareTargets(e.target.checked)} />
          <span>Compare to targets</span>
        </label>
      </div>
      <div className="category-list bd-list breakdown-scroll">
        {cats.map((name) => {
          const amount = byCat[name] || 0;
          const color = catColor(name);
          const sharePct = total > 0 && amount > 0 ? Math.round((amount / total) * 100) : 0;
          const budget = targets && Number(targets[name]) > 0 ? Number(targets[name]) : 0;
          let fillPct, amtLabel, noTarget = false, over = false, shareLabel;
          if (compareTargets) {
            if (budget > 0) {
              over = amount > budget;
              fillPct = Math.min(100, (amount / budget) * 100);
              amtLabel = formatMoney(amount) + " / " + formatMoney(budget);
              shareLabel = Math.round((amount / budget) * 100) + "% used";
            } else {
              fillPct = 0; amtLabel = formatMoney(amount); noTarget = true; shareLabel = null;
            }
          } else {
            fillPct = topAmount > 0 && amount > 0 ? Math.max(4, (amount / topAmount) * 100) : 0;
            amtLabel = formatMoney(amount); shareLabel = amount > 0 ? sharePct + "%" : null;
          }
          return (
            <div className="category-row" key={name}>
              <div className="category-top">
                <span className="category-name">
                  <span className="cat-dot" style={{ background: color }} />{displayCat(name)}
                  {shareLabel && <span className={"bd-share" + (over ? " bd-share-over" : "")}>&middot; {shareLabel}</span>}
                </span>
                <span className={"category-amount bd-amt" + (over ? " bd-amt-over" : "")}>{amtLabel}{noTarget && <span className="bd-notarget"> &middot; no target</span>}</span>
              </div>
              <div className={"category-track" + (over ? " bd-track-over" : "")}><div className="category-fill" style={{ width: fillPct + "%", background: color }} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrendsCard({ transactions, compact }) {
  const txs = transactions || [];
  const [cat, setCat] = useState(TX_CATEGORIES[0]);
  let keys = [...new Set(txs.filter((t) => t.date).map((t) => t.date.slice(0, 7)))].sort();
  keys = keys.filter((k) => incomeForMonth(txs, k) > 0 || spendForMonth(txs, k) > 0);
  if (keys.length > 12) keys = keys.slice(-12);
  if (!keys.length) keys = lastNMonthKeys(latestMonthKey(txs), 1);
  const months = keys.map(monthLabelFromKey);
  const income = keys.map((k) => Math.round(incomeForMonth(txs, k)));
  const spend = keys.map((k) => Math.round(spendForMonth(txs, k)));
  const net = keys.map((k) => Math.round(incomeForMonth(txs, k) - spendForMonth(txs, k)));
  const catSpend = keys.map((k) => Math.round(spendByCategoryForMonth(txs, k)[cat] || 0));
  const flowMax = Math.max(...income, ...spend, 1);
  const spendMax = Math.max(...spend, 1);
  const catMax = Math.max(...catSpend, 1);
  /* The newest key isn't necessarily a finished month — labelling it "last month"
     while it's the month in progress reports the wrong period. */
  const lastKey = keys[keys.length - 1];
  const lastIsCurrent = lastKey === currentMonthKey();
  const lastLabel = lastIsCurrent ? "so far this month" : "last month";
  return (
    <div className="trends-wrap">
      {!compact && (<>
      <div className="glass-card dash-card">
        <span className="card-label">Net inflow / outflow</span>
        <div className="trend-chart">
          {months.map((m, i) => (
            <div className="trend-bar-col" key={"f" + m + i}>
              <div className="trend-bar-wrap dual">
                <div className="trend-bar income-bar" style={{ height: (income[i] > 0 ? Math.max(4, (income[i] / flowMax) * 100) : 0) + "%" }} />
                <div className="trend-bar spend-bar" style={{ height: (spend[i] > 0 ? Math.max(4, (spend[i] / flowMax) * 100) : 0) + "%" }} />
                <span className="trend-tip">In {formatMoney(income[i])} {"\u00B7"} Out {formatMoney(spend[i])}</span>
              </div>
              <span className="trend-bar-label">{m}</span>
            </div>
          ))}
        </div>
        <div className="legend-row">
          <span className="legend-item"><span className="legend-dot" style={{ background: catColor("Income") }} />Money in</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: "var(--accent)" }} />Money out</span>
        </div>
        <p className="summary-note">{lastIsCurrent ? "Net so far this month" : "Net last month"}: {formatMoney(net[net.length - 1])}</p>
      </div>

      <div className="glass-card dash-card">
        <span className="card-label">Net spending by month</span>
        <div className="trend-chart">
          {months.map((m, i) => (
            <div className="trend-bar-col" key={"s" + m + i}>
              <div className="trend-bar-wrap">
                <div className="trend-bar" style={{ height: (spend[i] / spendMax) * 100 + "%" }}>
                  <span className="trend-tip">{formatMoney(spend[i])}</span>
                </div>
              </div>
              <span className="trend-bar-label">{m}</span>
            </div>
          ))}
        </div>
        <p className="summary-note">Total spend per month {"\u00B7"} {formatMoney(spend[spend.length - 1])} {lastLabel}</p>
      </div>
      </>)}

      <div className="glass-card dash-card">
        <div className="summary-head">
          <span className="card-label">Category trend</span>
          <select className="slot-select trend-cat-select" value={cat} onChange={(e) => setCat(e.target.value)}>
            {spendCategories().map((c) => <option key={c} value={c}>{displayCat(c)}</option>)}
          </select>
        </div>
        <div className="trend-chart">
          {months.map((m, i) => (
            <div className="trend-bar-col" key={"c" + m + i}>
              <div className="trend-bar-wrap">
                <div className="trend-bar" style={{ height: (catSpend[i] / catMax) * 100 + "%", background: catColor(cat) }}>
                  <span className="trend-tip">{formatMoney(catSpend[i])}</span>
                </div>
              </div>
              <span className="trend-bar-label">{m}</span>
            </div>
          ))}
        </div>
        <p className="summary-note">{cat} {"\u00B7"} {formatMoney(catSpend[catSpend.length - 1])} {lastLabel}</p>
      </div>
    </div>
  );
}

function titleCaseBillName(n) {
  const KEEP_UP = ["DD", "UK", "US", "EU", "UAE", "USA", "LLC", "PLC", "VAT"];
  return String(n || "").toLowerCase().split(" ")
    .map((w) => KEEP_UP.includes(w.toUpperCase()) ? w.toUpperCase() : (w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/* Two-step bills setup. Everything detected starts ticked — the common case is
   "yes, these are all bills", so the work should be untick-the-odd-one, not
   answer-a-question-per-row. */
function BillsSetupModal({ transactions, confirmed, onSave, onClose }) {
  const detected = React.useMemo(() => detectRecurringBills(transactions || []).filter((b) => b.amount > 0), [transactions]);
  const detectedNames = React.useMemo(() => new Set(detected.map((b) => b.name)), [detected]);
  const [step, setStep] = useState(detected.length ? 0 : 1);
  const [picked, setPicked] = useState(() => {
    const conf = confirmed || [];
    /* Re-opening the flow should remember previous choices; first run ticks all. */
    return new Set(conf.length ? detected.filter((b) => conf.includes(b.name)).map((b) => b.name) : detected.map((b) => b.name));
  });
  const [extra, setExtra] = useState(() => (confirmed || []).filter((n) => !detectedNames.has(n)));
  const [search, setSearch] = useState("");

  const merchants = React.useMemo(() => {
    const by = {};
    (transactions || []).filter((t) => t.amount < 0 && t.name).forEach((t) => {
      if (!by[t.name]) by[t.name] = { n: 0, sum: 0, days: [] };
      by[t.name].n += 1; by[t.name].sum += Math.abs(t.amount);
      const d = +String(t.date || "").slice(8, 10); if (d >= 1 && d <= 31) by[t.name].days.push(d);
    });
    return Object.entries(by).map(([name, v]) => ({
      name, amount: v.sum / v.n,
      due: v.days.length ? ordinalDay(Math.round(v.days.reduce((a, b) => a + b, 0) / v.days.length)) : "",
    })).sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const chosen = [...picked, ...extra];
  const rowsFor = (n) => detected.find((b) => b.name === n) || merchants.find((m) => m.name === n) || { name: n, amount: 0, due: "" };
  const total = chosen.reduce((s, n) => s + (rowsFor(n).amount || 0), 0);
  const toggle = (n) => setPicked((p) => { const x = new Set(p); x.has(n) ? x.delete(n) : x.add(n); return x; });
  const addExtra = (n) => { if (!chosen.includes(n)) setExtra((e) => [...e, n]); setSearch(""); };

  const searchable = merchants
    .filter((m) => !chosen.includes(m.name))
    .filter((m) => search.trim() && m.name.toLowerCase().includes(search.trim().toLowerCase()))
    .slice(0, 6);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="glass-card bsm" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose}><Icon name="x" size={16} /></button>

        {step === 0 && (
          <>
            <div className="bsm-step">Step 1 of 2</div>
            <p className="bsm-h">Are these your bills?</p>
            <p className="bsm-s">We spotted these repeating each month. Untick anything that isn't a bill.</p>
            <div className="bsm-rows">
              {detected.map((b) => {
                const on = picked.has(b.name);
                return (
                  <div className={"bsm-row" + (on ? "" : " bsm-off")} key={b.name} role="button" tabIndex={0}
                    onClick={() => toggle(b.name)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(b.name); } }}>
                    <span className="bsm-nm">{titleCaseBillName(b.name)}<span className="bsm-meta">{b.frequency}{b.due ? " · due " + b.due : ""}</span></span>
                    <span className="bsm-amt">{formatMoney(b.amount)}</span>
                    <span className={"bsm-tick" + (on ? " bsm-tick-on" : "")}>{on && <Icon name="check" size={13} />}</span>
                  </div>
                );
              })}
            </div>
            <button className="glass-btn primary bsm-cta" onClick={() => setStep(1)}>
              Next {"\u00B7"} {picked.size} bill{picked.size !== 1 ? "s" : ""}
            </button>
            <p className="bsm-note">Nothing counts as a bill until you say so.</p>
          </>
        )}

        {step === 1 && (
          <>
            <div className="bsm-step">Step 2 of 2</div>
            <p className="bsm-h">Anything we missed?</p>
            <p className="bsm-s">Add a bill we didn't spot {"\u2014"} rent, a standing order, anything paid by card.</p>
            {extra.length > 0 && (
              <div className="bsm-rows">
                {extra.map((n) => {
                  const r = rowsFor(n);
                  return (
                    <div className="bsm-row" key={n}>
                      <span className="bsm-nm">{titleCaseBillName(n)}<span className="bsm-meta">Monthly{r.due ? " · due " + r.due : ""}</span></span>
                      <span className="bsm-amt">{formatMoney(r.amount)}</span>
                      <button className="bsm-rm" onClick={() => setExtra((e) => e.filter((x) => x !== n))}><Icon name="x" size={14} /></button>
                    </div>
                  );
                })}
              </div>
            )}
            <input className="glass-input bsm-inp" placeholder="Search your payments" value={search} onChange={(e) => setSearch(e.target.value)} />
            {searchable.length > 0 && (
              <div className="bsm-sug">
                {searchable.map((m) => (
                  <button className="bsm-sug-row" key={m.name} onClick={() => addExtra(m.name)}>
                    <span className="bsm-nm">{titleCaseBillName(m.name)}<span className="bsm-meta">~{formatMoney(m.amount)}{m.due ? " · due " + m.due : ""}</span></span>
                    <Icon name="plus" size={14} />
                  </button>
                ))}
              </div>
            )}
            {search.trim() && !searchable.length && <p className="bsm-note" style={{ textAlign: "left" }}>No payments match {"\u201C"}{search.trim()}{"\u201D"}.</p>}
            <button className="glass-btn primary bsm-cta" onClick={() => { onSave(chosen); setStep(2); }}>Done</button>
            <button className="glass-btn bsm-cta bsm-ghost" onClick={() => { onSave(chosen); setStep(2); }}>Skip {"\u2014"} I've got them all</button>
          </>
        )}

        {step === 2 && (
          <div className="bsm-done">
            <div className="bsm-done-ic"><Icon name="check" size={24} /></div>
            <p className="bsm-h">{chosen.length} bill{chosen.length !== 1 ? "s" : ""} tracked</p>
            <p className="bsm-s">{formatMoney(total)} a month. We'll set it aside from your safe-to-spend and tell you what's still to come.</p>
            <button className="glass-btn primary bsm-cta" onClick={() => { goToView("bills"); onClose(); }}>See my bills</button>
          </div>
        )}
      </div>
    </div>
  );
}

function BillsCard({ transactions, confirmed, onToggleConfirm, editable, rejected, onReject, onOpenSetup }) {
  /* Rejections must persist — local state meant "No" was forgotten on reload and
     the same payment was asked about forever. */
  const dismissed = rejected || [];
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const conf = confirmed || [];
  const _billNorm = (n) => String(n || "").toLowerCase().replace(/\d+/g, "").replace(/\s+/g, " ").trim();
  const detected = detectRecurringBills(transactions || []);
  const detectedNames = new Set(detected.map((b) => b.name));
  const confirmedBills = detected.filter((b) => conf.includes(b.name));
  const manualBills = conf.filter((n) => !detectedNames.has(n)).map((n) => {
    /* Match on the same normalised key detectRecurringBills groups by — an exact
       name match missed rows and produced a phantom £0 bill with no due date. */
    const want = _billNorm(n);
    let rows = (transactions || []).filter((t) => t.amount < 0 && _billNorm(t.name) === want);
    if (!rows.length) rows = (transactions || []).filter((t) => t.amount < 0 && t.name === n);
    const avg = rows.length ? rows.reduce((s, t) => s + Math.abs(t.amount), 0) / rows.length : 0;
    const days = rows.map((t) => +String(t.date || "").slice(8, 10)).filter((d) => d >= 1 && d <= 31);
    const due = days.length ? ordinalDay(Math.round(days.reduce((a, b) => a + b, 0) / days.length)) : "";
    return { name: n, amount: Math.round(avg * 100) / 100, frequency: "Monthly", due: due };
  });
  const myBills = [...confirmedBills, ...manualBills].filter((b) => b.amount > 0).sort((a, b) => b.amount - a.amount);
  const total = myBills.reduce((s, b) => s + b.amount, 0);
  const _paidThisMonth = new Set((transactions || []).filter((t) => t.amount < 0 && t.date && t.date.slice(0, 7) === currentMonthKey()).map((t) => _billNorm(t.name)));
  const billStatus = (b) => { const dueDay = parseInt(b.due, 10) || 0; const paid = dueDay > 0 && _paidThisMonth.has(_billNorm(b.name)); return { overdue: dueDay > 0 && !paid && dueDay < today().getDate() }; };

  if (!editable) {
    if (!myBills.length) return <EmptyState text="No bills yet — head to Bills & Subscriptions to pick which recurring payments are bills." />;
    return (
      <div className="glass-card dash-card">
        <div className="summary-head"><span className="card-label">Bills & subscriptions</span></div>
        <div className="tx-list">
          {myBills.map((b) => (
            <div className="tx-row" key={b.name}>
              <div className="tx-info"><span className="tx-name">{b.name}</span><span className="tx-category">{b.frequency}{b.due ? " \u00B7 due " + b.due : ""}{billStatus(b).overdue ? <span className="blc-od-lb"> · overdue</span> : ""}</span></div>
              <span className={"tx-amount" + (billStatus(b).overdue ? " blc-amt-od" : "")}>{formatMoney(-b.amount)}</span>
            </div>
          ))}
        </div>
        <p className="summary-note">Total recurring: {formatMoney(total)} / month</p>
      </div>
    );
  }

  const suspected = detected.filter((b) => !conf.includes(b.name) && !dismissed.includes(b.name));
  const merchantMap = {};
  (transactions || []).filter((t) => t.amount < 0 && t.name).forEach((t) => {
    merchantMap[t.name] = (merchantMap[t.name] || 0) + Math.abs(t.amount);
  });
  const allMerchants = Object.keys(merchantMap)
    .filter((n) => !conf.includes(n))
    .filter((n) => n.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  return (
    <div className="glass-card dash-card">
      <div className="summary-head"><span className="card-label">Bills & subscriptions</span></div>
      <p className="page-intro">Nothing's counted as a bill until you say so.{suspected.length > 0 ? "" : " Add any regular payments you want tracked as bills."}</p>

      {suspected.length > 0 && (
        <div className="bills-review-banner">
          <span>We've pulled through <b>{suspected.length}</b> payment{suspected.length !== 1 ? "s" : ""} that look like bills {"\u2014"} help us confirm them.</span>
          <button className="glass-btn primary" style={{ flex: "0 0 auto" }} onClick={() => onOpenSetup && onOpenSetup()}>Review my bills</button>
        </div>
      )}

      <span className="card-label" style={{ display: "block", margin: "16px 0 6px" }}>Your bills</span>
      {myBills.length === 0 ? (
        <p className="subtitle" style={{ margin: "0 0 4px" }}>{suspected.length > 0
          ? <>No bills added yet {"—"} confirm the ones above, or add your own below.</>
          : <>No bills added yet {"—"} add your own below.</>}</p>
      ) : (
        <>
          <div className="tx-list">
            {myBills.map((b) => (
              <div className="tx-row" key={b.name}>
                <div className="tx-info"><span className="tx-name">{b.name}</span><span className="tx-category">{b.frequency}{b.due ? " \u00B7 due " + b.due : ""}{billStatus(b).overdue ? <span className="blc-od-lb"> · overdue</span> : ""}</span></div>
                <div className="bill-right">
                  <span className={"tx-amount" + (billStatus(b).overdue ? " blc-amt-od" : "")}>{formatMoney(-b.amount)}</span>
                  <button className="bill-remove" onClick={() => onToggleConfirm(b.name)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <p className="summary-note">Total recurring: {formatMoney(total)} / month</p>
        </>
      )}

      <div style={{ marginTop: 14 }}>
        <button className="glass-btn ghost targets-rebuild-btn" style={{ flex: "0 0 auto" }} onClick={() => setPickerOpen((v) => !v)}>{pickerOpen ? "Close" : "Add another bill"}</button>
        {pickerOpen && (
          <div style={{ marginTop: 10 }}>
            <input className="catman-input" style={{ width: "100%", marginBottom: 8 }} placeholder="Search all your payments…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="tx-list" style={{ maxHeight: 280, overflowY: "auto" }}>
              {allMerchants.length === 0 ? (
                <p className="subtitle" style={{ margin: 0 }}>No payments match.</p>
              ) : allMerchants.slice(0, 60).map((n) => (
                <div className="tx-row" key={n}>
                  <div className="tx-info"><span className="tx-name">{n}</span><span className="tx-category">~{formatMoney(merchantMap[n])} total</span></div>
                  <button className="glass-btn ghost targets-rebuild-btn" style={{ flex: "0 0 auto" }} onClick={() => onToggleConfirm(n)}>Add</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BankAccountsCard({ banks, transactions, accountData }) {
  const statements = (accountData && accountData.statements) || [];
  const bankRows = (accountData && accountData.bankRows) || [];
  const txs = transactions || [];
  const list = banks && banks.length > 0 ? banks : [];
  const issues = chainIssues(statements);

  if (!list.length) {
    return (
      <div className="glass-card dash-card">
        <span className="card-label">Bank accounts</span>
        <div className="tx-list"><div className="tx-row"><div className="tx-info"><span className="tx-name">No banks linked yet</span></div></div></div>
      </div>
    );
  }

  const totalBal = totalEstimatedBalance(list, accountData, txs);
  const lastUpd = txs.map((t) => t.date || "").filter(Boolean).sort().reverse()[0] || statements.map((s) => s.periodEnd || "").filter(Boolean).sort().reverse()[0] || "";
  return (
    <div className="glass-card dash-card">
      <div className="ba-head">
        <span className="card-label" style={{ margin: 0 }}>Bank accounts</span>
        {totalBal !== null && <span className="ba-total">{formatMoney(totalBal)}<span className="ba-total-lb">across {list.length} account{list.length !== 1 ? "s" : ""}</span></span>}
      </div>
      {lastUpd && <span className="ba-updated">Last statement to {isoToShortDate(lastUpd)}</span>}
      <div className="tx-list">
        {list.map((b) => {
          const row = bankRows.find((r) => r.bank_name === b);
          const balance = computeBankBalance(b, statements, txs, row);
          const bankStmts = statements.filter((s) => s.bank === b).sort((x, y) => (x.periodStart || "").localeCompare(y.periodStart || ""));
          const bankIssues = issues.filter((i) => i.bank === b);
          return (
            <div className="account-block" key={b}>
              <div className="tx-row ba-bank-row" style={{ borderBottom: "none" }}>
                <span className="sb-avatar ba-avatar" style={{ background: bankBrand(b).bg, color: bankBrand(b).fg || "#fff" }}>{String(b).trim().charAt(0).toUpperCase()}</span>
                <div className="tx-info">
                  <span className="tx-name">{b}</span>
                  <span className="tx-category">{balance !== null ? "Estimated balance from statements" : "Add balances to see an estimate"}</span>
                </div>
                {balance !== null && <span className={"tx-amount " + (balance >= 0 ? "tx-positive" : "")}>{formatMoneyNative(balance, FX.bankCurrency[b] || "GBP")}</span>}
              </div>
              {bankStmts.length > 0 && (
                <div className="stmt-list">
                  {bankStmts.map((s) => {
                    const stmtTxDates = txs.filter((t) => t.bank === b && t.date && (!s.periodStart || t.date >= s.periodStart) && (!s.periodEnd || t.date <= s.periodEnd)).map((t) => t.date).sort();
                    const endShown = stmtTxDates.length ? stmtTxDates[stmtTxDates.length - 1] : s.periodEnd;
                    return (
                    <div className="stmt-row" key={s.id}>
                      <span className="stmt-period">{s.periodStart && endShown ? isoToShortDate(s.periodStart) + " → " + isoToShortDate(endShown) : (s.fileName || "Statement")}</span>
                      {s.status === "reconciled" && <span className="stmt-badge stmt-ok">✓ Balances</span>}
                      {s.status === "mismatch" && <span className="stmt-badge stmt-bad"><Icon name="alert" size={10} /> Off by {formatMoneyNative(Math.abs(s.difference), FX.bankCurrency[b] || "GBP")}</span>}
                      {s.status === "unverified" && <span className="stmt-badge stmt-na">○ Unchecked</span>}
                    </div>
                  ); })}
                </div>
              )}
              {bankIssues.map((iss, i) => (
                <div className="stmt-issue" key={i}><Icon name="alert" size={12} /> {iss.text}</div>
              ))}
            </div>
          );
        })}
      </div>
      <p className="ba-manage subtitle" style={{ margin: "12px 0 0" }}>Add or update accounts and balances in Settings.</p>
    </div>
  );
}

function MerchantsCard({ transactions }) {
  const txs = transactions || [];
  let merchants = topMerchantsFor(txs, latestMonthKey(txs), 5);
  if (merchants.length < 3) merchants = topMerchantsFor(txs, null, 5);
  if (!merchants.length) return <EmptyState text="No merchant data yet — upload a statement to get started." />;
  const max = Math.max(...merchants.map((m) => m.amount), 1);
  return (
    <div className="glass-card dash-card">
      <span className="card-label">Top merchants</span>
      <div className="category-list">
        {merchants.map((m) => (
          <div className="category-row" key={m.name}>
            <div className="category-top"><span className="category-name">{m.name}</span><span className="category-amount">{formatMoney(m.amount)}</span></div>
            <div className="category-track"><div className="category-fill" style={{ width: (m.amount / max) * 100 + "%", background: "var(--accent)" }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightsAsk({ transactions }) {
  const [q, setQ] = useState("");
  const [ans, setAns] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const ask = async (question) => {
    const query = String(question != null ? question : q).trim();
    if (!query || busy) return;
    setQ(query); setBusy(true); setErr(""); setAns("");
    try { const a = await aiAskInsights(query, transactions); setAns(a); }
    catch (e) { setErr((e && e.message) || "Something went wrong — please try again."); }
    setBusy(false);
  };
  const examples = ["Where am I overspending?", "How much do subscriptions cost me?", "Am I on track this month?"];
  return (
    <div className="ai-ask ai-ask-page">
      <div className="ai-ask-top">
        <span className="ai-ask-ico"><Icon name="ask" size={26} /></span>
        <span className="ai-ask-badge">AI</span>
      </div>
      <h2 className="ai-ask-title">Ask TwoPockets</h2>
      <p className="ai-ask-sub">Ask anything about your spending, bills, or budget — in plain English. I’ll answer from your own transactions.</p>
      <div className="ai-ask-row">
        <input className="ai-ask-input" placeholder="Can I afford a £250 weekend away?" value={q}
          onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") ask(); }} />
        <button className="ai-ask-btn" onClick={() => ask()} disabled={busy}>{busy ? <span className="btn-spinner" /> : "Ask"}</button>
      </div>
      {!ans && !busy && !err && (
        <div className="ai-ask-chips">
          {examples.map((ex) => <button key={ex} className="ai-ask-chip" onClick={() => ask(ex)}>{ex}</button>)}
        </div>
      )}
      {busy && <div className="ask-answer ask-loading">Looking through your transactions&hellip;</div>}
      {err && <div className="ask-answer ask-error">{err}</div>}
      {ans && !busy && <div className="ask-answer ask-md">{renderAskAnswer(ans)}</div>}
    </div>
  );
}
function InsightsCard({ transactions, targets, full, onOpenUpload }) {
  /* Rank by materiality, then cap. Ten insights is noise; the biggest four get read.
     Money mentioned in the text is the best available proxy for "does this matter". */
  const rankInsights = (list) => {
    const weight = { warning: 3, positive: 2, info: 1 };
    /* Kind matters more than tone: an overspend must lead, but a "priciest day"
       read is more useful than a fourth "category is up" line. */
    const kindBoost = {
      projection: 40, unpaidbill: 34, budget: 30, oneoff: 26, billup: 24,
      catchange: 20, newbill: 18, stoppedbill: 16, haunt: 14, weekend: 13,
      bigday: 12, concentration: 11, savingsrate: 10, billload: 9,
      volume: 7, merchant: 6
    };
    const biggestNumber = (s) => {
      const nums = String(s).match(/[\d,]+(?:\.\d+)?/g) || [];
      return nums.reduce((mx, n) => Math.max(mx, Number(n.replace(/,/g, "")) || 0), 0);
    };
    const sorted = list
      .map((ins, i) => ({ ins, i, k: kindBoost[ins.kind] || 5, w: weight[ins.type] || 1, mag: biggestNumber(ins.text) }))
      .sort((a, b) => (b.k - a.k) || (b.w - a.w) || (b.mag - a.mag) || (a.i - b.i))
      .map((o) => o.ins);
    /* Ranking on money alone surfaced four of the same shape ("X is up Y%").
       Cap each kind so the list reads as four different observations. */
    const cap = {};
    const seen = {};
    const picked = [];
    sorted.forEach((ins) => {
      const k = ins.kind || "other";
      const lim = cap[k] || 1;
      if ((seen[k] || 0) < lim) { seen[k] = (seen[k] || 0) + 1; picked.push(ins); }
    });
    /* If variety left us short, top up with whatever's left rather than show fewer. */
    sorted.forEach((ins) => { if (!picked.includes(ins)) picked.push(ins); });
    return picked;
  };
  const allBuilt = rankInsights(buildInsights(transactions || [], targets));
  const built = full ? allBuilt.slice(0, 4) : allBuilt.slice(0, 3);
  const insights = built.length ? built : [{ type: "info", text: "Upload a couple more months of statements to unlock month-on-month insights." }];
  const insightList = (
    <div className="glass-card dash-card">
      <span className="card-label">Insights</span>
      <div className="insight-list">
        {insights.map((ins, i) => (
          <div className={"insight-row insight-" + ins.type} key={i}>
            <span className="insight-icon"><Icon name={ins.type === "warning" ? "alert" : ins.type === "positive" ? "trending" : "info"} size={15} /></span>
            <span>{ins.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
  if (!full) return insightList;
  return (
    <React.Fragment>
      {insightList}
      <TrendsCard transactions={transactions} />
    </React.Fragment>
  );
}

function dataGapDays(transactions) {
  const dates = (transactions || []).filter((t) => t.date).map((t) => t.date).sort();
  const latest = dates.length ? dates[dates.length - 1] : null;
  if (!latest) return null;
  return Math.floor((today().getTime() - new Date(latest + "T00:00:00").getTime()) / 86400000);
}

function MonthEndReviewModal({ month, transactions, budgets, goal, onAction, onClose, isManual, plan, allTargets }) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const txs = transactions || [];
  const byCat = spendByCategoryForMonth(txs, month);
  const actualSpend = Math.round(spendForMonth(txs, month));
  const plannedSpend = Math.round(TX_CATEGORIES.reduce((s, c) => s + (Number(budgets[c]) || 0), 0));
  const net = plannedSpend - actualSpend; // + under (good), - over (tough)
  const over = net < 0;
  const label = monthLabelFromKey(month) + " " + month.slice(0, 4);
  const winCat = TX_CATEGORIES.map((c) => ({ c, diff: (Number(budgets[c]) || 0) - Math.round(byCat[c] || 0) })).sort((a, b) => b.diff - a.diff)[0];
  const extraCats = Object.keys(byCat).filter((c) => !TX_CATEGORIES.includes(c) && Math.round(byCat[c]) > 0).sort((a, b) => byCat[b] - byCat[a]);
  const max = Math.max(1, ...TX_CATEGORIES.map((c) => Math.max(Number(budgets[c]) || 0, Math.round(byCat[c] || 0))), ...extraCats.map((c) => Math.round(byCat[c] || 0)));

  let monthsLeft = 4;
  if (goal && goal.targetDate) {
    const now = new Date(); const td = new Date(goal.targetDate);
    const diff = (td.getFullYear() - now.getFullYear()) * 12 + (td.getMonth() - now.getMonth());
    if (diff > 0) monthsLeft = diff; else monthsLeft = 1;
  }
  const perMonth = over ? Math.round(Math.abs(net) / monthsLeft) : 0;
  const surplus = over ? 0 : net;

  /* ---- plan-aware reconciliation ---- */
  const planOn = !!(plan && plan.targetMonth);
  const actualIncome = Math.round(incomeForMonth(txs, month));
  const actualNet = actualIncome - actualSpend;
  const plannedIncomeM = planOn ? plannedIncomeFor(allTargets, month, txs) : 0;
  const plannedNetM = plannedIncomeM - plannedSpend;
  const planVar = actualNet - plannedNetM;
  const planBehind = planOn && planVar < 0;
  const planAhead = planOn && planVar > 0;
  const avgAll = React.useMemo(() => avgSpendByCategory(txs), [txs]);
  const firstFuture = addMonths(month, 1) > currentMonthKey() ? addMonths(month, 1) : currentMonthKey();
  const planFutureKeys = planOn ? monthKeysBetween(firstFuture, plan.targetMonth) : [];
  const planMonthsLeft = Math.max(1, planFutureKeys.length);
  const planPerMonth = Math.round(Math.abs(planVar) / planMonthsLeft);
  const planTrims = planBehind ? flexTrimBreakdown(allTargets, planFutureKeys[0] || firstFuture, planPerMonth, avgAll) : {};
  const planTrimTotal = Object.values(planTrims).reduce((s, v) => s + v, 0);
  const planAdds = (() => {
    if (!planAhead) return {};
    const base = {}; FLEX_CATEGORIES.forEach((c) => { base[c] = plannedCatFor(allTargets, planFutureKeys[0] || firstFuture, c, avgAll); });
    const total = FLEX_CATEGORIES.reduce((s, c) => s + base[c], 0);
    const out = {}; let used = 0;
    FLEX_CATEGORIES.forEach((c, i) => {
      const a = i === FLEX_CATEGORIES.length - 1 ? planPerMonth - used : Math.round(planPerMonth * (total > 0 ? base[c] / total : 1 / FLEX_CATEGORIES.length));
      out[c] = Math.max(0, a); used += out[c];
    });
    return out;
  })();
  const extendKey = planOn ? addMonths(plan.targetMonth, 1) : null;

  const act = async (action, payload) => {
    setBusy(true);
    await onAction(month, action, { net, ...payload });
    setBusy(false);
    setStep(3);
  };

  const pace = (() => {
    if (!goal) return null;
    const saved = Number(goal.saved) || 0, target = Number(goal.target) || 0;
    const savedPct = target ? Math.min(100, (saved / target) * 100) : 0;
    const projPct = target ? Math.max(0, Math.min(100, ((saved + net) / target) * 100)) : 0;
    return { saved, target, savedPct, projPct };
  })();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="glass-card review-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose}><Icon name="x" size={16} /></button>
        <div className="review-steps">
          {[0, 1, 2, 3].map((i) => <div key={i} className={"review-step-dot " + (i <= step ? "rsd-on" : "")} />)}
        </div>

        {step === 0 && (
          <div className="review-step">
            <div className="card-label" style={{ color: "var(--accent)" }}>{label}</div>
            <h2 className="review-h2">{label.split(" ")[0]} is done. Let’s see how it went.</h2>
            <div className="review-bigstat">
              <span className="review-bignum"><CountUp value={actualSpend} format={formatMoney} /></span>
              <span className="review-biglabel">spent of {formatMoney(plannedSpend)} budgeted</span>
            </div>
            {winCat && winCat.diff > 0 && <div className="review-win"><Icon name="checkcircle" size={13} /> Top category win — you came in {formatMoney(winCat.diff)} under on {winCat.c}</div>}
            <div className="review-minibars">
              {TX_CATEGORIES.map((c) => {
                const b = Number(budgets[c]) || 0, a = Math.round(byCat[c] || 0), o = a > b;
                return (
                  <div className="rmb-row" key={c}>
                    <span className="rmb-name">{c}</span>
                    <div className="rmb-track">
                      <div className="rmb-budget" style={{ width: (b / max) * 100 + "%" }} />
                      <div className="rmb-spent" style={{ width: (a / max) * 100 + "%", background: o ? "#ff6b6b" : "var(--accent)" }} />
                    </div>
                    <span className="rmb-val" style={{ color: o ? "#ff6b6b" : "var(--ink-2)" }}>{formatMoney(a)}</span>
                  </div>
                );
              })}
              {extraCats.map((c) => {
                const a = Math.round(byCat[c] || 0);
                return (
                  <div className="rmb-row" key={c}>
                    <span className="rmb-name">{displayCat(c)}</span>
                    <div className="rmb-track">
                      <div className="rmb-spent" style={{ width: (a / max) * 100 + "%", background: catColor(c) }} />
                    </div>
                    <span className="rmb-val" style={{ color: "var(--ink-2)" }}>{formatMoney(a)}</span>
                  </div>
                );
              })}
            </div>
            <button className="glass-btn primary" onClick={() => setStep(1)}>See the verdict</button>
          </div>
        )}

        {step === 1 && (
          <div className="review-step">
            <div className="card-label" style={{ color: "var(--accent)" }}>The verdict</div>
            {planOn
              ? <h2 className="review-h2">You saved <span style={{ color: planBehind ? "#ff6b6b" : "var(--accent)" }}>{formatMoney(actualNet)}</span> of the {formatMoney(plannedNetM)} planned</h2>
              : <h2 className="review-h2">{over ? "You overspent by " : "You saved "}<span style={{ color: over ? "#ff6b6b" : "var(--accent)" }}>{formatMoney(Math.abs(net))}</span></h2>}
            <p className="subtitle">{planOn ? "Money in minus money out, across all your accounts, in your home currency." : (over ? "Across all your accounts, in your home currency." : "Money left in the budget this month, in your home currency.")}</p>
            {planOn ? (
              <div className="pace-wrap">
                <div className="pace-head"><span>Your plan — {formatMoney(plan.targetBalance)} by {monthLabelFromKey(plan.targetMonth)} {plan.targetMonth.slice(0, 4)}</span><span style={{ color: planBehind ? "#ff6b6b" : "var(--accent)", fontWeight: 700 }}>{planVar === 0 ? "bang on plan" : formatMoney(Math.abs(planVar)) + (planBehind ? " behind" : " ahead")}</span></div>
                <p className="subtitle" style={{ margin: "8px 0 0" }}>{planBehind ? "Nothing has been changed — next you choose what this means for your goal." : planAhead ? "Nice work — next you choose what to do with the extra." : "Everything ties out — your goal is exactly where it should be."}</p>
              </div>
            ) : pace ? (
              <div className="pace-wrap">
                <div className="pace-head"><span>{goal.name}</span><span style={{ color: over ? "#ff6b6b" : "var(--accent)", fontWeight: 700 }}>{over ? formatMoney(Math.abs(net)) + " behind" : formatMoney(net) + " ahead"}</span></div>
                <div className="pace-track"><div className="pace-fill" style={{ width: pace.savedPct + "%" }} /><div className="pace-marker" style={{ left: pace.savedPct + "%" }} /></div>
                <div className="pace-foot"><span>{formatMoney(pace.saved)} saved</span><span>target {formatMoney(pace.target)}</span></div>
              </div>
            ) : (
              <p className="subtitle" style={{ fontStyle: "italic" }}>Set a savings goal to see how each month affects your pace.</p>
            )}
            <button className="glass-btn primary" onClick={() => setStep(2)}>{planOn && !planBehind && !planAhead ? "Continue" : "See my options"}</button>
            <button className="glass-btn ghost" onClick={() => setStep(0)}>Back</button>
          </div>
        )}

        {step === 2 && planOn && planBehind && (
          <div className="review-step">
            <div className="card-label" style={{ color: "var(--accent)" }}>Your call</div>
            <h2 className="review-h2">You're {formatMoney(-planVar)} behind plan. Three ways to handle it:</h2>
            <p className="subtitle">Nothing changes until you choose — it's your plan. Whichever you pick, the numbers on your Long-Term Plan update so everything still adds up.</p>
            <button className="plan-opt" disabled={busy} onClick={() => act("plan_accept", { amount: -planVar })}>
              <span className="plan-opt-title">1 · Accept it — move the goal</span>
              <span className="plan-opt-sub">Keep the same monthly targets. Your goal becomes <b>{formatMoney(plan.targetBalance + planVar)}</b> by {monthLabelFromKey(plan.targetMonth)} instead of {formatMoney(plan.targetBalance)}.</span>
            </button>
            <button className="plan-opt" disabled={busy} onClick={() => act("plan_catchup", { perMonth: planPerMonth, trims: planTrims, months: planFutureKeys })}>
              <span className="plan-opt-title">2 · Catch up — save a bit more each month</span>
              <span className="plan-opt-sub">Spread the {formatMoney(-planVar)} over the {planMonthsLeft} month{planMonthsLeft > 1 ? "s" : ""} left ≈ <b>{formatMoney(planPerMonth)}/month</b>, from your most flexible categories: {FLEX_CATEGORIES.filter((c) => planTrims[c] > 0).map((c) => c + " −" + formatMoney(planTrims[c])).join(", ") || "your budgets"}. You still hit <b>{formatMoney(plan.targetBalance)}</b>.{planTrimTotal < planPerMonth ? " (Flexible budgets only cover " + formatMoney(planTrimTotal) + "/mo — trim other categories on your plan for the rest.)" : ""}</span>
            </button>
            <button className="plan-opt" disabled={busy} onClick={() => act("plan_extend", {})}>
              <span className="plan-opt-title">3 · Extend — same goal, one month later</span>
              <span className="plan-opt-sub">Keep everything as it is. You still reach <b>{formatMoney(plan.targetBalance)}</b> — by {monthLabelFromKey(extendKey)} {extendKey.slice(0, 4)} instead of {monthLabelFromKey(plan.targetMonth)}.</span>
            </button>
            <button className="review-skip" disabled={busy} onClick={onClose}>Decide later — ask me again next time</button>
          </div>
        )}
        {step === 2 && planOn && planAhead && (
          <div className="review-step">
            <div className="card-label" style={{ color: "var(--accent)" }}>Ahead of plan</div>
            <h2 className="review-h2">You're {formatMoney(planVar)} ahead. What do you want to do with it?</h2>
            <p className="subtitle">Whichever you pick, your Long-Term Plan updates so everything still adds up.</p>
            <button className="plan-opt" disabled={busy} onClick={() => act("plan_bank", { amount: planVar })}>
              <span className="plan-opt-title">1 · Bank it — raise the goal</span>
              <span className="plan-opt-sub">Same monthly targets, bigger finish. Your goal becomes <b>{formatMoney(plan.targetBalance + planVar)}</b> by {monthLabelFromKey(plan.targetMonth)}.</span>
            </button>
            <button className="plan-opt" disabled={busy} onClick={() => act("plan_ease", { perMonth: planPerMonth, adds: planAdds, months: planFutureKeys })}>
              <span className="plan-opt-title">2 · Ease off — breathe a little</span>
              <span className="plan-opt-sub">Give yourself ≈ <b>{formatMoney(planPerMonth)}/month</b> back across {FLEX_CATEGORIES.filter((c) => planAdds[c] > 0).map((c) => c + " +" + formatMoney(planAdds[c])).join(", ")}. You still hit <b>{formatMoney(plan.targetBalance)}</b>.</span>
            </button>
            <button className="plan-opt" disabled={busy} onClick={() => act("plan_keep", {})}>
              <span className="plan-opt-title">3 · Keep it as a buffer</span>
              <span className="plan-opt-sub">Change nothing — you're simply ahead, and the buffer protects you if a future month slips.</span>
            </button>
          </div>
        )}
        {step === 2 && planOn && !planBehind && !planAhead && (
          <div className="review-step">
            <div className="card-label" style={{ color: "var(--accent)" }}>On plan</div>
            <h2 className="review-h2">Bang on plan — nothing to fix</h2>
            <p className="subtitle">You saved exactly what you planned, so your goal of {formatMoney(plan.targetBalance)} by {monthLabelFromKey(plan.targetMonth)} stays right on track.</p>
            <button className="glass-btn primary" disabled={busy} onClick={() => act("plan_keep", {})}>{busy ? <span className="btn-spinner" /> : "Great — continue"}</button>
          </div>
        )}
        {step === 2 && !planOn && over && (
          <div className="review-step">
            <div className="card-label" style={{ color: "var(--accent)" }}>Stay on track</div>
            <h2 className="review-h2">Trim the next {monthsLeft} month{monthsLeft > 1 ? "s" : ""} to stay on target?</h2>
            <p className="subtitle">Spreading the {formatMoney(Math.abs(net))} out keeps {goal ? goal.name : "your plan"} on track without one painful month.</p>
            <div className="plan-box">
              <div className="plan-row"><span>Reduce monthly budgets by</span><b style={{ color: "#ff6b6b" }}>{formatMoney(perMonth)}/mo</b></div>
              <div className="plan-row"><span>For</span><b>{monthsLeft} month{monthsLeft > 1 ? "s" : ""}</b></div>
            </div>
            <button className="glass-btn primary" disabled={busy} onClick={() => act("catchup", { perMonth, months: monthsLeft })}>{busy ? <span className="btn-spinner" /> : "Apply the plan"}</button>
            <button className="glass-btn ghost" disabled={busy} onClick={() => act("full", {})}>Take it all next month instead</button>
            <button className="review-skip" disabled={busy} onClick={() => act("skipped", {})}>Skip for now</button>
          </div>
        )}
        {step === 2 && !planOn && !over && (
          <div className="review-step">
            <div className="card-label" style={{ color: "var(--accent)" }}>Roll the win forward</div>
            <h2 className="review-h2">Move your {formatMoney(surplus)} surplus into savings?</h2>
            <p className="subtitle">{goal ? "Bank it toward " + goal.name + " and you’ll be ahead of pace." : "Roll it into next month, or set a savings goal to put it to work."}</p>
            <div className="plan-box">
              <div className="plan-row"><span>Add to</span><b>{goal ? goal.name : "next month"}</b></div>
              <div className="plan-row"><span>Amount</span><b style={{ color: "var(--accent)" }}>{formatMoney(surplus)}</b></div>
            </div>
            {goal
              ? <button className="glass-btn primary" disabled={busy} onClick={() => act("bank_surplus", { goalId: goal.id, amount: surplus })}>{busy ? <span className="btn-spinner" /> : "Add to savings"}</button>
              : <button className="glass-btn primary" disabled={busy} onClick={() => act("roll_surplus", { amount: surplus })}>{busy ? <span className="btn-spinner" /> : "Roll into next month"}</button>}
            <button className="review-skip" disabled={busy} onClick={() => act("skipped", {})}>Keep it in checking</button>
          </div>
        )}

        {step === 3 && (
          <div className="review-step review-done">
            <div className="review-check">✓</div>
            <h2 className="review-h2" style={{ textAlign: "center" }}>All set</h2>
            <p className="subtitle" style={{ textAlign: "center" }}>We’ve saved your {label} review. You can re-run it any time from the Monthly Review page.</p>
            <button className="glass-btn primary" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

function MonthlyReviewCard({ transactions, allTargets, isDev, onOpenReview, signupMonth }) {
  const txs = transactions || [];
  const done = completedMonthsWithData(txs);
  const [monthKey, setMonthKey] = useState(done.length ? done[done.length - 1] : currentMonthKey());
  if (!done.length) return <EmptyState text="Your monthly review appears once a month has finished. Upload statements covering a completed month to see how you did versus your plan." />;
  /* Budget lookup for the reviewed month, in priority order: its own targets, then
     the most recent earlier month with targets, then the EARLIEST targets on record.
     The last case covers completed months that predate signup — targets start at the
     signup month, so a new user's first review would otherwise have nothing to compare
     against. Whichever month we borrow from is surfaced to the user in the copy below. */
  /* Which month's targets we ended up using, so the copy can be honest about it.
     null = this month's own targets. */
  const [rawBudgets, borrowedFrom] = (() => {
    const own = (allTargets && allTargets[monthKey]) || {};
    if (TX_CATEGORIES.some((c) => Number(own[c]) > 0)) return [own, null];
    const all = allTargets ? Object.keys(allTargets).sort() : [];
    /* Prefer the most recent month at or before this one. */
    const earlier = all.filter((k) => k <= monthKey);
    for (let i = earlier.length - 1; i >= 0; i--) {
      const t = allTargets[earlier[i]] || {};
      if (TX_CATEGORIES.some((c) => Number(t[c]) > 0)) return [t, earlier[i]];
    }
    /* Nothing before this month — a completed month that predates signup. Use the
       EARLIEST targets on record as the baseline rather than showing no budget. */
    for (let i = 0; i < all.length; i++) {
      const t = allTargets[all[i]] || {};
      if (TX_CATEGORIES.some((c) => Number(t[c]) > 0)) return [t, all[i]];
    }
    return [own, null];
  })();
  const hasRealBudget = TX_CATEGORIES.some((c) => Number(rawBudgets[c]) > 0);
  const usingSampleTargets = isDev && !hasRealBudget;
  const budgets = usingSampleTargets ? DEMO_TARGETS : rawBudgets;
  const hasBudget = TX_CATEGORIES.some((c) => Number(budgets[c]) > 0);
  const byCat = spendByCategoryForMonth(txs, monthKey);
  const extraCats = Object.keys(byCat).filter((c) => !TX_CATEGORIES.includes(c) && Math.round(byCat[c]) > 0).sort((a, b) => byCat[b] - byCat[a]);
  const actualSpend = Math.round(spendForMonth(txs, monthKey));
  const actualIncome = Math.round(incomeForMonth(txs, monthKey));
  const plannedSpend = Math.round(TX_CATEGORIES.reduce((s, c) => s + (Number(budgets[c]) || 0), 0));
  let plannedIncome = Math.round(typicalIncome(txs, addMonths(monthKey, -1)));
  if (!plannedIncome) plannedIncome = actualIncome;
  const actualNet = actualIncome - actualSpend;
  const plannedNet = plannedIncome - plannedSpend;
  const label = monthLabelFromKey(monthKey) + " " + monthKey.slice(0, 4);
  const spendDiff = actualSpend - plannedSpend;
  const incomeDiff = actualIncome - plannedIncome;
  const netDiff = actualNet - plannedNet;

  return (
    <div className="review-wrap">
      <div className="glass-card dash-card">
        <div className="summary-head">
          <span className="card-label">Monthly review</span>
          <select className="slot-select" value={monthKey} onChange={(e) => setMonthKey(e.target.value)}>
            {done.slice().reverse().map((k) => <option key={k} value={k}>{monthLabelFromKey(k) + " " + k.slice(0, 4)}</option>)}
          </select>
        </div>
        <p className="page-intro">How {label} actually turned out, next to what you planned.</p>
        {onOpenReview && monthKey >= (signupMonth || new Date().toISOString().slice(0, 7)) && <button className="link-btn inline" style={{ margin: "-6px 0 14px" }} onClick={() => onOpenReview(monthKey)}>▶ Run the month-end review for {monthLabelFromKey(monthKey)}</button>}
        {usingSampleTargets && <p className="subtitle mr-sample-note" style={{ margin: "-8px 0 14px" }}>Preview only — showing sample targets (dev account). Set real budgets in Settings.</p>}
        {!usingSampleTargets && borrowedFrom && borrowedFrom !== monthKey && (
          <p className="subtitle mr-sample-note" style={{ margin: "-8px 0 14px" }}>
            You hadn't set budgets yet in {monthLabelFromKey(monthKey)}, so we're comparing against your {monthLabelFromKey(borrowedFrom)} targets.
          </p>
        )}
        <div className="review-cards">
          <div className={"review-tile " + (spendDiff === 0 ? "rt-flat" : (spendDiff < 0 ? "rt-good" : "rt-bad"))}>
            <span className="rt-label">You spent</span>
            <span className="rt-actual">{formatMoney(actualSpend)}</span>
            <span className="rt-planned">planned {hasBudget ? formatMoney(plannedSpend) : "—"}</span>
            {hasBudget && <span className="rt-verdict">{spendDiff === 0 ? "exactly on budget" : (spendDiff < 0 ? formatMoney(-spendDiff) + " under budget" : formatMoney(spendDiff) + " over budget")}</span>}
          </div>
          <div className={"review-tile " + (incomeDiff === 0 ? "rt-flat" : (incomeDiff > 0 ? "rt-good" : "rt-bad"))}>
            <span className="rt-label">You earned</span>
            <span className="rt-actual">{formatMoney(actualIncome)}</span>
            <span className="rt-planned">typical {formatMoney(plannedIncome)}</span>
            <span className="rt-verdict">{incomeDiff === 0 ? "in line with usual" : (incomeDiff > 0 ? formatMoney(incomeDiff) + " more than usual" : formatMoney(-incomeDiff) + " less than usual")}</span>
          </div>
          <div className={"review-tile " + (netDiff === 0 ? "rt-flat" : (netDiff > 0 ? "rt-good" : "rt-bad"))}>
            <span className="rt-label">Left over</span>
            <span className="rt-actual">{formatMoney(actualNet)}</span>
            <span className="rt-planned">planned {hasBudget ? formatMoney(plannedNet) : "—"}</span>
            {hasBudget && <span className="rt-verdict">{netDiff === 0 ? "right on plan" : (netDiff > 0 ? formatMoney(netDiff) + " better than plan" : formatMoney(-netDiff) + " worse than plan")}</span>}
          </div>
        </div>
      </div>

      <div className="glass-card dash-card">
        <span className="card-label">By category</span>
        {!hasBudget ? (
          <p className="subtitle" style={{ margin: "10px 0 0" }}>You didn't set budgets for {label}, so there's nothing to compare against. Set budgets in Settings to unlock the full review.</p>
        ) : (
          <div className="review-table">
            <div className="review-row review-head">
              <span>Category</span><span>Planned</span><span>Actual</span><span>Difference</span>
            </div>
            {TX_CATEGORIES.map((c) => {
              const b = Number(budgets[c]) || 0;
              const a = Math.round(byCat[c] || 0);
              const d = a - b;
              const over = d > 0;
              return (
                <div className="review-row" key={c}>
                  <span className="review-cat"><span className="cat-dot" style={{ background: catColor(c) }} />{c}</span>
                  <span>{formatMoney(b)}</span>
                  <span>{formatMoney(a)}</span>
                  <span className={d === 0 ? "rv-flat" : (over ? "rv-over" : "rv-under")}>{b === 0 && a === 0 ? "—" : (b === 0 ? "-" + formatMoney(a) + " unbudgeted" : (d === 0 ? formatMoney(0) : (over ? "-" + formatMoney(d) : "+" + formatMoney(-d))))}</span>
                </div>
              );
            })}
            {extraCats.map((c) => {
              const a = Math.round(byCat[c] || 0);
              return (
                <div className="review-row" key={c}>
                  <span className="review-cat"><span className="cat-dot" style={{ background: catColor(c) }} />{displayCat(c)}</span>
                  <span>{"—"}</span>
                  <span>{formatMoney(a)}</span>
                  <span className="rv-over">-{formatMoney(a)} unbudgeted</span>
                </div>
              );
            })}
            {(() => {
              const tp = TX_CATEGORIES.reduce((s, c) => s + (Number(budgets[c]) || 0), 0);
              const ta = Math.round([...TX_CATEGORIES, ...extraCats].reduce((s, c) => s + (byCat[c] || 0), 0));
              const td = ta - tp;
              const over = td > 0;
              return (
                <div className="review-row review-total">
                  <span className="review-cat">Total</span>
                  <span>{formatMoney(tp)}</span>
                  <span>{formatMoney(ta)}</span>
                  <span className={td === 0 ? "rv-flat" : (over ? "rv-over" : "rv-under")}>{tp === 0 ? "—" : (td === 0 ? formatMoney(0) : (over ? "-" + formatMoney(td) : "+" + formatMoney(-td)))}</span>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

function LongTermPlanCard({ transactions, allTargets, banks, accountData, plan, onEditPlan }) {
  const txs = transactions || [];
  const past = completedMonthsContinuous(txs);
  const [horizon, setHorizon] = useState(6);
  const curKey = currentMonthKey();
  const avg = React.useMemo(() => avgSpendByCategory(txs), [txs]);

  const planActive = !!(plan && plan.targetMonth >= curKey);
  const planExpired = !!(plan && plan.targetMonth < curKey);
  if (!past.length && !planActive) return <EmptyState text="Your long-term plan appears once we have at least one finished month. Upload a few months of statements and set your plan to see where you're heading." />;

  const lastKey = planActive ? plan.targetMonth : addMonths(curKey, horizon - 1);
  const futureKeys = monthKeysBetween(curKey, lastKey);
  const monthsAll = [...past, ...futureKeys];
  const isActual = (k) => k < curKey;
  /* Raw (unrounded) — rounding these before arithmetic pushed the residual into
     `other` and drifted every downstream balance by a pound or two per month. */
  const incM = (k) => incomeForMonth(txs, k);
  const spM = (k) => spendForMonth(txs, k);

  const balNowRaw = totalEstimatedBalance(banks, accountData, txs);
  const sumPastNet = past.reduce((s, k) => s + (incM(k) - spM(k)), 0);
  const curNetSoFar = incM(curKey) - spM(curKey);
  /* plan.openingBalance = balance at the start of the current month when the plan was made.
     Used only as a fallback anchor when statements can't give us a balance. */
  const planAnchor = planActive && plan && plan.openingBalance != null ? Number(plan.openingBalance) + curNetSoFar : null;
  const haveBalance = balNowRaw !== null || planAnchor !== null;
  const balNow = balNowRaw !== null ? Number(balNowRaw) : (planAnchor !== null ? planAnchor : 0);
  const startBal = balNow - sumPastNet - curNetSoFar;

  let run = startBal;
  const cols = monthsAll.map((k) => {
    const open = run;
    const inc = isActual(k) ? incM(k) : plannedIncomeFor(allTargets, k, txs);
    const cats = {};
    TX_CATEGORIES.forEach((c) => { cats[c] = isActual(k) ? (spendByCategoryForMonth(txs, k)[c] || 0) : plannedCatFor(allTargets, k, c, avg); });
    const catSum = TX_CATEGORIES.reduce((s, c) => s + cats[c], 0);
    /* Raw minus raw. Previously a rounded spM(k) less an unrounded catSum, so the
       rounding residual landed in `other` and skewed net + every later balance. */
    const other = isActual(k) ? Math.max(0, spM(k) - catSum) : 0;
    const net = inc - catSum - other;
    run += net;
    return { k, open, inc, cats, other, net, close: run, actual: isActual(k) };
  });
  const hasOther = cols.some((c) => Math.round(c.other) > 0);
  const endBal = cols.length ? cols[cols.length - 1].close : startBal;
  const gap = planActive ? Math.round(Math.round(plan.targetBalance) - endBal) : 0;
  const word = haveBalance ? "balance" : "total saved";

  const bals = cols.map((c) => c.close);
  const minB = Math.min(...bals, 0), maxB = Math.max(...bals, 1);
  const span = (maxB - minB) || 1;

  return (
    <div className="review-wrap">
      <div className="glass-card dash-card">
        <div className="summary-head">
          <span className="card-label">Long-term plan</span>
          {(planActive || planExpired)
            ? <button className="link-btn inline" onClick={onEditPlan}>Edit plan</button>
            : <select className="slot-select" value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}>
                <option value={3}>Next 3 months</option>
                <option value={6}>Next 6 months</option>
                <option value={12}>Next 12 months</option>
              </select>}
        </div>
        {planActive && (
          <>
            <div className="plan-headline">
              <span className="plan-big">{formatMoney(plan.targetBalance)}</span>
              <span className="plan-sub">your goal — {word} by the end of {monthLabelFromKey(plan.targetMonth)} {plan.targetMonth.slice(0, 4)}</span>
            </div>
            <div className={"plan-verdict " + (gap <= 0 ? "rt-good" : "rt-bad")}>
              {gap <= 0
                ? (gap === 0 ? "You're exactly on plan — keep it up!" : "On track — heading for " + formatMoney(endBal) + ", about " + formatMoney(-gap) + " ahead of your goal.")
                : "Heading for " + formatMoney(endBal) + " — about " + formatMoney(gap) + " behind your goal. Your next month-end review will help you decide how to close the gap."}
            </div>
          </>
        )}
        {planExpired && (
          <>
            <div className="plan-headline">
              <span className="plan-big">{formatMoney(endBal)}</span>
              <span className="plan-sub">{word} at the end of your plan ({monthLabelFromKey(plan.targetMonth)} {plan.targetMonth.slice(0, 4)})</span>
            </div>
            <div className="plan-verdict rt-good">Your plan has finished — set a new one to keep the momentum going.</div>
            <button className="glass-btn primary" style={{ marginTop: 12 }} onClick={onEditPlan}>Set a new plan</button>
          </>
        )}
        {!plan && (
          <>
            <div className="plan-headline">
              <span className="plan-big">{formatMoney(endBal)}</span>
              <span className="plan-sub">projected {word} by {monthLabelFromKey(lastKey)} {lastKey.slice(0, 4)}, if you keep to your current budgets</span>
            </div>
            <div className="plan-verdict rt-good">This is a projection from your targets — not a saved plan. Set a goal balance and date to turn it into one, with monthly targets that all tie back to one number.</div>
            <button className="glass-btn primary" style={{ marginTop: 12 }} onClick={onEditPlan}>Set a goal for this plan</button>
          </>
        )}
        <p className="subtitle" style={{ margin: "10px 0 0" }}>
          Finished months are real, from your statements; future months are your plan.{!haveBalance ? " Add your account balances in Settings to see this as a real balance instead of total saved." : ""}
        </p>
        <details className="ltp-how">
          <summary>How this works</summary>
          <p>Every column follows the same sum: opening balance + income − spending = closing balance. The final closing balance is your goal — so when any month changes, you can see exactly what it does to the end number.</p>
        </details>
      </div>

      <div className="glass-card dash-card">
        <span className="card-label">Projected {word} over time</span>
        <div className="trend-chart ltp-proj-chart">
          {cols.map((r) => (
            <div className="trend-bar-col" key={r.k}>
              <div className="trend-bar-wrap">
                <div className={"trend-bar ltp-bar " + (r.actual ? "plan-bar-actual" : "plan-bar-forecast")} style={{ height: (((r.close - minB) / span) * 100) + "%" }} title={formatMoney(r.close)}>
                  <span className="ltp-bar-val">{formatMoney(r.close)}</span>
                  <span className="trend-tip">{formatMoney(r.close)}</span>
                </div>
              </div>
              <span className="trend-bar-label">{monthLabelFromKey(r.k)}</span>
            </div>
          ))}
        </div>
        <div className="legend-row">
          <span className="legend-item"><span className="legend-dot" style={{ background: catColor("Income") }} />Actual so far</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: "var(--accent)" }} />Plan</span>
        </div>
      </div>

      <div className="glass-card dash-card">
        <span className="card-label">Month by month</span>
        <p className="page-intro">Months across the top — columns tagged <span className="ltp-actual-chip">✓ actual</span> are finished (straight from your statements); the rest are your plan. The bottom-right cell is where you land.</p>
        <div className="ltp-wrap">
          <table className="ltp-table">
            <thead>
              <tr>
                <th className="ltp-sticky"></th>
                {cols.map((r) => (
                  <th key={r.k} className={r.actual ? "ltp-actual-head" : "ltp-plan-head"}>
                    {monthLabelFromKey(r.k)} {r.k.slice(2, 4)}{r.actual ? <span className="ltp-actual-chip">✓ actual</span> : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="ltp-bal-row">
                <td className="ltp-sticky">Opening balance</td>
                {cols.map((r) => <td key={r.k} className={r.actual ? "ltp-actual" : "ltp-plan"}>{formatMoney(r.open)}</td>)}
              </tr>
              <tr>
                <td className="ltp-sticky"><span className="cat-dot" style={{ background: catColor("Income") }} />Income</td>
                {cols.map((r) => <td key={r.k} className={r.actual ? "ltp-actual" : "ltp-plan"}>{formatMoney(r.inc)}</td>)}
              </tr>
              {TX_CATEGORIES.map((c) => (
                <tr key={c}>
                  <td className="ltp-sticky"><span className="cat-dot" style={{ background: catColor(c) }} />{c}</td>
                  {cols.map((r) => <td key={r.k} className={(r.actual ? "ltp-actual" : "ltp-plan") + " ltp-neg"}>{Math.round(r.cats[c]) ? "−" + formatMoney(r.cats[c]) : formatMoney(0)}</td>)}
                </tr>
              ))}
              {hasOther && (
                <tr>
                  <td className="ltp-sticky"><span className="cat-dot" style={{ background: "#8b93a7" }} />Other spending</td>
                  {cols.map((r) => <td key={r.k} className={(r.actual ? "ltp-actual" : "ltp-plan") + " ltp-neg"}>{Math.round(r.other) ? "−" + formatMoney(r.other) : formatMoney(0)}</td>)}
                </tr>
              )}
              <tr className="ltp-bal-row ltp-close-row">
                <td className="ltp-sticky">Closing balance</td>
                {cols.map((r, i) => <td key={r.k} className={(r.actual ? "ltp-actual" : "ltp-plan") + (i === cols.length - 1 ? " ltp-goal-cell" : "")}>{formatMoney(r.close)}</td>)}
              </tr>
              <tr className="ltp-net-row">
                <td className="ltp-sticky">Saved this month</td>
                {cols.map((r) => <td key={r.k} className={(r.actual ? "ltp-actual" : "ltp-plan") + " " + (r.net >= 0 ? "rv-under" : "rv-over")}>{formatMoney(r.net)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CategoriseReviewModal({ transactions, onRecategorize, onClose }) {
  const [expandedName, setExpandedName] = useState(null);
  const [sortedCount, setSortedCount] = useState(0);
  const uncats = (transactions || []).filter((t) => t.category === "Uncategorized");
  const byName = {};
  uncats.forEach((t) => { (byName[t.name] = byName[t.name] || []).push(t); });
  const rows = Object.keys(byName).map((name) => {
    const list = byName[name];
    return { name, count: list.length, total: list.reduce((s, t) => s + Math.abs(t.amount), 0), latest: list.map((t) => t.date).sort().reverse()[0] || "" };
  }).sort((a, b) => b.total - a.total);
  const chipCats = [...spendCategories(), "Income", "Other"];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-card modal-card catrev-card" onClick={(e) => e.stopPropagation()}>
        <div className="brand-row" style={{ marginBottom: 6, justifyContent: "space-between" }}>
          <span className="brand-name">Categorise transactions</span>
          <button className="icon-btn" onClick={onClose} aria-label="Close" style={{ color: "var(--ink)" }}>{"×"}</button>
        </div>
        {rows.length === 0 ? (
          <div className="catrev-done">
            <div className="catrev-done-icon"><Icon name="checkcircle" size={26} /></div>
            <p>All sorted {"—"} every transaction now has a category.</p>
            <button className="glass-btn primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <p className="catrev-sub">{uncats.length} transaction{uncats.length !== 1 ? "s" : ""} across {rows.length} merchant{rows.length !== 1 ? "s" : ""} {"—"} pick a category and it applies to that merchant everywhere.{sortedCount > 0 ? " " + sortedCount + " sorted so far \u2713" : ""}</p>
            <div className="catrev-list">
              {rows.map((r) => (
                <div className={"catrev-row" + (expandedName === r.name ? " catrev-open" : "")} key={r.name}>
                  <button className="catrev-row-head" onClick={(e) => { const row = e.currentTarget.closest(".catrev-row"); const opening = expandedName !== r.name; setExpandedName(opening ? r.name : null); if (opening && row) setTimeout(() => row.scrollIntoView({ block: "nearest", behavior: "smooth" }), 80); }}>
                    <span className="catrev-name">{r.name}</span>
                    <span className="catrev-meta">{r.count > 1 ? r.count + " × · " : ""}{formatMoney(r.total)}{r.latest ? " · " + formatTxDate(r.latest) : ""}</span>
                    <span className="catrev-caret">{expandedName === r.name ? "\u25be" : "\u25b8"}</span>
                  </button>
                  {expandedName === r.name && (
                    <div className="catrev-chips">
                      {chipCats.map((c) => (
                        <button key={c} className="catrev-chip" onClick={() => { onRecategorize(r.name, c); setSortedCount((s) => s + r.count); setExpandedName(null); }}>
                          <span className="cat-dot" style={{ background: catColor(c) }} />{displayCat(c)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="nav-row" style={{ marginTop: 12 }}>
              <button className="glass-btn primary" onClick={onClose}>Finish later</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ text, title }) {
  return (
    <div className="glass-card dash-card empty-state">
      <div className="empty-icon-wrap"><span className="empty-icon"><Icon name="inbox" size={22} /></span></div>
      <p className="empty-title">{title || "Nothing here just yet"}</p>
      <p className="empty-text">{text || "Upload a statement and this will fill with your own data."}</p>
    </div>
  );
}

