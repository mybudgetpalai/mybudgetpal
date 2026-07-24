function TargetsPage({ allTargets, targets, transactions, onSaveAllTargets, initialEdit, onEditPlan }) {
  const cats = ["Income", ...spendCategories()];
  const monthKeys = React.useMemo(() => {
    const ks = Object.keys(allTargets || {}).filter((k) => /^\d{4}-\d{2}$/.test(k)).sort();
    return ks.length ? ks : [currentMonthKey()];
  }, [allTargets]);
  const [editing, setEditing] = useState(!!initialEdit);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState({});
  React.useEffect(() => {
    if (!editing) return;
    const d = {};
    monthKeys.forEach((k) => { d[k] = {}; cats.forEach((c) => { const raw = ((allTargets || {})[k] || {})[c]; d[k][c] = raw == null ? "0" : String(raw); }); });
    setDrafts(d);
  }, [editing]);
  const curKey = currentMonthKey();
  const byCat = spendByCategoryForMonth(transactions || [], curKey);
  const cellVal = (k, c) => editing ? (drafts[k] ? drafts[k][c] : 0) : (((allTargets || {})[k] || {})[c] || 0);
  const monthTotal = (k) => TX_CATEGORIES.reduce((s, c) => s + (Number(cellVal(k, c)) || 0), 0);

  const doSave = async () => {
    setSaving(true);
    const clean = {};
    monthKeys.forEach((k) => { clean[k] = {}; cats.forEach((c) => { clean[k][c] = Number(drafts[k] && drafts[k][c]) || 0; }); });
    try { if (onSaveAllTargets) await onSaveAllTargets(clean); } catch (e) {}
    setSaving(false); setEditing(false);
  };

  return (
    <div className="glass-card dash-card">
      <div className="summary-head">
        <span className="card-label">Monthly targets {"—"} all months</span>
        {!editing && (
          <div className="targets-actions">
            {onEditPlan && <button className="glass-btn ghost targets-rebuild-btn" onClick={onEditPlan}>{"\u21bb"} Rebuild from a goal</button>}
            <button className="glass-btn ghost targets-rebuild-btn" onClick={() => setEditing(true)}>Adjust numbers</button>
          </div>
        )}
      </div>
      <p className="page-intro">Your category targets across every month. {editing ? "Adjust any cell, then save." : "Rebuild the whole plan from a savings goal, or fine-tune individual numbers."}</p>

      <div className="budget-table-wrap">
        <table className="budget-table targets-table">
          <thead>
            <tr>
              <th className="bt-corner">Category</th>
              {monthKeys.map((k) => (
                <th key={k} className={"bt-month-head " + (k === curKey ? "bt-month-current" : "")}>{monthLabelFromKey(k)}{k === curKey ? " \u2022" : ""}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c} className={c === "Income" ? "bt-income-row" : ""}>
                <td className="bt-cat"><span className="cat-dot" style={{ background: c === "Income" ? "var(--pos)" : catColor(c) }} />{displayCat(c)}</td>
                {monthKeys.map((k) => (
                  <td key={k} className="bt-cell">
                    {editing ? (
                      <span className="bt-input-wrap"><span className="bt-cur">{homeSym()}</span>
                        <input className="bt-input" type="text" inputMode="numeric" value={fmtBalInput(drafts[k] ? drafts[k][c] : "")}
                          onChange={(e) => setDrafts((prev) => ({ ...prev, [k]: { ...prev[k], [c]: e.target.value.replace(/[^0-9.]/g, "") } }))} />
                      </span>
                    ) : <span className="bt-read-num">{formatMoney(cellVal(k, c))}</span>}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bt-total-row">
              <td className="bt-cat">Total spend</td>
              {monthKeys.map((k) => <td key={k} className="bt-cell bt-total-cell">{editing ? <span className="bt-total-disp"><span className="bt-cur">{homeSym()}</span><span className="bt-total-num">{formatNum(monthTotal(k))}</span></span> : <span className="bt-read-num" style={{ fontWeight: 700 }}>{formatMoney(monthTotal(k))}</span>}</td>)}
            </tr>
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="nav-row" style={{ marginTop: 14 }}>
          <button className="glass-btn ghost" disabled={saving} onClick={() => setEditing(false)}>Cancel</button>
          <button className="glass-btn primary" disabled={saving} onClick={doSave}>{saving ? <span className="btn-spinner" /> : "Save targets"}</button>
        </div>
      )}

      {!editing && (
        <div style={{ marginTop: 18 }}>
          <span className="card-label">This month so far {"—"} {currentMonthName()}</span>
          <div className="tx-list" style={{ marginTop: 8 }}>
            {TX_CATEGORIES.map((c) => {
              const v = Number(((allTargets || {})[curKey] || {})[c]) || 0;
              const spent = Math.round(byCat[c] || 0);
              return (
                <div className="tx-row" key={c}>
                  <div className="tx-info">
                    <span className="tx-name"><span className="cat-dot" style={{ background: catColor(c) }} />{c}</span>
                    <span className="tx-category">{v > 0 ? "of your " + formatMoney(v) + " target" : "no target set"}{v > 0 && spent > v ? " — over" : ""}</span>
                  </div>
                  <span className="tx-amount tgt-pair" style={v > 0 && spent > v ? { color: "var(--neg)" } : null}><b>{formatMoney(spent)}</b>{v > 0 ? <span className="tgt-of"> / {formatMoney(v)}</span> : null}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryManager({ transactions, catConfig, onSaveCatConfig, onRescanCategories, onRecategorize }) {
  const [renames, setRenames] = useState({ ...(catConfig.renames || {}) });
  const [custom, setCustom] = useState((catConfig.custom || []).map((c) => ({ ...c, keywords: [...(c.keywords || [])] })));
  const [newName, setNewName] = useState("");
  const [dirty, setDirty] = useState(false);
  const [justSaved, setJustSaved] = useState(false); /* only claim "Saved" after a real save */

  const nextColor = () => { const used = custom.map((c) => c.color); return CAT_PALETTE.find((c) => !used.includes(c)) || CAT_PALETTE[custom.length % CAT_PALETTE.length]; };
  const setBuiltinName = (canonical, val) => {
    setRenames((prev) => { const nx = { ...prev }; const t = val.trim(); if (!t || t === canonical) delete nx[canonical]; else nx[canonical] = t; return nx; });
    setDirty(true); setJustSaved(false);
  };
  const addCustom = () => {
    const nm = newName.trim(); if (!nm) return;
    const taken = [...spendCategories(), "Income", "Other"].some((c) => c.toLowerCase() === nm.toLowerCase()) || custom.some((c) => c.name.toLowerCase() === nm.toLowerCase());
    if (taken) return;
    setCustom((prev) => [...prev, { name: nm, color: nextColor(), keywords: [] }]); setNewName(""); setDirty(true); setJustSaved(false);
  };
  const updateCustom = (i, patch) => { setCustom((prev) => prev.map((c, j) => (j === i ? { ...c, ...patch } : c))); setDirty(true); setJustSaved(false); };
  const removeCustom = (i) => { setCustom((prev) => prev.filter((_, j) => j !== i)); setDirty(true); setJustSaved(false); };
  const save = (thenRescan) => {
    const clean = { renames, custom: custom.map((c) => ({ name: c.name.trim(), color: c.color, keywords: (c.keywords || []).map((k) => String(k).trim()).filter(Boolean) })).filter((c) => c.name) };
    onSaveCatConfig(clean); setDirty(false); setJustSaved(true);
    if (thenRescan && onRescanCategories) onRescanCategories();
  };

  return (
    <div className="catman">
      <div className="glass-card dash-card">
        <span className="card-label">Your categories</span>
        <p className="page-intro">Rename any to suit you {"—"} {"\u201C"}Dining{"\u201D"} could be {"\u201C"}Eating out{"\u201D"}. Renaming only changes the label; your data stays put. Add your own buckets at the bottom.</p>
        <div className="catman-list">
          {TX_CATEGORIES.map((c) => (
            <div className="catman-row" key={c}>
              <span className="cat-dot" style={{ background: catColor(c) }} />
              <input className="catman-input" value={renames[c] || c} onChange={(e) => setBuiltinName(c, e.target.value)} />
              {renames[c] && renames[c] !== c && <span className="catman-orig">was {c}</span>}
            </div>
          ))}
          {custom.map((c, i) => (
            <div className="catman-custom" key={"cust-" + i}>
              <div className="catman-row">
                <span className="cat-dot" style={{ background: c.color }} />
                <input className="catman-input" value={c.name} onChange={(e) => updateCustom(i, { name: e.target.value })} />
                <span className="catman-orig">your own</span>
                <button className="catman-del" onClick={() => removeCustom(i)} aria-label="Delete category">{"×"}</button>
              </div>
              <div className="catman-swatches">
                {CAT_PALETTE.map((col) => (
                  <button key={col} className={"catman-swatch" + (c.color === col ? " on" : "")} style={{ background: col }} onClick={() => updateCustom(i, { color: col })} aria-label="Pick colour" />
                ))}
              </div>
              <input className="catman-kw" value={(c.keywords || []).join(", ")} placeholder="Keywords, comma separated (e.g. airbnb, emirates, booking.com)" onChange={(e) => updateCustom(i, { keywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            </div>
          ))}
        </div>
        <div className="catman-add">
          <input className="catman-input" value={newName} placeholder="Add a category (e.g. Holidays, Kids)" onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addCustom(); }} />
          <button className="glass-btn ghost" onClick={addCustom}>Add</button>
        </div>
      </div>

      <div className="catman-actions">
        {/* Was a disabled Save button relabelled to "No changes" — a status
            message wearing a button's clothes. Status is text; buttons act. */}
        {dirty
          ? <button className="glass-btn ghost" onClick={() => save(false)}>Save changes</button>
          : <span className="catman-status">{justSaved ? "\u2713 Saved" : "No changes yet"}</span>}
        <button className="glass-btn primary" disabled={!dirty} onClick={() => save(true)}>Save {"\u0026"} re-sort transactions</button>
      </div>
    </div>
  );
}
function MainContent({ view, name, onOpenUpload, targets, banks, plan, onEditPlan, hasData, transactions, overviewSlots, onChangeOverviewSlots, homeLayout, onChangeHomeLayout, onResumeSetup, persona, goals, goalsApi, accountData, onRecategorize, runTour, tourStep, billExcludes, onToggleBillExclude, billRejects, onRejectBill, allTargets, isDev, onOpenReview, uncatCount, onOpenCatReview, rollovers, onSaveAllTargets, targetsInitialEdit, signupMonth, catConfig, onSaveCatConfig, onRescanCategories, billsNudge, onOpenBillsSetup, onDismissBillsNudge }) {
  if (view === "overview") return (
    <OverviewHome onOpenUpload={onOpenUpload} name={name} targets={targets} transactions={transactions} rollovers={rollovers} banks={banks} accountData={accountData} goals={goals} billExcludes={billExcludes} uncatCount={uncatCount} onOpenCatReview={onOpenCatReview} runTour={runTour} tourStep={tourStep} hasData={hasData} homeLayout={homeLayout} onChangeHomeLayout={onChangeHomeLayout} onResumeSetup={onResumeSetup} persona={persona} plan={plan} billsNudge={billsNudge} onOpenBillsSetup={onOpenBillsSetup} onDismissBillsNudge={onDismissBillsNudge} />
  );
  if (view === "breakdown") return hasData ? <BreakdownPage transactions={transactions} targets={targets} allTargets={allTargets} onOpenCatReview={onOpenCatReview} /> : <EmptyState text="No spending data yet — upload a statement to see your breakdown." />;
  if (view === "targets") return <TargetsPage allTargets={allTargets} targets={targets} transactions={transactions} onSaveAllTargets={onSaveAllTargets} initialEdit={targetsInitialEdit} onEditPlan={onEditPlan} />;
  if (view === "monthlyreview") return hasData ? <MonthlyReviewCard transactions={transactions} allTargets={allTargets} isDev={isDev} onOpenReview={onOpenReview} signupMonth={signupMonth} /> : <EmptyState text="No data yet — upload a statement to see your monthly review." />;
  if (view === "longterm") return hasData ? <LongTermPlanCard transactions={transactions} allTargets={allTargets} banks={banks} accountData={accountData} plan={plan} onEditPlan={onEditPlan} /> : <EmptyState text="No data yet — upload a statement to build your long-term plan." />;
  if (view === "transactions") return hasData ? <TransactionFeed transactions={transactions} onRecategorize={onRecategorize} /> : <EmptyState text="No transactions yet — upload a statement to see them here." />;
  if (view === "trends") return hasData ? <TrendsCard transactions={transactions} /> : <EmptyState text="No trend data yet — upload a few months of statements." />;
  if (view === "bills") return hasData ? <BillsCard transactions={transactions} confirmed={billExcludes} onToggleConfirm={onToggleBillExclude} rejected={billRejects} onReject={onRejectBill} onOpenSetup={onOpenBillsSetup} editable /> : <EmptyState text="No bills detected yet — upload a statement to get started." />;
  if (view === "categories") return <CategoryManager transactions={transactions} catConfig={catConfig} onSaveCatConfig={onSaveCatConfig} onRescanCategories={onRescanCategories} onRecategorize={onRecategorize} />;
  if (view === "accounts") return <BankAccountsCard banks={banks} transactions={transactions} accountData={accountData} />;
  if (view === "insights") return hasData ? <InsightsCard transactions={transactions} targets={targets} onOpenUpload={onOpenUpload} full /> : <EmptyState text="No insights yet — upload a statement to get started." />;
  if (view === "ask") return <InsightsAsk transactions={transactions} />;
  return null;
}
function MappingScreen({ transactions, onRecategorize, onBack, theme }) {
  const [query, setQuery] = useState("");
  const map = {};
  (transactions || []).forEach((t) => {
    if (!map[t.name]) map[t.name] = { name: t.name, category: t.category, count: 0, total: 0 };
    map[t.name].count += 1;
    if (t.amount < 0) map[t.name].total += Math.abs(t.amount);
  });
  let rows = Object.values(map);
  const q = query.trim().toLowerCase();
  if (q) rows = rows.filter((r) => r.name.toLowerCase().includes(q));
  rows.sort((a, b) => b.count - a.count);
  return (
    <div className="settings-body">
      <h2 className="page-heading">Category Mapping</h2>
        <div className="dash-card settings-section">
          <span className="card-label">Merchant categories</span>
          <p className="subtitle" style={{ margin: "8px 0 0" }}>Change a merchant’s category and it updates every transaction with that name — and applies to future uploads.</p>
          <input className="glass-input" style={{ marginTop: 12 }} placeholder="Search merchant name…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <p className="mapping-count">{rows.length} unique merchant{rows.length !== 1 ? "s" : ""}</p>
          <div className="mapping-list">
            {rows.length === 0 ? (
              <p className="subtitle" style={{ margin: 0 }}>No merchants to show yet.</p>
            ) : rows.map((r) => (
              <div className="mapping-row" key={r.name}>
                <div className="mapping-info">
                  <span className="mapping-name">{r.name}</span>
                  <span className="mapping-meta">{r.count} txn{r.count !== 1 ? "s" : ""}{r.total > 0 ? " \u00B7 " + formatMoney(r.total) : ""}</span>
                </div>
                <CategoryEditor value={r.category} onChange={(cat) => onRecategorize(r.name, cat)} />
              </div>
            ))}
          </div>
        </div>
      </div>
  );
}
const DEMO_BANK = "Demo Bank";
const DEMO_TRANSACTIONS = (() => {
  const now = new Date();
  const mk = (m, day, name, amount, category) => {
    const d = new Date(now.getFullYear(), now.getMonth() - m, day);
    return { id: "demo-" + name.replace(/[^a-z0-9]/gi, "") + "-" + m + "-" + day, date: d.toISOString().slice(0, 10), name, amount, category, bank: DEMO_BANK };
  };
  const rows = [];
  for (let m = 2; m >= 0; m--) {
    rows.push(mk(m, 1, "SALARY - ACME LTD", 3200, "Income"));
    rows.push(mk(m, 3, "SPINNEYS DUBAI", -184, "Groceries"));
    rows.push(mk(m, 5, "CARREFOUR MALL", -212, "Groceries"));
    rows.push(mk(m, 6, "CAREEM RIDE", -34, "Transport"));
    rows.push(mk(m, 8, "STARBUCKS DIFC", -28, "Dining"));
    rows.push(mk(m, 10, "NETFLIX.COM", -46, "Subscriptions"));
    rows.push(mk(m, 12, "DEWA UTILITIES", -310, "Bills"));
    rows.push(mk(m, 14, "AMAZON.AE", -220, "Shopping"));
    rows.push(mk(m, 16, "TALABAT ORDER", -62, "Dining"));
    rows.push(mk(m, 19, "SALIK TOLL", -20, "Transport"));
    rows.push(mk(m, 22, "NOON.COM", -155, "Shopping"));
    rows.push(mk(m, 25, "DU MOBILE", -110, "Bills"));
    rows.push(mk(m, 27, "COSTA COFFEE", -24, "Dining"));
  }
  return rows;
})();
const DEMO_TARGETS = { Groceries: 450, Dining: 200, Transport: 120, Shopping: 400, Subscriptions: 80, Bills: 450 };

function FeedbackModal({ name, onClose, onSubmitted, pushToast }) {
  const [likes, setLikes] = useState("");
  const [dislikes, setDislikes] = useState("");
  const [improve, setImprove] = useState("");
  const [busy, setBusy] = useState(false);
  const canSend = !!(likes.trim() || dislikes.trim() || improve.trim());
  const ta = { minHeight: 60, resize: "vertical", width: "100%", boxSizing: "border-box" };
  const submit = async () => {
    setBusy(true);
    try {
      const usr = (await supabaseClient.auth.getUser()).data.user;
      const { error } = await supabaseClient.from("feedback").insert({
        user_id: usr ? usr.id : null, email: usr ? usr.email : null, name: name || null,
        likes: likes.trim() || null, dislikes: dislikes.trim() || null, improve: improve.trim() || null,
      });
      if (error) throw error;
      if (usr) { try { await supabaseClient.from("profiles").upsert({ id: usr.id, feedback_submitted: true }); } catch (e) {} }
      pushToast("Thanks — your feedback's been sent", "success");
      onSubmitted();
    } catch (e) { pushToast("Couldn't send feedback: " + (e.message || e), "error"); setBusy(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-card modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="brand-row" style={{ marginBottom: 4, justifyContent: "space-between" }}>
          <span className="brand-name">Share your feedback</span>
          <button className="icon-btn" onClick={onClose} aria-label="Close" style={{ color: "var(--ink)" }}>{"×"}</button>
        </div>
        <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 14px" }}>A few quick thoughts help shape what comes next {"—"} all optional.</p>
        <div className="field-group">
          <label className="field-label">What do you like?</label>
          <textarea className="glass-input" style={ta} value={likes} onChange={(e) => setLikes(e.target.value)} autoFocus />
        </div>
        <div className="field-group">
          <label className="field-label">What don't you like?</label>
          <textarea className="glass-input" style={ta} value={dislikes} onChange={(e) => setDislikes(e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label">What could we do to make this more useful for you?</label>
          <textarea className="glass-input" style={ta} value={improve} onChange={(e) => setImprove(e.target.value)} />
        </div>
        <div className="nav-row">
          <button className="glass-btn primary" disabled={!canSend || busy} onClick={submit}>{busy ? <span className="btn-spinner" /> : "Send feedback"}</button>
        </div>
      </div>
    </div>
  );
}

function MobileMenuSheet({ open, onClose, name, views, active, onSelect, onOpenSettings, onLogout }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  const pages = (views || VIEWS).filter((v) => v.key !== "accounts" && v.key !== "categories");
  const hasAccounts = (views || VIEWS).some((v) => v.key === "accounts");
  return (
    <React.Fragment>
      <div className={"mms-scrim" + (open ? " mms-scrim-open" : "")} onClick={onClose} />
      <div className={"mms-sheet" + (open ? " mms-sheet-open" : "")} role="dialog" aria-label="Menu">
        <div className="mms-grab" />
        <button className="mms-profile" onClick={() => { onClose(); onOpenSettings(); }}>
          <span className="mms-av">{initial}</span>
          <span className="mms-profile-txt"><b>{name || "Your profile"}</b><small>View profile &amp; settings</small></span>
          <span className="mms-chev"><Icon name="trending" size={16} /></span>
        </button>
        <div className="mms-label">All pages</div>
        {pages.map((v) => (
          <button key={v.key} className={"mms-row" + (active === v.key ? " mms-row-active" : "")} onClick={() => { onClose(); onSelect(v.key); }}>
            <span>{v.label}</span>
          </button>
        ))}
        <div className="mms-label">Account</div>
        {hasAccounts && <button className={"mms-row" + (active === "accounts" ? " mms-row-active" : "")} onClick={() => { onClose(); onSelect("accounts"); }}><span>Bank Accounts</span></button>}
        <button className="mms-row" onClick={() => { onClose(); onOpenSettings(); }}><span>Settings</span></button>
        <button className="mms-row mms-row-danger" onClick={onLogout}><span>Log out</span></button>
      </div>
    </React.Fragment>
  );
}
function MobileBottomNav({ active, menuOpen, onHome, onBreakdown, onUpload, onTargets, onMenu, tourSpot }) {
  const Tab = ({ view, on, label, children }) => (
    <button className={"mbn-tab" + (active === view ? " mbn-active" : "")} onClick={on} aria-label={label} title={label}>
      <span className="mbn-hl" />{children}
    </button>
  );
  /* Home = outline house (V1). Spending = filled pie (V5). Targets = concentric target. */
  const homeIcon = (
    <svg className="ic" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 11.5 12 4l8 7.5" /><path d="M6 10v9a1 1 0 0 0 1 1h3v-5a2 2 0 0 1 4 0v5h3a1 1 0 0 0 1-1v-9" />
    </svg>
  );
  const spendIcon = (
    <svg className="ic" width={24} height={24} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11 3.1A9 9 0 1 0 20.9 13H11z" /><path d="M13 2.1V11h8.9A9 9 0 0 0 13 2.1z" fillOpacity="0.45" />
    </svg>
  );
  const targetIcon = (
    <svg className="ic" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
  return (
    <div className="mobile-bottom-nav" role="navigation" aria-label="Primary">
      <Tab view="overview" on={onHome} label="Home">{homeIcon}</Tab>
      <Tab view="breakdown" on={onBreakdown} label="Spending Breakdown">{spendIcon}</Tab>
      <div className="mbn-ctr" data-tour-active={tourSpot === "upload" ? "1" : undefined}><button className="mbn-plus" onClick={onUpload} aria-label="Upload statement" title="Upload statement"><Icon name="plus" size={25} /></button></div>
      <Tab view="targets" on={onTargets} label="Targets">{targetIcon}</Tab>
      <button className={"mbn-tab mbn-burger" + (menuOpen ? " mbn-active" : "")} data-tour-active={tourSpot === "menu" ? "1" : undefined} onClick={onMenu} aria-label="Menu" title="Menu"><span className="mbn-hl" /><span className="mbn-burger-lines" /></button>
    </div>
  );
}
function DashboardScreen({ name, targets, banks, bankRows, plan, onEditPlan, onOpenAdmin, isAdmin, signupMonth, onOpenSettings, onOpenMapping, showExtraBanner, onCompleteExtra, onDismissExtra, setupPending, onResumeSetup, setupIntroOpen, onSetupStart, onSetupSkip, setupQuestionsOpen, setupQuestionsProps, persona, onSetPersona, hasData, onLogout, transactions, onAddTransactions, pushToast, overviewSlots, onChangeOverviewSlots, homeLayout, onChangeHomeLayout, goals, goalsApi, accountData, isDev, onResetDev, onRecategorize, runTour, onFinishTour, navViews, onChangeNavViews, billExcludes, onToggleBillExclude, allTargets, usingDemo, theme, rollovers, onOpenReview, onSaveAllTargets, openTargetsEdit, onConsumeTargetsEdit, overlayScreen, catConfig, onSaveCatConfig, onRescanCategories, userId, onOpenLegal, onSaveName, onRemoveBank, onAddBank, onSaveTargets, onChangeTheme, onSaveCurrency, onSaveFxRate, billRejects, onRejectBill, billsSetupDone, billsSetupOpen, onOpenBillsSetup, onCloseBillsSetup, onSaveBillsSetup, billsNudgeHidden, onDismissBillsNudge }) {
  const [panelOpen, setPanelOpen] = useState(() => { if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 640px)").matches) return false; return !runTour; });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [view, setView] = useHashView(openTargetsEdit ? "targets" : "overview");
  const [tInitEdit, setTInitEdit] = useState(!!openTargetsEdit);
  /* Item 16: how many recurring payments we could offer to track. Only meaningful
     once there's data and the Cx hasn't been through the flow yet. */
  const billsDetectedN = React.useMemo(
    () => (billsSetupDone || !hasData) ? 0 : detectRecurringBills(transactions || []).filter((b) => b.amount > 0).length,
    [billsSetupDone, hasData, transactions]);
  const billsNudge = billsNudgeHidden ? 0 : billsDetectedN;
  /* The bills sheet never opens by itself — it surfaces as an inbox task instead
     (popping up mid-session on reopen felt random and interruptive). */
  /* Cards nested well below this can request a page via goToView(). */
  React.useEffect(() => {
    const handler = (e) => { if (e && e.detail) { setView(e.detail); setTInitEdit(false); } };
    window.addEventListener("mbp-goto", handler);
    const billsHandler = () => { if (onOpenBillsSetup) onOpenBillsSetup(); };
    window.addEventListener("mbp-bills-setup", billsHandler);
    return () => { window.removeEventListener("mbp-goto", handler); window.removeEventListener("mbp-bills-setup", billsHandler); };
  }, []);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  React.useEffect(() => {
    if (!runTour) return;
    const onKey = (e) => { if (e.key === "Escape") onFinishTour(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [runTour, onFinishTour]);
  const [customiseOpen, setCustomiseOpen] = useState(false);
  const [catReviewOpen, setCatReviewOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(true);
  React.useEffect(() => { let on = true; (async () => { try { const usr = (await supabaseClient.auth.getUser()).data.user; if (!usr) return; const { data } = await supabaseClient.from("profiles").select("feedback_submitted").eq("id", usr.id).maybeSingle(); if (on) setFeedbackDone(!!(data && data.feedback_submitted)); } catch (e) {} })(); return () => { on = false; }; }, []);
  React.useEffect(() => { if (openTargetsEdit && onConsumeTargetsEdit) onConsumeTargetsEdit(); }, []);

  const navKeys = navViews || VIEWS.map((v) => v.key);
  const visibleViews = VIEWS.filter((v) => navKeys.includes(v.key));
  const SPECIAL_VIEWS = ["settings", "mapping", "ask"];
  const effectiveView = runTour ? "overview" : ((navKeys.includes(view) || SPECIAL_VIEWS.includes(view)) ? view : "overview");
  /* Per-view scroll memory. Each page remembers where you left it for the rest of
     the session: leave Overview halfway down, go to Breakdown (which opens at the
     top because it has no saved position yet), come back to Overview and you land
     where you were. Cleared on refresh/logout because it's a plain ref, not storage.
     Desktop scrolls an inner .main-content pane; mobile scrolls the window — both
     are captured. */
  const scrollMemory = React.useRef({});
  React.useEffect(() => {
    /* html/body carry a global `scroll-behavior: smooth`, which OVERRIDES a JS
       instant scroll and would make the page visibly travel on every nav. Flip it
       to auto for the duration of the jump, then restore — same trick as
       scrollTourTargetIntoView. */
    const getPane = () => { try { return document.querySelector(".main-content"); } catch (e) { return null; } };
    const withInstantScroll = (fn) => {
      const roots = [document.documentElement, document.body, getPane()];
      const prev = roots.map((r) => (r && r.style ? r.style.scrollBehavior : ""));
      roots.forEach((r) => { if (r && r.style) r.style.scrollBehavior = "auto"; });
      try { fn(); } finally { roots.forEach((r, i) => { if (r && r.style) r.style.scrollBehavior = prev[i]; }); }
    };
    const readPos = () => {
      const pane = getPane();
      let win = 0;
      try { win = window.pageYOffset || (document.scrollingElement ? document.scrollingElement.scrollTop : 0) || 0; } catch (e) {}
      return { pane: pane ? pane.scrollTop : 0, win: win };
    };
    const applyPos = (pos) => {
      withInstantScroll(() => {
        const pane = getPane();
        if (pane) pane.scrollTop = pos.pane;
        try { window.scrollTo(0, pos.win); } catch (e) {}
        try { if (document.scrollingElement) document.scrollingElement.scrollTop = pos.win; } catch (e) {}
      });
    };

    /* Key off the view actually RENDERED (effectiveView), not the requested one:
       during the tour, and for a view that isn't in the visible nav, the shell
       falls back to overview — keying on `view` would file the position under a
       page that was never on screen. */
    const key = effectiveView;
    const saved = scrollMemory.current[key];
    /* Restore on the next frame: the incoming page's content has to exist before it
       can be scrolled, otherwise the container is still short and the position
       clamps to 0. A saved position of 0 (or none) is just a normal jump to top. */
    let raf1 = 0, raf2 = 0;
    applyPos(saved || { pane: 0, win: 0 });
    if (saved && (saved.pane > 0 || saved.win > 0)) {
      raf1 = requestAnimationFrame(() => {
        applyPos(saved);
        raf2 = requestAnimationFrame(() => applyPos(saved));
      });
    }

    /* Track the live position while this page is open. Passive listeners so
       scrolling stays smooth; the value is only read on the way out. */
    let latest = saved || { pane: 0, win: 0 };
    const onScroll = () => { latest = readPos(); };
    const pane = getPane();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (pane) pane.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf1); cancelAnimationFrame(raf2);
      window.removeEventListener("scroll", onScroll);
      if (pane) pane.removeEventListener("scroll", onScroll);
      /* Cleanup runs while the OUTGOING page is still on screen, so this captures
         where the Cx actually left it. */
      scrollMemory.current[key] = latest;
    };
  }, [effectiveView]);
  const tourHasTargets = TX_CATEGORIES.some((c) => Number((targets || {})[c]) > 0);
  const tourMonthKey = overviewMonthKey(transactions || []);
  const tourCopy = overviewTour({
    hasTargets: tourHasTargets,
    monthLabel: tourMonthKey === currentMonthKey() ? "" : monthLabelFromKey(tourMonthKey),
  });
  const copy = tourCopy[tourStep] || { title: "", body: "" };
  const tourSpot = runTour ? (copy.spot || null) : null;
  /* The last three steps point at the top bar and the side menu rather than at
     anything in the scrolling overview, so bring the page back up to show them.
     The side menu also has to be open for the menu step to mean anything. */
  React.useEffect(() => {
    if (!tourSpot) return;
    const mob = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 640px)").matches;
    if (tourSpot === "menu") setPanelOpen(true);
    const sc = document.querySelector(".main-content-wide");
    const t = setTimeout(() => {
      try { if (sc) sc.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) {}
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) {}
    }, 60);
    return () => clearTimeout(t);
  }, [tourSpot]);
  const advanceTour = () => { if (tourStep >= tourCopy.length - 1) { setPanelOpen(false); onFinishTour(); } else setTourStep((s) => s + 1); };
  const demoActive = runTour && !hasData;
  const viewTransactions = demoActive ? DEMO_TRANSACTIONS : transactions;
  const viewTargets = demoActive ? DEMO_TARGETS : targets;
  const viewHasData = demoActive ? true : hasData;
  const uncatCount = (viewTransactions || []).filter((t) => t.category === "Uncategorized").length;
  const completedMonths = completedMonthsWithData(viewTransactions || []);
  const inboxTasks = [];
  if (billsDetectedN > 0) inboxTasks.push({ id: "bills-setup", icon: "bank", title: "Are these your bills?", desc: "We spotted " + billsDetectedN + " repeating payment" + (billsDetectedN !== 1 ? "s" : "") + " \u2014 confirm which ones are bills.", action: () => onOpenBillsSetup() });
  if (uncatCount > 0) inboxTasks.push({ id: "uncat", icon: "tag", title: uncatCount + " transaction" + (uncatCount !== 1 ? "s" : "") + " to categorise", desc: "Assign a category so they land in the right budget.", action: () => setCatReviewOpen(true) });
  /* setupPending only reflects profile.setup_completed; if targets already exist the task is
     stale and unclearable, so treat real targets as evidence setup is effectively done. */
  const hasAnyTarget = Object.values(viewTargets || {}).some((v) => Number(v) > 0);
  if (setupPending && !hasAnyTarget) inboxTasks.push({ id: "overview-setup", icon: "target", title: "Set up your overview", desc: "3 minutes: a few questions plus your targets, and we'll shape your dashboard.", action: () => { if (onResumeSetup) onResumeSetup(); } });
  if (showExtraBanner) inboxTasks.push({ id: "setup", icon: "sliders", title: "Finish setting up your account", desc: "A couple of quick questions to personalise things.", action: () => { if (onCompleteExtra) onCompleteExtra(); } });
  const reviewBaseline = signupMonth || new Date().toISOString().slice(0, 7);
  if (completedMonths.length && onOpenReview) { const rm = completedMonths[completedMonths.length - 1]; if (rm >= reviewBaseline) inboxTasks.push({ id: "review-" + rm, icon: "calendar", title: "Month-end review for " + monthLabelFromKey(rm), desc: "See how the month landed versus your plan.", action: () => onOpenReview(rm) }); }
  const dataGap = dataGapDays(viewTransactions);
  if (dataGap != null && dataGap >= 3) inboxTasks.push({ id: "datagap", icon: "calendar", title: dataGap + " days of data missing", desc: "Upload your latest statement for sharper insights.", action: () => setUploadOpen(true) });
  if (!feedbackDone && !demoActive) inboxTasks.push({ id: "feedback", icon: "edit", title: "Share your feedback", desc: "Tell us what’s working and what could be better.", action: () => setFeedbackOpen(true) });

  return (
    <div className={"app-shell stage-fade" + (usingDemo && !runTour ? " has-demo-bar" : "")} data-theme={normalizeTheme(theme)}>
      {usingDemo && !runTour && (
        <div className="demo-reminder">
          <span className="demo-reminder-text"><Icon name="chart" size={13} /> You’re exploring with <strong>sample data</strong> — these numbers aren’t yours yet.</span>
          <button className="demo-reminder-btn" onClick={() => setUploadOpen(true)}>Add your real bank statement</button>
        </div>
      )}

      <TopBar onToggleMenu={() => setPanelOpen((v) => !v)} name={name} onOpenSettings={() => { setView("settings"); setTInitEdit(false); }} onOpenMapping={() => { setView("mapping"); setTInitEdit(false); }} onOpenCategories={() => { setView("categories"); setTInitEdit(false); }} onLogout={onLogout} onOpenUpload={() => setUploadOpen(true)} onGoHome={() => { setView("overview"); setTInitEdit(false); }} onOpenAsk={() => { setView("ask"); setTInitEdit(false); }} tasks={inboxTasks} dataGap={dataGap} isAdmin={isAdmin} onOpenAdmin={onOpenAdmin} tourSpot={tourSpot} />
      <div className="body-row">
        <div className={"side-panel-backdrop " + (panelOpen ? "backdrop-visible" : "")} onClick={() => setPanelOpen(false)} />
        <SidePanel open={panelOpen} active={effectiveView} setActive={(v) => { setView(v); setTInitEdit(false); if (typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches) setPanelOpen(false); }} isDev={isDev} onResetDev={onResetDev} views={visibleViews} onCustomise={() => setCustomiseOpen(true)} onClose={() => setPanelOpen(false)} tourSpot={tourSpot} onOpenSettings={() => { setView("settings"); setTInitEdit(false); }} onLogout={onLogout} />
        <div className={"main-content " + (effectiveView === "overview" ? "main-content-wide" : "")}>{effectiveView === "settings" ? (<SettingsScreen persona={persona} onSetPersona={onSetPersona} setupPending={setupPending} onResumeSetup={onResumeSetup} extraPending={showExtraBanner} onCompleteExtra={onCompleteExtra} name={name} banks={banks} bankRows={bankRows} targets={targets} userId={userId} pushToast={pushToast} onBack={() => { setView("overview"); setTInitEdit(false); }} onOpenLegal={onOpenLegal} onLogout={onLogout} onSaveName={onSaveName} onRemoveBank={onRemoveBank} onAddBank={onAddBank} onSaveTargets={onSaveTargets} theme={theme} onChangeTheme={onChangeTheme} onSaveCurrency={onSaveCurrency} onSaveFxRate={onSaveFxRate} onEditTargetsPage={() => { setView("targets"); setTInitEdit(true); }} />) : effectiveView === "mapping" ? (<MappingScreen transactions={transactions} onRecategorize={onRecategorize} onBack={() => { setView("overview"); setTInitEdit(false); }} theme={theme} />) : (<MainContent onOpenUpload={() => setUploadOpen(true)} signupMonth={signupMonth} view={effectiveView} name={name} targets={viewTargets} banks={banks} plan={plan} onEditPlan={onEditPlan} hasData={viewHasData} transactions={viewTransactions} overviewSlots={overviewSlots} onChangeOverviewSlots={onChangeOverviewSlots} homeLayout={homeLayout} onChangeHomeLayout={onChangeHomeLayout} onResumeSetup={onResumeSetup} persona={persona} goals={goals} goalsApi={goalsApi} accountData={accountData} onRecategorize={onRecategorize} runTour={runTour} tourStep={tourStep} billExcludes={billExcludes} onToggleBillExclude={onToggleBillExclude} billRejects={billRejects} onRejectBill={onRejectBill} allTargets={allTargets} isDev={isDev} onOpenReview={onOpenReview} uncatCount={uncatCount} onOpenCatReview={() => setCatReviewOpen(true)} rollovers={rollovers} onSaveAllTargets={onSaveAllTargets} targetsInitialEdit={tInitEdit && effectiveView === "targets"} catConfig={catConfig} onSaveCatConfig={onSaveCatConfig} onRescanCategories={onRescanCategories} billsNudge={billsNudge} onOpenBillsSetup={onOpenBillsSetup} onDismissBillsNudge={onDismissBillsNudge} />)}</div>
      </div>
      <MobileBottomNav active={effectiveView} menuOpen={mobileMenuOpen} tourSpot={tourSpot}
        onHome={() => { setMobileMenuOpen(false); setView("overview"); setTInitEdit(false); }}
        onBreakdown={() => { setMobileMenuOpen(false); setView("breakdown"); setTInitEdit(false); }}
        onUpload={() => { setMobileMenuOpen(false); setUploadOpen(true); }}
        onTargets={() => { setMobileMenuOpen(false); setView("targets"); setTInitEdit(false); }}
        onMenu={() => setMobileMenuOpen((v) => !v)} />
      <MobileMenuSheet open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} name={name}
        views={visibleViews} active={effectiveView}
        onSelect={(v) => { setView(v); setTInitEdit(false); }}
        onOpenSettings={() => { setView("settings"); setTInitEdit(false); }}
        onLogout={onLogout} />
      {runTour && (
        <TourOverlay
          stepIndex={tourStep}
          total={tourCopy.length}
          title={copy.title}
          body={copy.body}
          spot={tourSpot}
          onNext={advanceTour}
          onSkip={onFinishTour}
        />
      )}
      {customiseOpen && (
        <CustomiseMenuModal current={navKeys} onClose={() => setCustomiseOpen(false)} onSave={onChangeNavViews} />
      )}
      {catReviewOpen && (
        <CategoriseReviewModal transactions={viewTransactions} onRecategorize={onRecategorize} onClose={() => setCatReviewOpen(false)} />
      )}
      {feedbackOpen && <FeedbackModal name={name} pushToast={pushToast} onClose={() => setFeedbackOpen(false)} onSubmitted={() => { setFeedbackDone(true); setFeedbackOpen(false); }} />}
      {overlayScreen}
      {setupIntroOpen && <SetupIntroModal name={name} onStart={onSetupStart} onSkip={onSetupSkip} />}
      {setupQuestionsOpen && <SetupQuestionsScreen {...setupQuestionsProps} />}
      {billsSetupOpen && (
        <BillsSetupModal
          transactions={transactions}
          confirmed={billExcludes}
          onSave={onSaveBillsSetup}
          onClose={onCloseBillsSetup}
        />
      )}

      {uploadOpen && (
        <UploadStatementModal
          onClose={() => setUploadOpen(false)}
          pushToast={pushToast}
          banks={banks}
          onImport={(list, bank, meta, fileName, rawFile) => { onAddTransactions(list, bank, meta, fileName, rawFile); setUploadOpen(false); }}
        />
      )}
    </div>
  );
}

/* ---------------- Settings ---------------- */

const THEMES = [
  { key: "light", label: "Light", preview: "linear-gradient(135deg, #F5F7FA 55%, #2E5BFF 55%)" },
  { key: "dark", label: "Dark", preview: "linear-gradient(135deg, #171C25 55%, #6C8CFF 55%)" },
];
function normalizeTheme(t) { return t === "dark" ? "dark" : "light"; }
function SettingsScreen({ persona, onSetPersona, setupPending, onResumeSetup, name, banks, bankRows, targets, userId, onBack, onOpenLegal, pushToast, onLogout, onSaveName, onRemoveBank, onAddBank, onSaveTargets, theme, onChangeTheme, onSaveCurrency, onSaveFxRate, extraPending, onCompleteExtra, onEditTargetsPage }) {
  const [displayName, setDisplayName] = useState(name);
  const [email, setEmail] = useState("");
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabaseClient.auth.getUser();
        if (alive && data?.user?.email) setEmail(data.user.email);
      } catch (e) {}
    })();
    return () => { alive = false; };
  }, []);
  const [savingProfile, setSavingProfile] = useState(false);
  const categories = Object.keys(targets || {}).filter((c) => c !== "Income");
  const [editingTargets, setEditingTargets] = useState(false);
  const PERSONA_EMOJI = { fresh_start: "🌱", goal_getter: "🎯", budget_hawk: "🦅", power_view: "⚡" };
  const [personaDraft, setPersonaDraft] = useState(persona);
  const [personaTick, setPersonaTick] = useState(false);
  const pickPersona = (k) => {
    setPersonaDraft(k);
    if (k === persona) return;
    try { onSetPersona(k); pushToast("Updated", "success"); setPersonaTick(true); setTimeout(() => setPersonaTick(false), 2200); }
    catch (e) { pushToast("Couldn't update view", "error"); }
  };
  const [targetDrafts, setTargetDrafts] = useState(targets || {});
  const [savingTargets, setSavingTargets] = useState(false);

  const profileDirty = displayName.trim() !== name && displayName.trim().length > 0;

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await onSaveName(displayName.trim());
      pushToast("Profile saved", "success");
    } catch (e) {
      pushToast("Couldn't save profile", "error");
    }
    setSavingProfile(false);
  };

  const [homeCur, setHomeCur] = useState(FX.home);
  const [curTick, setCurTick] = useState(false);
  const pickHomeCur = async (c) => {
    if (c === homeCur) return;
    setHomeCur(c);
    try { await onSaveCurrency(c, bankCurs); pushToast("Updated", "success"); setCurTick(true); setTimeout(() => setCurTick(false), 2200); }
    catch (e) { pushToast("Couldn't save currency", "error"); setHomeCur(FX.home); }
  };
  const bankCurLookup = React.useMemo(() => { const m = {}; (bankRows || []).forEach((r) => { if (r && r.bank_name) m[r.bank_name] = r.currency || FX.bankCurrency[r.bank_name] || "GBP"; }); return m; }, [bankRows]);
  const [bankCurs, setBankCurs] = useState(() => { const m = {}; (banks || []).forEach((b) => { m[b] = bankCurLookup[b] || FX.bankCurrency[b] || "GBP"; }); return m; });
  const [savingCur, setSavingCur] = useState(false);
  const [showRates, setShowRates] = useState(false);
  const [rateDrafts, setRateDrafts] = useState({});
  const [pwOpen, setPwOpen] = useState(false);
  const [pwSending, setPwSending] = useState(false);
  const [addBankOpen, setAddBankOpen] = useState(false);
  const [addBankPick, setAddBankPick] = useState(null);
  const [addBankCur, setAddBankCur] = useState(null);
  const [addingBank, setAddingBank] = useState(false);
  /* Currencies to offer as bank groups in the add-bank picker: whatever the
     user already banks in, plus their home currency, in CURRENCIES order. */
  const addBankGroups = Array.from(new Set([...Object.values(bankCurs || {}), homeCur].filter(Boolean)))
    .sort((a, b) => CURRENCIES.indexOf(a) - CURRENCIES.indexOf(b));
  const sendPasswordReset = async () => {
    setPwSending(true);
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      if (error) throw error;
      pushToast("Reset link sent \u2014 check your inbox", "success");
      setPwOpen(false);
    } catch (e) {
      pushToast("Couldn't send reset link: " + ((e && e.message) || "unknown error"), "error");
    }
    setPwSending(false);
  };
  const confirmAddBank = async () => {
    if (!addBankPick || !addBankCur) return;
    setAddingBank(true);
    try {
      await onAddBank(addBankPick, addBankCur);
      setBankCurs((prev) => ({ ...prev, [addBankPick]: addBankCur }));
      pushToast(addBankPick + " added", "success");
      setAddBankOpen(false); setAddBankPick(null); setAddBankCur(null);
    } catch (e) {
      pushToast("Couldn't add bank: " + ((e && e.message) || "unknown error"), "error");
    }
    setAddingBank(false);
  };
  const curDirty = homeCur !== FX.home || (banks || []).some((b) => (bankCurLookup[b] || FX.bankCurrency[b] || "GBP") !== bankCurs[b]);
  const saveCurrency = async () => {
    setSavingCur(true);
    try {
      await onSaveCurrency(homeCur, bankCurs);
      pushToast("Currency settings saved", "success");
    } catch (e) {
      console.error("Currency save failed:", e);
      pushToast("Couldn't save currency settings: " + ((e && e.message) || "unknown error"), "error");
    }
    setSavingCur(false);
  };
  const fxEntries = Object.keys(FX.rates).map((k) => { const parts = k.split("|"); return { key: k, month: parts[0], from: parts[1], to: parts[2], rate: FX.rates[k] }; }).sort((a, b) => b.month.localeCompare(a.month) || a.from.localeCompare(b.from));
  const saveRate = async (e) => {
    const v = parseFloat(rateDrafts[e.key]);
    if (!v || v <= 0) { pushToast("Enter a rate above 0", "error"); return; }
    try {
      await onSaveFxRate(e.month, e.from, e.to, v);
      pushToast("Rate updated", "success");
      setRateDrafts((p) => { const n = { ...p }; delete n[e.key]; return n; });
    } catch (err) { pushToast("Couldn't save rate", "error"); }
  };

  const cancelEditTargets = () => { setTargetDrafts(targets || {}); setEditingTargets(false); };
  const saveTargets = async () => {
    setSavingTargets(true);
    try {
      await onSaveTargets(targetDrafts);
      pushToast("Targets saved", "success");
      setEditingTargets(false);
    } catch (e) {
      pushToast("Couldn't save targets", "error");
    }
    setSavingTargets(false);
  };

  return (
    <div className="settings-body">
      <h2 className="page-heading">Settings</h2>
        <div className="dash-card settings-section">
          <span className="card-label">Profile</span>
          {setupPending && !Object.values(targets || {}).some((v) => Number(v) > 0) && (
            <div className="settings-nudge">
              <span>Set up your overview — a few questions plus your targets, and we'll shape your dashboard around your goals.</span>
              <button className="glass-btn primary settings-nudge-btn" onClick={onResumeSetup}>Set up now</button>
            </div>
          )}
          {extraPending && (
            <div className="settings-nudge">
              <span>Answer a few extra questions to personalise your experience.</span>
              <button className="glass-btn primary settings-nudge-btn" onClick={onCompleteExtra}>Complete now</button>
            </div>
          )}
          <div className="sp-rows">
            <div className="sp-row"><span className="sp-key">Name</span><input className="glass-input sp-inp" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
            <div className="sp-row"><span className="sp-key">Email</span><input className="glass-input sp-inp" type="text" value={email || "\u2014"} disabled readOnly title="This is the email you signed in with" /></div>
          </div>
          <div className="sp-actions">
            <button className="link-btn inline" onClick={() => setPwOpen(true)}>Change password</button>
            <button className="glass-btn primary sp-save" disabled={!profileDirty || savingProfile} onClick={saveProfile}>
              {savingProfile ? <span className="btn-spinner" /> : "Save"}
            </button>
          </div>
        </div>

        <div className="dash-card settings-section">
          <span className="card-label">Banks &amp; currency</span>
          <div className="field-group" style={{ marginTop: 10 }}>
            <label className="field-label">View everything in {curTick && <span className="sp-tick"><Icon name="check" size={11} strokeWidth={3} /> Updated</span>}</label>
            <div className="cur-toggle">
              {Array.from(new Set([...Object.values(bankCurs || {}), homeCur].filter(Boolean)))
                .sort((a, b) => CURRENCIES.indexOf(a) - CURRENCIES.indexOf(b))
                .map((c) => {
                const sym = (CURRENCY_SYMBOLS[c] || "").trim();
                return (
                  <button key={c} className={"cur-seg" + (homeCur === c ? " cur-seg-active" : "")} onClick={() => pickHomeCur(c)}>{c}{sym && sym !== c ? " " + sym : ""}</button>
                );
              })}
            </div>
            <p className="subtitle" style={{ margin: "8px 0 0", fontSize: 12 }}>Totals convert into this currency at a rate locked per month.</p>
          </div>
          <div className="settings-divider" />
          <label className="field-label">Your banks</label>
          <div className="settings-bank-list">
            {(banks && banks.length > 0 ? banks : []).map((b) => (
              <div className="settings-bank-row settings-bank-row-2" key={b}>
                <span className="sb-name"><span className="sb-avatar" style={{ background: bankBrand(b).bg, color: bankBrand(b).fg }}>{String(b).trim().charAt(0).toUpperCase()}</span>{b}</span>
                <span className="sb-actions">
                  <select className="glass-input" style={{ width: 100, padding: "6px 10px" }} value={bankCurs[b] || "GBP"} onChange={async (e) => { const v = e.target.value; const next = { ...bankCurs, [b]: v }; setBankCurs(next); try { await onSaveCurrency(homeCur, next); pushToast("Updated", "success"); setCurTick(true); setTimeout(() => setCurTick(false), 2200); } catch (err) { pushToast("Couldn't save currency", "error"); } }}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button className="link-btn inline" onClick={() => onRemoveBank(b)} style={{ padding: "10px 8px", display: "inline-block" }}>Remove</button>
                </span>
              </div>
            ))}
            {(!banks || banks.length === 0) && <div className="settings-bank-row"><span>No banks linked yet</span></div>}
          </div>
          <div className="sp-actions">
            <span className="sp-links">
              <button className="link-btn inline" onClick={() => { setAddBankPick(null); setAddBankCur(null); setAddBankOpen(true); }}>+ Add bank</button>
              <span className="sp-dotsep">{"\u00B7"}</span>
              <button className="link-btn inline" onClick={() => setShowRates((s) => !s)}>{showRates ? "Hide rates" : "Exchange rates"}</button>
            </span>
          </div>
          {showRates && (
            <div className="settings-bank-list" style={{ marginTop: 8 }}>
              {fxEntries.length === 0 ? (
                <p className="subtitle" style={{ margin: 0 }}>No rates stored yet — a rate is fetched and locked the first time a month needs converting.</p>
              ) : fxEntries.map((e) => (
                <div className="settings-bank-row" key={e.key}>
                  <span>{e.month} · {e.from} → {e.to}</span>
                  <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input className="target-input" type="number" step="0.0001" min="0" style={{ width: 90 }} value={rateDrafts[e.key] !== undefined ? rateDrafts[e.key] : e.rate} onChange={(ev) => { const v = ev.target.value; setRateDrafts((p) => ({ ...p, [e.key]: v })); }} />
                    {rateDrafts[e.key] !== undefined && parseFloat(rateDrafts[e.key]) !== e.rate && <button className="link-btn inline" onClick={() => saveRate(e)}>Save</button>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dash-card settings-section">
          <span className="card-label">Overview view {personaTick && <span className="sp-tick"><Icon name="check" size={11} strokeWidth={3} /> Updated</span>}</span>
          <p className="subtitle" style={{ margin: "2px 0 0" }}>Pick how your Overview page is laid out. This only changes the Overview — the rest of your dashboard and your data stay exactly the same.</p>
          <div className="persona-grid">
            {Object.keys(PERSONA_TEMPLATES).map((k) => {
              const t = PERSONA_TEMPLATES[k];
              const isCurrent = persona === k;
              const isSelected = personaDraft === k;
              return (
                <button key={k} className={"persona-option" + (isSelected ? " persona-option-active" : "")} onClick={() => pickPersona(k)}>
                  {isCurrent && <span className="persona-current">Current</span>}
                  <span className="persona-dot">{PERSONA_EMOJI[k]}</span>
                  <span className="persona-text">
                    <span className="persona-name">{t.name}</span>
                    <span className="persona-blurb">{t.blurb}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="persona-note">Switching applies to your Overview straight away — any widgets you’ve added or rearranged there will be replaced by the new view’s layout.</p>
        </div>
        <div className="dash-card settings-section">
          <span className="card-label">Appearance</span>
          <p className="subtitle" style={{ margin: "2px 0 12px" }}>Choose light or dark mode for your dashboard. Only you see it — it doesn't affect the public site.</p>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <button key={t.key} className={"theme-swatch" + ((normalizeTheme(theme)) === t.key ? " theme-swatch-active" : "")} onClick={() => onChangeTheme(t.key)}>
                <span className="theme-chip" style={{ background: t.preview }} />
                <span className="theme-name">{t.label}</span>
                {(normalizeTheme(theme)) === t.key && <span className="theme-tick"><Icon name="check" size={12} strokeWidth={3} /></span>}
              </button>
            ))}
          </div>
        </div>
        <button className="glass-btn danger" onClick={onLogout}>Log out</button>

        {pwOpen && (
          <div className="modal-overlay" onClick={() => !pwSending && setPwOpen(false)}>
            <div className="glass-card modal-card" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">Change your password</h3>
              <p className="subtitle" style={{ margin: "0 0 16px" }}>We'll email a secure reset link to <b>{email}</b>. The link expires in 1 hour.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="glass-btn" style={{ flex: 1 }} disabled={pwSending} onClick={() => setPwOpen(false)}>Cancel</button>
                <button className="glass-btn primary" style={{ flex: 1 }} disabled={pwSending || !email} onClick={sendPasswordReset}>
                  {pwSending ? <span className="btn-spinner" /> : "Send reset link"}
                </button>
              </div>
            </div>
          </div>
        )}

        {addBankOpen && (
          <div className="modal-overlay" onClick={() => !addingBank && setAddBankOpen(false)}>
            <div className="glass-card modal-card settings-addbank" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">Add a bank</h3>
              <p className="subtitle" style={{ margin: "0 0 10px" }}>Pick the bank, then the currency it's held in.</p>
              {addBankGroups.map((cur) => {
                const country = LIVE_COUNTRIES.concat(HOME_COUNTRIES).find((c) => c.cur === cur);
                return (
                  <div className="currency-bank-group" key={cur}>
                    <div className="currency-bank-head">{country ? country.flag + " " + country.label : cur}</div>
                    <div className="bank-grid">
                      {(CURRENCY_BANKS[cur] || BANKS).filter((b) => b !== "Other").map((b) => {
                        const already = (banks || []).indexOf(b) !== -1;
                        const sel = addBankPick === b;
                        return (
                          <button key={cur + b} className={"chip bank-chip " + (sel ? "chip-selected " : "") + (already ? "chip-disabled" : "")}
                            disabled={already}
                            onClick={() => { setAddBankPick(b); setAddBankCur(cur); }}>
                            <span>{b}</span>
                            {(sel || already) && <span className="check-badge"><Icon name="check" size={11} strokeWidth={3.2} /></span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {addBankPick && (
                <div className="field-group" style={{ marginTop: 14 }}>
                  <label className="field-label">Currency for {addBankPick}</label>
                  <div className="cur-toggle" style={{ marginTop: 4 }}>
                    {CURRENCIES.map((c) => {
                      const sym = (CURRENCY_SYMBOLS[c] || "").trim();
                      return <button key={c} className={"cur-seg" + (addBankCur === c ? " cur-seg-active" : "")} onClick={() => setAddBankCur(c)}>{c}{sym && sym !== c ? " " + sym : ""}</button>;
                    })}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button className="glass-btn" style={{ flex: 1 }} disabled={addingBank} onClick={() => setAddBankOpen(false)}>Cancel</button>
                <button className="glass-btn primary" style={{ flex: 1 }} disabled={addingBank || !addBankPick || !addBankCur} onClick={confirmAddBank}>
                  {addingBank ? <span className="btn-spinner" /> : "Add bank"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="settings-legal-row">
          <button className="link-btn inline" onClick={() => onOpenLegal("privacy")}>Privacy Policy</button>
          <span className="settings-legal-sep">·</span>
          <button className="link-btn inline" onClick={() => onOpenLegal("terms")}>Terms of Service</button>
        </div>
      </div>
  );
}

/* ---------------- Admin ---------------- */

function AdminBar({ onOpen }) {
  return (
    <div className="admin-bar" style={{ background: "#6D28D9" }}>
      <span className="admin-bar-dot" />
      <span className="admin-bar-label">Admin account</span>
      <span className="admin-bar-sub">Logged in as master</span>
      <button className="admin-bar-btn" onClick={onOpen}>Admin tools</button>
    </div>
  );
}

const DEVICE_PRESETS = {
  iphonese:  { name: "iPhone SE",     w: 375, h: 667,  dpr: 2 },
  iphone15:  { name: "iPhone 15",     w: 393, h: 852,  dpr: 3 },
  iphonemax: { name: "iPhone 15 Max", w: 430, h: 932,  dpr: 3 },
  pixel8:    { name: "Pixel 8",       w: 412, h: 915,  dpr: 2.6 },
  galaxys23: { name: "Galaxy S23",    w: 360, h: 780,  dpr: 3 },
  ipadmini:  { name: "iPad mini",     w: 744, h: 1133, dpr: 2 },
};

function TestingBar({ personaKey, onSetPersona }) {
  const opts = [...Object.keys(PERSONA_TEMPLATES).map((k) => ({ key: k, name: PERSONA_TEMPLATES[k].name })), { key: "no_targets", name: "Default (no targets)" }];
  return (
    <div className="admin-bar testing-bar" style={{ background: "#C2410C", flexWrap: "wrap", gap: 8 }}>
      <span className="admin-bar-dot" />
      <span className="admin-bar-label">Testing account</span>
      <span className="admin-bar-sub" style={{ marginRight: 4 }}>View:</span>
      {opts.map((o) => (
        <button
          key={o.key}
          onClick={() => onSetPersona && onSetPersona(o.key)}
          style={{
            fontSize: 12, padding: "3px 9px", borderRadius: 999, cursor: "pointer",
            border: "1px solid rgba(255,255,255,.55)",
            background: personaKey === o.key ? "#fff" : "transparent",
            color: personaKey === o.key ? "#C2410C" : "#fff",
            fontWeight: personaKey === o.key ? 700 : 500,
          }}
        >{o.name}</button>
      ))}
    </div>
  );
}


function NotificationBanner({ notes, onDismiss }) {
  if (!notes || !notes.length) return null;
  const n = notes[0];
  return (
    <div className="notif-banner">
      <span className="notif-banner-text">{n.body}</span>
      <button className="notif-banner-x" onClick={() => onDismiss(n.id)} aria-label="Dismiss">×</button>
    </div>
  );
}

function AdminScreen({ onBack, pushToast }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [composer, setComposer] = useState(null);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(null);
  const [feedback, setFeedback] = useState([]);

  const call = async (action, extra) => {
    const { data, error } = await supabaseClient.functions.invoke("admin", { body: { action, ...(extra || {}) } });
    if (error) throw error;
    if (data && data.error) throw new Error(data.error);
    return data;
  };
  const load = async () => {
    setLoading(true);
    try {
      const s = await call("stats"); setStats(s.stats);
      const u = await call("list"); setUsers(u.users || []);
      try { const { data: fb } = await supabaseClient.from("feedback").select("*").order("created_at", { ascending: false }); setFeedback(fb || []); } catch (e) {}
    } catch (e) { pushToast("Admin load failed: " + (e.message || e), "error"); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const fmtDate = (s) => s ? new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—";
  const doReset = async (u) => {
    if (!window.confirm("Reset " + u.email + "?\n\nThis deletes all their data and sends them back through onboarding.")) return;
    setBusy(u.id);
    try { await call("reset", { userId: u.id }); pushToast("Account reset", "success"); await load(); }
    catch (e) { pushToast("Reset failed: " + (e.message || e), "error"); }
    setBusy(null);
  };
  const doDelete = async (u) => {
    if (!window.confirm("Permanently delete " + u.email + "?\n\nThis removes their account and all data and cannot be undone.")) return;
    setBusy(u.id);
    try { await call("delete", { userId: u.id }); pushToast("Account deleted", "success"); await load(); }
    catch (e) { pushToast("Delete failed: " + (e.message || e), "error"); }
    setBusy(null);
  };
  const openMsg = (u) => { setComposer({ userId: u.id, to: "To: " + u.email }); setMsg(""); };
  const openBroadcast = () => { setComposer({ userId: null, to: "To: all " + (stats ? stats.total : 0) + " users" }); setMsg(""); };
  const send = async () => {
    const body = msg.trim(); if (!body) return;
    setSending(true);
    try {
      if (composer.userId) await call("notify", { userId: composer.userId, body });
      else await call("notifyAll", { body });
      pushToast("Message sent", "success"); setComposer(null); setMsg("");
    } catch (e) { pushToast("Send failed: " + (e.message || e), "error"); }
    setSending(false);
  };

  const weekly = (stats && stats.weekly) || [];
  const maxWk = weekly.length ? Math.max(1, ...weekly.map((w) => w.count)) : 1;
  const badgeFor = (u) => u.statements > 0 ? { t: "uploaded", bg: "rgba(18,161,80,0.12)", c: "var(--pos)" }
    : u.onboarded ? { t: "onboarded", bg: "var(--accent-soft)", c: "var(--accent)" }
    : { t: "signed up", bg: "rgba(181,71,8,0.12)", c: "var(--warn)" };
  const tile = { background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: 14, boxShadow: "var(--shadow-card)" };
  const th = { padding: "11px 12px", fontWeight: 600, color: "var(--ink-2)" };

  return (
    <div className="admin-page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: "-0.4px", color: "var(--accent)", fontWeight: 700 }}>{APP_NAME}</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em", color: "var(--ink)" }}>Admin tools</div>
        </div>
        <button className="glass-btn ghost" onClick={onBack}>← Back to app</button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "var(--ink-3)", padding: 60 }}>Loading…</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
            <div style={{ ...tile, flex: 1, minWidth: 220, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1, color: "var(--ink)" }}>{stats ? stats.total : 0}</div>
                <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>Total sign-ups</div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 260, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={tile}><div style={{ fontSize: 12, color: "var(--ink-3)" }}>Onboarded</div><div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{stats ? stats.onboarded : 0}</div></div>
              <div style={tile}><div style={{ fontSize: 12, color: "var(--ink-3)" }}>Uploaded a statement</div><div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{stats ? stats.uploaded : 0}</div></div>
              <div style={tile}><div style={{ fontSize: 12, color: "var(--ink-3)" }}>Statements uploaded</div><div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{stats ? stats.statements_total : 0}</div></div>
              <div style={tile}><div style={{ fontSize: 12, color: "var(--ink-3)" }}>Active last 7 days</div><div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{stats ? stats.active7d : 0}</div></div>
            </div>
          </div>

          <div style={{ ...tile, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: "var(--ink)" }}>Sign-ups over time</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 110 }}>
              {weekly.map((w, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ background: i === weekly.length - 1 ? "var(--accent)" : "var(--accent-soft)", borderRadius: "5px 5px 0 0", height: Math.max(4, Math.round((w.count / maxWk) * 90)) }} />
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6 }}>{w.label}</div>
                </div>
              ))}
            </div>
          </div>

          {feedback.length > 0 && (
            <div style={{ ...tile, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--ink)" }}>Feedback ({feedback.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {feedback.map((f) => (
                  <div key={f.id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 12 }}>
                    <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 6 }}>{(f.name || f.email || "Anonymous") + " · " + fmtDate(f.created_at)}</div>
                    {f.likes && <div style={{ fontSize: 13, color: "var(--ink)", marginBottom: 4 }}><strong style={{ color: "var(--pos)" }}>Likes:</strong> {" " + f.likes}</div>}
                    {f.dislikes && <div style={{ fontSize: 13, color: "var(--ink)", marginBottom: 4 }}><strong style={{ color: "var(--neg)" }}>Dislikes:</strong> {" " + f.dislikes}</div>}
                    {f.improve && <div style={{ fontSize: 13, color: "var(--ink)" }}><strong style={{ color: "var(--accent)" }}>Improve:</strong> {" " + f.improve}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Users ({users.length})</div>
            <button className="glass-btn ghost" onClick={openBroadcast}>Message all users</button>
          </div>

          {composer && (
            <div style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: 14, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 8, fontWeight: 600 }}>{composer.to}</div>
              <textarea className="tx-input" style={{ width: "100%", minHeight: 64, boxSizing: "border-box", resize: "vertical" }} placeholder="Write an in-app message they'll see next time they log in" value={msg} onChange={(e) => setMsg(e.target.value)} />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="glass-btn primary" disabled={sending || !msg.trim()} onClick={send}>{sending ? "Sending\u2026" : "Send"}</button>
                <button className="glass-btn ghost" onClick={() => setComposer(null)}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ ...tile, padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--surface-2)", textAlign: "left" }}>
                    <th style={th}>Email</th>
                    <th style={th}>Joined</th>
                    <th style={th}>Progress</th>
                    <th style={th}>Statements</th>
                    <th style={th}>Active</th>
                    <th style={{ ...th, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--ink-3)" }}>No customers yet.</td></tr>
                  ) : users.map((u) => {
                    const b = badgeFor(u);
                    return (
                      <tr key={u.id} style={{ borderTop: "1px solid var(--line)", opacity: busy === u.id ? 0.5 : 1 }}>
                        <td style={{ padding: "11px 12px", color: "var(--ink)" }}>{u.email}</td>
                        <td style={{ padding: "11px 12px", color: "var(--ink-3)" }}>{fmtDate(u.created_at)}</td>
                        <td style={{ padding: "11px 12px" }}><span style={{ background: b.bg, color: b.c, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>{b.t}</span></td>
                        <td style={{ padding: "11px 12px", color: "var(--ink-2)" }}>{u.statements}</td>
                        <td style={{ padding: "11px 12px", color: "var(--ink-3)" }}>{fmtDate(u.last_sign_in_at)}</td>
                        <td style={{ padding: "11px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <button className="admin-act" onClick={() => openMsg(u)}>Message</button>
                          <button className="admin-act" onClick={() => doReset(u)}>Reset</button>
                          <button className="admin-act admin-act-danger" onClick={() => doDelete(u)}>Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- App shell / router ---------------- */

function LoginSplash() {
  return (
    <div className="lsplash">
      <div className="lsplash-inner">
        <div className="lsplash-icon">
          <span className="lsplash-bar lsb1" />
          <span className="lsplash-bar lsb2" />
          <span className="lsplash-bar lsb3" />
        </div>
        <div className="lsplash-word">Two<span>Pockets</span></div>
      </div>
    </div>
  );
}

function App() {
  const [stage, setStage] = useState("landing");
  const [showSplash, setShowSplash] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState("");
  const [banks, setBanks] = useState([]);
  const [targets, setTargets] = useState({});
  const [balances, setBalances] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [customTransactions, setCustomTransactions] = useState([]);
  const [statements, setStatements] = useState([]);
  const [bankRows, setBankRows] = useState([]);
  const [overviewSlots, setOverviewSlots] = useState(DEFAULT_OVERVIEW_SLOTS);
  const [homeLayout, setHomeLayout] = useState(DEFAULT_HOME_LAYOUT);
  const [showSetupBanner, setShowSetupBanner] = useState(false);
  const [setupResume, setSetupResume] = useState(false);
  const [setupIntroOpen, setSetupIntroOpen] = useState(false);
  const [setupQuestionsOpen, setSetupQuestionsOpen] = useState(false);
  const [setupAnswers, setSetupAnswers] = useState(null);
  const [personaKey, setPersonaKey] = useState(null);
  const [navViews, setNavViews] = useState(VIEWS.map((v) => v.key));
  const [allTargets, setAllTargets] = useState({});
  const [targetsEditReq, setTargetsEditReq] = useState(false);
  const [billExcludes, setBillExcludes] = useState([]);
  /* Item 16: bills setup is a one-time prompt after onboarding. Persisted on the
     profile so it doesn't reappear on every login. */
  /* Default FALSE: the NCJ path reaches the dashboard without re-reading the
     profile, so a `true` default suppressed the bills nudge (and its "Needs
     you" row) until the app was hard-closed and reopened. Login/session-restore
     both set the real value from the profile before any data exists. */
  const [billsSetupDone, setBillsSetupDone] = useState(false);
  const [billsSetupOpen, setBillsSetupOpen] = useState(false);
  const [billsNudgeHidden, setBillsNudgeHidden] = useState(false);
  const [billRejects, setBillRejects] = useState([]);
  const [catConfig, setCatConfig] = useState({ renames: {}, custom: [] });
  const [extraProfile, setExtraProfile] = useState(null);
  const [showExtraBanner, setShowExtraBanner] = useState(false);
  const [legalTab, setLegalTab] = useState("privacy");
  const [returnStage, setReturnStage] = useState("welcome");
  const [toasts, setToasts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [isDev, setIsDev] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState("light");
  const [runTour, setRunTour] = useState(false);
  const [usingDemo, setUsingDemo] = useState(false);
  const [demoCurrencies, setDemoCurrencies] = useState(["GBP"]);
  const [monthReviews, setMonthReviews] = useState([]);
  const [plan, setPlan] = useState(null);
  const [rollovers, setRollovers] = useState([]);
  const [reviewMonth, setReviewMonth] = useState(null);
  const [signupMonth, setSignupMonth] = useState(null);
  const [devNow, setDevNow] = useState(null);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState("iphone15");
  const [previewLandscape, setPreviewLandscape] = useState(false);
  const [mpNonce, setMpNonce] = useState(0);
  const setDevDate = (val) => { DEV_NOW = val || null; setDevNow(val || null); };
  const [reviewManual, setReviewManual] = useState(false);
  const [sessionDismissed, setSessionDismissed] = useState([]);

  const pushToast = (message, type) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2600);
  };

  const hasData = customTransactions.length > 0;

  React.useEffect(() => {
    if (!userId) { setMonthReviews([]); setRollovers([]); setNotifications([]); return; }
    (async () => {
      try {
        const [mr, ro] = await Promise.all([fetchMonthReviews(userId), fetchRollovers(userId)]);
        setMonthReviews(mr); setRollovers(ro);
      } catch (e) {}
      try {
        const { data: notes } = await supabaseClient.from("notifications").select("*").eq("user_id", userId).eq("read", false).order("created_at", { ascending: false });
        setNotifications(notes || []);
      } catch (e) {}
    })();
  }, [userId]);

  React.useEffect(() => {
    // Hold the month-end review until the user has finished the welcome tour and
    // any first-run setup — it should never interrupt onboarding.
    if (stage !== "dashboard" || reviewMonth || runTour) return;
    if (!hasData) return;
    // Real month-end: only review the month that has JUST completed (previous month
    // relative to today), never retrospectively surface older months.
    const prev = addMonths(currentMonthKey(), -1);
    // Never review months that closed before the customer signed up — the first
    // review a Cx should ever see is the signup month, once a new month opens.
    const baseline = signupMonth || new Date().toISOString().slice(0, 7);
    if (prev < baseline) return;
    const done = completedMonthsWithData(customTransactions);
    if (!done.includes(prev)) return;
    const reviewed = new Set(monthReviews.map((r) => r.month));
    if (reviewed.has(prev) || sessionDismissed.includes(prev)) return;
    const b = (allTargets && allTargets[prev]) || {};
    const hasBudget = TX_CATEGORIES.some((c) => Number(b[c]) > 0) || !!plan;
    if (hasBudget) { setReviewManual(false); setReviewMonth(prev); }
  }, [stage, customTransactions, allTargets, monthReviews, reviewMonth, sessionDismissed, isDev, runTour, showExtraBanner, hasData, plan, devNow, signupMonth]);

  const reviewBudgets = (() => {
    if (!reviewMonth) return {};
    const b = (allTargets && allTargets[reviewMonth]) || {};
    const hasBudget = TX_CATEGORIES.some((c) => Number(b[c]) > 0);
    return (!hasBudget && isDev) ? DEMO_TARGETS : b;
  })();

  const closeReview = () => {
    if (reviewMonth && !reviewManual) setSessionDismissed((p) => [...p, reviewMonth]);
    setReviewMonth(null); setReviewManual(false);
  };
  const openReviewManual = (monthKey) => { setReviewManual(true); setReviewMonth(monthKey); };

  const handleReviewAction = async (month, action, payload) => {
    const net = (payload && payload.net) || 0;
    try { await supabaseClient.from("month_reviews").upsert({ user_id: userId, month, net, action }, { onConflict: "user_id,month" }); } catch (e) {}
    setMonthReviews((prev) => [...prev.filter((r) => r.month !== month), { month, net, action }]);
    const insertRollovers = async (rows) => {
      try { const { data } = await supabaseClient.from("budget_rollovers").insert(rows).select(); if (data) setRollovers((p) => [...p, ...data.map(rowToRollover)]); }
      catch (e) { setRollovers((p) => [...p, ...rows.map((r) => ({ ...r, id: "local-" + Math.random() }))]); }
    };
    if (action === "catchup" && payload && payload.perMonth > 0) {
      const rows = [];
      for (let i = 1; i <= payload.months; i++) rows.push({ user_id: userId, month: addMonths(month, i), amount: -Math.abs(payload.perMonth), source: "catchup" });
      await insertRollovers(rows);
      pushToast("Plan applied — budgets trimmed by " + formatMoney(payload.perMonth) + "/mo", "success");
    } else if (action === "full" && net) {
      await insertRollovers([{ user_id: userId, month: addMonths(month, 1), amount: net, source: "rollover" }]);
      pushToast(formatMoney(Math.abs(net)) + " carried into next month", "success");
    } else if (action === "bank_surplus" && payload && payload.goalId && payload.amount > 0) {
      const g = goals.find((x) => x.id === payload.goalId);
      if (g) await goalsApi.update(g.id, { saved: (Number(g.saved) || 0) + payload.amount });
      pushToast(formatMoney(payload.amount) + " added to " + (g ? g.name : "your goal"), "success");
    } else if (action === "roll_surplus" && payload && payload.amount > 0) {
      await insertRollovers([{ user_id: userId, month: addMonths(month, 1), amount: Math.abs(payload.amount), source: "surplus" }]);
      pushToast(formatMoney(payload.amount) + " rolled into next month", "success");
    } else if (action === "plan_accept" && plan) {
      const p = { ...plan, targetBalance: Math.round(plan.targetBalance - (payload && payload.amount ? payload.amount : 0)) };
      setPlan(p); try { await savePlanToDb(userId, p); } catch (e) {}
      pushToast("Goal updated to " + formatMoney(p.targetBalance) + " — same monthly targets", "success");
    } else if (action === "plan_catchup" && plan && payload && payload.months && payload.months.length) {
      const avgAll = avgSpendByCategory(customTransactions);
      const updates = {};
      payload.months.forEach((k) => {
        const row = {};
        TX_CATEGORIES.forEach((c) => { row[c] = plannedCatFor(allTargets, k, c, avgAll); });
        row["Income"] = plannedIncomeFor(allTargets, k, customTransactions);
        Object.entries(payload.trims || {}).forEach(([c, t]) => { row[c] = Math.max(0, (Number(row[c]) || 0) - t); });
        updates[k] = row;
      });
      setAllTargets((prev) => ({ ...prev, ...updates }));
      if (updates[currentMonthKey()]) setTargets(updates[currentMonthKey()]);
      for (const k of Object.keys(updates)) { try { await saveMonthTargetsToDb(userId, k, updates[k]); } catch (e) {} }
      pushToast("Plan tightened by " + formatMoney(payload.perMonth) + "/mo — your goal stays at " + formatMoney(plan.targetBalance), "success");
    } else if (action === "plan_extend" && plan) {
      const avgAll = avgSpendByCategory(customTransactions);
      const newMonth = addMonths(plan.targetMonth, 1);
      const row = {};
      TX_CATEGORIES.forEach((c) => { row[c] = plannedCatFor(allTargets, plan.targetMonth, c, avgAll); });
      row["Income"] = plannedIncomeFor(allTargets, plan.targetMonth, customTransactions);
      setAllTargets((prev) => ({ ...prev, [newMonth]: row }));
      try { await saveMonthTargetsToDb(userId, newMonth, row); } catch (e) {}
      const p = { ...plan, targetMonth: newMonth };
      setPlan(p); try { await savePlanToDb(userId, p); } catch (e) {}
      pushToast("Plan extended — " + formatMoney(plan.targetBalance) + " by " + monthLabelFromKey(newMonth) + " " + newMonth.slice(0, 4), "success");
    } else if (action === "plan_bank" && plan) {
      const p = { ...plan, targetBalance: Math.round(plan.targetBalance + (payload && payload.amount ? payload.amount : 0)) };
      setPlan(p); try { await savePlanToDb(userId, p); } catch (e) {}
      pushToast("Goal raised to " + formatMoney(p.targetBalance) , "success");
    } else if (action === "plan_ease" && plan && payload && payload.months && payload.months.length) {
      const avgAll = avgSpendByCategory(customTransactions);
      const updates = {};
      payload.months.forEach((k) => {
        const row = {};
        TX_CATEGORIES.forEach((c) => { row[c] = plannedCatFor(allTargets, k, c, avgAll); });
        row["Income"] = plannedIncomeFor(allTargets, k, customTransactions);
        Object.entries(payload.adds || {}).forEach(([c, a]) => { row[c] = (Number(row[c]) || 0) + a; });
        updates[k] = row;
      });
      setAllTargets((prev) => ({ ...prev, ...updates }));
      if (updates[currentMonthKey()]) setTargets(updates[currentMonthKey()]);
      for (const k of Object.keys(updates)) { try { await saveMonthTargetsToDb(userId, k, updates[k]); } catch (e) {} }
      pushToast("Budgets eased by " + formatMoney(payload.perMonth) + "/mo — goal stays at " + formatMoney(plan.targetBalance), "success");
    } else if (action === "plan_keep") {
      pushToast("Review saved — plan unchanged", "info");
    } else {
      pushToast("Review saved", "info");
    }
  };

  const notifyUncategorized = (n) => {
    if (n > 0) pushToast(n + " transaction" + (n !== 1 ? "s" : "") + " couldn't be auto-categorised — use the tag on your Overview to sort them", "info");
  };
  const runAiFallback = async (txs) => {
    const uncats = txs.filter((t) => t.category === "Uncategorized" && !isTransferDesc(t.name));
    if (!uncats.length) return;
    try {
      const unique = [...new Set(uncats.map((t) => t.name))].slice(0, 200);
      const mapping = await aiCategorize(unique);
      if (!mapping || !Object.keys(mapping).length) { notifyUncategorized(uncats.length); return; }
      const spendSet = new Set(spendCategories());
      const validFallback = (name) => { const c = mapping[name]; return c && spendSet.has(c) ? c : null; };
      setCustomTransactions((prev) => prev.map((t) =>
        t.category === "Uncategorized" && validFallback(t.name) ? { ...t, category: validFallback(t.name) } : t
      ));
      const idToCat = {};
      txs.forEach((t) => { if (t.id && t.category === "Uncategorized") { const c = validFallback(t.name); if (c) idToCat[t.id] = c; } });
      if (Object.keys(idToCat).length) await updateTransactionCategoriesInDb(idToCat);
      pushToast("AI categorized " + Object.keys(idToCat).length + " transactions", "success");
      notifyUncategorized(uncats.filter((t) => !validFallback(t.name)).length);
    } catch (e) { notifyUncategorized(uncats.length); }
  };

  const goalsApi = {
    add: async (g) => {
      try {
        const saved = await addGoalToDb(userId, g);
        setGoals((prev) => [...prev, saved]);
        pushToast("Goal added", "success");
      } catch (e) {
        setGoals((prev) => [...prev, { ...g, id: "local-" + Date.now() }]);
        pushToast("Goal added here, but couldn't save to your account — run the goals SQL setup", "error");
      }
    },
    update: async (id, fields) => {
      setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...fields } : g)));
      try { if (!String(id).startsWith("local-")) await updateGoalInDb(id, fields); }
      catch (e) { pushToast("Couldn't save that change to your account", "error"); }
    },
    remove: async (id) => {
      setGoals((prev) => prev.filter((g) => g.id !== id));
      pushToast("Goal deleted", "info");
      try { if (!String(id).startsWith("local-")) await deleteGoalFromDb(id); }
      catch (e) {}
    },
  };

  /* After any upload, re-check every statement for the affected bank against
     ALL stored transactions, persist statuses, and surface any problems. */
  const runReconciliation = async (allStatements, allTransactions, focusBank) => {
    const rechecked = reconcileStatements(allStatements, allTransactions);
    try { await persistReconciliation(allStatements, rechecked); } catch (e) {}
    setStatements(rechecked);
    const focus = focusBank ? rechecked.filter((s) => s.bank === focusBank) : rechecked;
    const mismatches = focus.filter((s) => s.status === "mismatch");
    if (mismatches.length) {
      const m = mismatches[mismatches.length - 1];
      pushToast(m.bank + " statement doesn't balance — off by " + formatMoney(Math.abs(m.difference)) + ". Try uploading a statement covering a longer period to find what's missing.", "error");
    } else if (focus.some((s) => s.status === "reconciled")) {
      pushToast("Balances check out ✓", "success");
    }
    const issues = chainIssues(rechecked).filter((i) => !focusBank || i.bank === focusBank);
    if (issues.length) pushToast("⚠ " + issues[0].bank + ": " + issues[0].text, "error");
    return rechecked;
  };

  const recategorizeDescription = async (description, newCategory, opts) => {
    setCustomTransactions((prev) => prev.map((t) => (t.name === description ? { ...t, category: newCategory } : t)));
    if (userId) {
      try {
        await supabaseClient.from("transactions").update({ category: newCategory }).eq("user_id", userId).eq("description", description);
      } catch (e) { pushToast("Changed here, but couldn't save to your account", "error"); return; }
    }
    if (!(opts && opts.silent)) pushToast("\u201C" + description + "\u201D \u2192 " + displayCat(newCategory), "success");
  };

  const startDemo = (demoCurs) => {
    const curs = (demoCurs && demoCurs.length ? demoCurs : [FX.home || "GBP"]).slice(0, 2);
    const home = (FX.ready && FX.home) ? FX.home : curs[0];
    FX.home = home; FX.ready = true;
    const all = [];
    curs.forEach((c) => {
      const bank = SAMPLE_BANK_BY_CUR[c] || ("Sample " + c + " Bank");
      FX.bankCurrency[bank] = c;
      let parsed = [];
      try { parsed = parseStatementCSV(demoCsvForCurrency(c)).transactions; } catch (e) { parsed = []; }
      parsed.forEach((t, i) => {
        const base = { ...t, id: "sample-" + c + "-" + i, bank, category: demoCategorize(t.name, t.amount) };
        all.push(applyFxToTx(base));
      });
    });
    setCustomTransactions(all);
    setUsingDemo(true);
    setStage("processing");
  };

  const skipToTour = (nm) => {
    setName(nm || "Tester");
    // Load dual-currency sample data so the tour has real numbers, then jump straight
    // to the dashboard with the guided tour running. Testing accounts only.
    const curs = ["AED", "GBP"];
    FX.home = "AED"; FX.ready = true;
    const all = [];
    curs.forEach((c) => {
      const bank = SAMPLE_BANK_BY_CUR[c] || ("Sample " + c + " Bank");
      FX.bankCurrency[bank] = c;
      let parsed = [];
      try { parsed = parseStatementCSV(demoCsvForCurrency(c)).transactions; } catch (e) { parsed = []; }
      parsed.forEach((t, i) => {
        const base = { ...t, id: "sample-" + c + "-" + i, bank, category: demoCategorize(t.name, t.amount) };
        all.push(applyFxToTx(base));
      });
    });
    setCustomTransactions(all);
    setUsingDemo(true);
    setRunTour(true);
    setStage("dashboard");
  };

  const handleAddTransactions = async (list, bankName, meta, fileName, rawFile) => {
    const base = usingDemo ? [] : customTransactions;
    if (usingDemo) setUsingDemo(false);
    const overrideMap = {};
    base.forEach((t) => { if (!(t.name in overrideMap)) overrideMap[t.name] = t.category; });
    const { kept, skipped, stmtRow } = await importStatementUnit({ userId, bank: bankName, txs: list, meta, fileName, rawFile, existing: base, overrideMap, stmtErrorMsg: "Couldn't record the statement — run the statements SQL setup", pushToast });
    let saved = kept;
    if (kept.length) {
      try { saved = await saveTransactionsToDb(userId, bankName || null, kept, stmtRow ? stmtRow.id : null); }
      catch (e) { pushToast("Imported, but couldn't save to your account — run the transactions SQL setup", "error"); }
      saved.forEach((t) => { if (!t.bank) t.bank = bankName || null; });
      setCustomTransactions((prev) => [...saved, ...(usingDemo ? [] : prev)]);
      pushToast(importToast(kept.length, skipped), "success");
    } else {
      pushToast("All " + list.length + " transactions were already imported — nothing new added", "info");
    }
    const allTx = [...(kept.length ? saved : []), ...base];
    const allStmts = stmtRow ? [...statements.filter((s) => s.id !== stmtRow.id), stmtRow] : statements;
    await runReconciliation(allStmts, allTx, bankName || null);
    if (kept.length) runAiFallback(saved);
  };

  useEffect(() => {
    (async () => {
     try {
      const { data } = await supabaseClient.auth.getSession();
      const session = data?.session;
      if (session?.user) {
        const { data: userCheck, error: userErr } = await supabaseClient.auth.getUser();
        if (userErr || !userCheck?.user) {
          await supabaseClient.auth.signOut();
          setCheckingSession(false);
          return;
        }
        const uid = session.user.id;
        setUserId(uid);
        setIsDev(TESTING_EMAILS.includes(session.user.email));
        setIsAdmin(session.user.email === ADMIN_EMAIL);
        const profile = await fetchProfile(uid);
        if (profile?.name) {
          const bankRows = await fetchBanks(uid);
          const targetObj = await fetchTargets(uid);
          const txRows = await fetchTransactions(uid);
          const goalRows = await fetchGoals(uid);
          const stmtRows = await fetchStatements(uid);
          setGoals(goalRows);
          setName(profile.name);
          setSignupMonth((profile.created_at || "").slice(0, 7) || null);
          setBanks(bankRows.map((b) => b.bank_name));
          setBankRows(bankRows);
          setTargets(targetObj); fetchAllTargets(uid).then(setAllTargets).catch(() => {});
          setCustomTransactions(txRows);
          setStatements(stmtRows);
          setUploadedFiles(Object.fromEntries(bankRows.map((b) => [b.bank_name, [{ name: "existing", size: 1, id: b.id }]])));
          setOverviewSlots(parseOverviewLayout(profile)); setHomeLayout(parseHomeLayout(profile)); setTheme(normalizeTheme(profile && profile.theme)); setShowSetupBanner(!!profile && profile.setup_completed === false); setPersonaKey((profile && profile.persona) || null);
          setNavViews(parseNavLayout(profile));
          setBillExcludes(parseBillExcludes(profile)); setBillRejects(parseBillRejects(profile)); setBillsSetupDone(!!(profile && profile.bills_setup_done)); { const _cc = parseCategoryConfig(profile); CAT_CONFIG = _cc; setCatConfig(_cc); }
      setPlan(planFromProfile(profile));
          setStage("dashboard");
        } else {
          setStage("onboarding");
        }
      }
      setCheckingSession(false);
     } catch (e) {
       console.error("Session restore failed:", e);
       setCheckingSession(false);
     }
    })();
  }, []);

  const openLegal = (tab, from) => { setLegalTab(tab); setReturnStage(from); setStage("legal"); };

  const DEV_EMAIL = "testing@twopockets.com";
  const QA_EMAIL = "qa@twopockets.com";
  /* Accounts that get the orange testing bar (persona switcher + view toggle). */
  const TESTING_EMAILS = [DEV_EMAIL, QA_EMAIL];
  const ADMIN_EMAIL = "admin@twopockets.com";

  const reloadFxData = async () => {
    if (!userId) return;
    FX.ready = false;
    const bankRows2 = await fetchBanks(userId);
    setBanks(bankRows2.map((b) => b.bank_name));
    setBankRows(bankRows2);
    /* In demo mode the sample transactions live only in React state (never
       persisted), so refetching from the DB would wipe them and blank out the
       plan grid + overview. Keep the in-memory demo set intact. */
    if (usingDemo) return;
    const txRows2 = await fetchTransactions(userId);
    setCustomTransactions(txRows2);
  };
  const handleSaveCurrency = async (homeCur, bankCurs) => {
    if (!userId) return;
    const prevHome = FX.home;
    const { error: pErr } = await supabaseClient.from("profiles").upsert({ id: userId, home_currency: homeCur });
    if (pErr) throw pErr;
    for (const [bank, cur] of Object.entries(bankCurs)) {
      const { error } = await supabaseClient.from("banks").update({ currency: cur }).eq("user_id", userId).eq("bank_name", bank);
      if (error) throw error;
    }
    // DB writes have succeeded — from here nothing may report the save as failed.
    // Targets are stored as bare numbers in the home currency. When home changes,
    // convert every stored target by the locked rate so they stay meaningful.
    if (prevHome && prevHome !== homeCur) {
      try {
        const cvRate = fxRateStable(nowMonth(), prevHome, homeCur);
        const cv = (v) => Math.round((Number(v) || 0) * cvRate * 100) / 100;
        if (cvRate && cvRate !== 1) {
          const { data: tRows } = await supabaseClient.from("targets").select("*").eq("user_id", userId);
          const updated = (tRows || []).map((r) => ({ ...r, monthly_target: cv(r.monthly_target) }));
          if (updated.length) {
            await supabaseClient.from("targets").upsert(updated);
            setAllTargets((prev) => {
              const next = {};
              Object.entries(prev || {}).forEach(([mk, cats]) => {
                next[mk] = Object.fromEntries(Object.entries(cats || {}).map(([c, v]) => [c, cv(v)]));
              });
              return next;
            });
            setTargets((prev) => Object.fromEntries(Object.entries(prev || {}).map(([c, v]) => [c, cv(v)])));
          }
          /* The long-term plan is stored as bare numbers in the home currency too
             (plan_target_balance / plan_opening_balance on profiles). Without this
             the goal keeps its old magnitude and simply changes symbol — e.g. an
             AED 241,403 goal reads as GBP 241,403 after switching to GBP. Convert
             both by the same locked rate so the plan stays meaningful. */
          setPlan((prev) => {
            if (!prev) return prev;
            const nextPlan = {
              ...prev,
              targetBalance: cv(prev.targetBalance),
              openingBalance: prev.openingBalance == null ? prev.openingBalance : cv(prev.openingBalance),
            };
            savePlanToDb(userId, nextPlan).catch((e) => console.error("Plan currency conversion save failed (non-fatal):", e));
            return nextPlan;
          });
        }
      } catch (e) { console.error("Target currency conversion after home switch failed (non-fatal):", e); }
    }
    FX.home = homeCur;
    Object.entries(bankCurs).forEach(([bank, cur]) => { FX.bankCurrency[bank] = cur; });
    try { await reloadFxData(); } catch (e) { console.error("FX reload after currency save failed (non-fatal):", e); }
  };
  const handleSaveFxRate = async (month, from, to, rate) => {
    if (!userId) return;
    const { error } = await supabaseClient.from("fx_rates").upsert(
      { user_id: userId, month, from_currency: from, to_currency: to, rate, source: "manual" },
      { onConflict: "user_id,month,from_currency,to_currency" }
    );
    if (error) throw error;
    await reloadFxData();
  };
  const handleSaveName = async (newName) => {
    setName(newName);
    if (userId) {
      try { await supabaseClient.from("profiles").upsert({ id: userId, name: newName }); }
      catch (e) { pushToast("Couldn't save name", "error"); }
    }
  };
  const handleChangeOverviewSlots = (newSlots) => {
    setOverviewSlots(newSlots);
    if (userId) {
      supabaseClient.from("profiles").upsert({ id: userId, overview_layout: newSlots }).then(() => {});
    }
  };
  const handleChangeHomeLayout = (newLayout) => {
    setHomeLayout(newLayout);
    if (userId) {
      supabaseClient.from("profiles").upsert({ id: userId, home_layout: newLayout }).then(() => {}, () => {});
    }
  };
  const handleSetPersona = (key) => {
    if (key === "no_targets") {
      setPersonaKey(key);
      setHomeLayout(DEFAULT_HOME_LAYOUT);
      if (userId) supabaseClient.from("profiles").upsert({ id: userId, home_layout: DEFAULT_HOME_LAYOUT, persona: key }).then(() => {}, () => {});
      return;
    }
    const tpl = PERSONA_TEMPLATES[key];
    if (!tpl) return;
    setPersonaKey(key);
    setHomeLayout(tpl.layout);
    if (userId) {
      supabaseClient.from("profiles").upsert({ id: userId, home_layout: tpl.layout, persona: key }).then(() => {}, () => {});
    }
  };

  // DEV ONLY: seed the full dummy-statement dataset + Dec £15,000 goal and jump straight to the dashboard
  const doSkipToDashboard = () => {
    const bank = "Citibank";
    FX.home = "GBP"; FX.ready = true; FX.bankCurrency[bank] = "GBP";
    let parsed = [];
    try { parsed = parseStatementCSV(DEMO_CSV_GBP).transactions; } catch (e) { parsed = []; }
    const txs = parsed.map((t, i) => ({ ...t, id: "skip-" + i, bank, category: demoCategorize(t.name, t.amount) }));
    const smonth = "2026-07";
    const tgts = { Groceries: 519, Transport: 104, Dining: 393, Shopping: 411, Subscriptions: 54, Bills: 547 };
    setCustomTransactions(txs);
    setUsingDemo(false);
    setRunTour(false);
    setBanks([bank]);
    setBankRows([{ bank_name: bank, starting_balance: 1000, as_of_date: "2026-05-01" }]);
    setStatements([]);
    setTargets(tgts);
    setAllTargets({ [smonth]: tgts });
    setPlan({ targetBalance: 15000, targetMonth: "2026-12", method: "manual", openingBalance: 1000 });
    setGoals([]);
    setSignupMonth(smonth);
    setName(name || "S");
    setBillExcludes(detectRecurringBills(txs).map((b) => b.name));
    const tpl = PERSONA_TEMPLATES.fresh_start;
    setPersonaKey("fresh_start");
    setHomeLayout(tpl ? tpl.layout : DEFAULT_HOME_LAYOUT);
    setStage("dashboard");
  };
  const handleChangeTheme = (t) => {
    setTheme(t);
    if (userId) {
      supabaseClient.from("profiles").upsert({ id: userId, theme: t }).then(() => {});
    }
  };
  const handleChangeNavViews = (newViews) => {
    setNavViews(newViews);
    if (userId) supabaseClient.from("profiles").upsert({ id: userId, nav_layout: newViews }).then(() => {}, () => {});
  };
  const markBillsSetupDone = () => {
    setBillsSetupDone(true);
    if (userId) supabaseClient.from("profiles").upsert({ id: userId, bills_setup_done: true }).then(() => {}, () => {});
  };
  const handleSaveBillsSetup = (names) => {
    const next = Array.isArray(names) ? names : [];
    setBillExcludes(next);
    if (userId) supabaseClient.from("profiles").upsert({ id: userId, bill_excludes: next, bills_setup_done: true }).then(() => {}, () => {});
    setBillsSetupDone(true);
  };
  const handleRejectBill = (name) => {
    setBillRejects((prev) => {
      if (prev.includes(name)) return prev;
      const next = [...prev, name];
      if (userId) supabaseClient.from("profiles").upsert({ id: userId, bill_rejects: next }).then(() => {}, () => {});
      return next;
    });
  };
  const handleToggleBillExclude = (name) => {
    setBillExcludes((prev) => {
      const next = prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name];
      if (userId) supabaseClient.from("profiles").upsert({ id: userId, bill_excludes: next }).then(() => {}, () => {});
      /* Saying Yes to something previously rejected should clear the rejection. */
      if (!prev.includes(name)) setBillRejects((r) => {
        if (!r.includes(name)) return r;
        const nr = r.filter((n) => n !== name);
        if (userId) supabaseClient.from("profiles").upsert({ id: userId, bill_rejects: nr }).then(() => {}, () => {});
        return nr;
      });
      return next;
    });
  };
  const handleSaveCatConfig = (next) => {
    const clean = { renames: next.renames || {}, custom: (next.custom || []).map((c) => ({ name: String(c.name || "").trim(), color: c.color || null, keywords: (c.keywords || []).map((k) => String(k).trim()).filter(Boolean) })).filter((c) => c.name) };
    CAT_CONFIG = clean; setCatConfig(clean);
    if (userId) supabaseClient.from("profiles").upsert({ id: userId, category_config: clean }).then(() => {}, () => {});
    pushToast("Categories saved", "success");
  };
  const rescanCategories = async () => {
    const seen = {}; let n = 0;
    for (const t of customTransactions) {
      if (t.name in seen) continue;
      seen[t.name] = true;
      let target = null;
      if (t.amount > 0) {
        const guess = customKeywordCategory(t.name) || categorizeByRules(t.name, -1);
        if (guess && guess !== "Uncategorized") target = guess;
      } else {
        target = customKeywordCategory(t.name) || (t.category === "Uncategorized" ? categorizeByRules(t.name, t.amount) : null);
        if (!target && t.category !== "Entertainment" && categorizeByRules(t.name, t.amount) === "Entertainment") target = "Entertainment";
      }
      if (target && target !== t.category && target !== "Uncategorized") { await recategorizeDescription(t.name, target, { silent: true }); n++; }
    }
    pushToast(n ? (n + " merchant" + (n !== 1 ? "s" : "") + " re-sorted into your categories") : "Nothing new to re-sort", n ? "success" : "info");
  };
  const handleSaveAllTargets = async (byMonth) => {
    const keys = Object.keys(byMonth || {}).filter((k) => /^\d{4}-\d{2}$/.test(k));
    if (!keys.length) return;
    setAllTargets((prev) => ({ ...prev, ...byMonth }));
    const curKey = currentMonthKey();
    if (byMonth[curKey]) setTargets(byMonth[curKey]);
    if (userId) {
      try {
        await supabaseClient.from("targets").delete().eq("user_id", userId).in("month", keys);
        const rows = [];
        keys.forEach((k) => { Object.entries(byMonth[k]).forEach(([category, monthly_target]) => { rows.push({ user_id: userId, category, month: k, monthly_target: Number(monthly_target) || 0 }); }); });
        if (rows.length) await supabaseClient.from("targets").insert(rows);
      } catch (e) { pushToast("Couldn't save targets", "error"); }
    }
  };
  const handleSaveTargets = async (newTargets) => {
    const key = currentMonthKey();
    const cleaned = Object.fromEntries(Object.entries(newTargets).map(([c, v]) => [c, Number(v) || 0]));
    const income = Number(allTargets && allTargets[key] && allTargets[key]["Income"]) || 0;
    if (income > 0 && cleaned["Income"] == null) cleaned["Income"] = income;
    setTargets(cleaned);
    setAllTargets((prev) => ({ ...prev, [key]: cleaned }));
    if (userId) {
      try {
        await supabaseClient.from("targets").delete().eq("user_id", userId).eq("month", key);
        const rows = Object.entries(cleaned).map(([category, monthly_target]) => ({ user_id: userId, category, month: key, monthly_target }));
        if (rows.length) await supabaseClient.from("targets").insert(rows);
      } catch (e) { pushToast("Couldn't save targets", "error"); }
    }
  };
  const handleAddBank = async (bankName, currency) => {
    if (!userId || !bankName) return;
    const { error } = await supabaseClient.from("banks").insert({ user_id: userId, bank_name: bankName, currency: currency || FX.home });
    if (error) throw error;
    FX.bankCurrency[bankName] = currency || FX.home;
    setBanks((prev) => (prev.indexOf(bankName) === -1 ? [...prev, bankName] : prev));
    try {
      const rows = await fetchBanks(userId);
      setBankRows(rows);
    } catch (e) { console.error("Bank list refresh after add failed (non-fatal):", e); }
  };
  const handleRemoveBank = async (bankName) => {
    setBanks((prev) => prev.filter((b) => b !== bankName));
    setUploadedFiles((prev) => { const next = { ...prev }; delete next[bankName]; return next; });
    if (userId) {
      try { await supabaseClient.from("banks").delete().eq("user_id", userId).eq("bank_name", bankName); }
      catch (e) { pushToast("Couldn't remove bank", "error"); }
    }
    pushToast("Bank removed", "info");
  };
  const resetDevAccount = async () => {
    if (!userId) return;
    setCheckingSession(true);
    try {
      await supabaseClient.from("transactions").delete().eq("user_id", userId);
      await supabaseClient.from("targets").delete().eq("user_id", userId);
      await supabaseClient.from("goals").delete().eq("user_id", userId);
      await supabaseClient.from("statements").delete().eq("user_id", userId);
      await supabaseClient.from("banks").delete().eq("user_id", userId);
      await supabaseClient.from("profiles").upsert({ id: userId, name: null, occupation: null, salary_range: null, employment_type: null, overview_layout: null, home_layout: null, savvy: null, tracking: null, balance_check: null, fin_goals: null, setup_completed: null, persona: null });
      try {
        const { data: topLevel } = await supabaseClient.storage.from("statements").list(userId);
        const toRemove = [];
        for (const entry of (topLevel || [])) {
          if (entry.id === null || entry.metadata == null) {
            const { data: sub } = await supabaseClient.storage.from("statements").list(userId + "/" + entry.name);
            (sub || []).forEach((fx) => toRemove.push(userId + "/" + entry.name + "/" + fx.name));
          } else {
            toRemove.push(userId + "/" + entry.name);
          }
        }
        if (toRemove.length) await supabaseClient.storage.from("statements").remove(toRemove);
      } catch (e) {}
      setName(""); setBanks([]); setBankRows([]); setTargets({}); setUploadedFiles({}); setPlan(null);
      setGoals([]); setCustomTransactions([]); setStatements([]); setBalances({});
      setOverviewSlots(DEFAULT_OVERVIEW_SLOTS); setHomeLayout(DEFAULT_HOME_LAYOUT); setExtraProfile(null); setShowExtraBanner(false); setShowSetupBanner(false); setSetupResume(false); setSetupIntroOpen(false); setSetupQuestionsOpen(false); setSetupAnswers(null); setPersonaKey(null);
      pushToast("Dev account reset — starting fresh", "success");
      setStage("onboarding");
    } catch (e) {
      pushToast("Reset failed — check connection", "error");
    }
    setCheckingSession(false);
  };
  const handleResetDev = () => {
    if (window.confirm("Reset the dev account? This deletes all its data and restarts onboarding from scratch.")) {
      resetDevAccount();
    }
  };
  const handleTest = async () => {
    try {
      const { data, error } = await supabaseClient.auth.signInAnonymously();
      if (error || !data?.user) { pushToast("TEST login failed: " + (error?.message || "no session") + " (enable Anonymous sign-ins in Supabase)", "error"); return; }
      setUserId(data.user.id);
      setIsDev(false); setIsAdmin(false); DEV_NOW = null; setDevNow(null);
      setStage("onboarding");
    } catch (e) { pushToast("TEST login error: " + (e?.message || e), "error"); }
  };
  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    setIsDev(false);
    setIsAdmin(false);
    setUserId(null); setName(""); setBanks([]); setBankRows([]); setTargets({}); setUploadedFiles({}); setGoals([]); setCustomTransactions([]); setStatements([]); setPlan(null);
    setOverviewSlots(DEFAULT_OVERVIEW_SLOTS);
    pushToast("Logged out", "info");
    /* Drop any #/page route so the landing page doesn't carry a stale hash. */
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState({}, "", window.location.pathname + window.location.search);
    }
    setStage("landing");
  };

  const dismissNote = async (id) => {
    setNotifications((p) => p.filter((n) => n.id !== id));
    try { await supabaseClient.from("notifications").update({ read: true }).eq("id", id); } catch (e) {}
  };

  if (checkingSession) return null;

  const inApp = ["dashboard", "settings", "mapping", "planSetup", "admin"].includes(stage);

  let content;
  let overlayScreen = null;
  if (stage === "targets") {
    overlayScreen = <TargetSettingScreen overlay userId={userId} transactions={customTransactions} pushToast={pushToast} banks={banks} accountData={{ statements, bankRows }} onBack={() => setStage(setupResume ? "setupQuestions" : "breakdown")} onDone={(t, p) => {
      setTargets(t); setPlan(p || null);
      if (!setupResume) setSignupMonth(new Date().toISOString().slice(0, 7));
      if (userId) fetchAllTargets(userId).then(setAllTargets).catch(() => {});
      setShowExtraBanner(true);
      if (setupAnswers) {
        const pk = scorePersona(setupAnswers);
        const tpl = PERSONA_TEMPLATES[pk];
        if (tpl) {
          setHomeLayout(tpl.layout);
          if (userId) supabaseClient.from("profiles").upsert({ id: userId, home_layout: tpl.layout, persona: pk }).then(() => {}, () => {});
        }
        setPersonaKey(pk);
        setStage("buildingDashboard");
      } else {
        if (!setupResume) setRunTour(true);
        setSetupResume(false);
        setStage("dashboard");
      }
    }} />;
  } else if (stage === "buildingDashboard") {
    overlayScreen = <BuildingDashboardScreen overlay personaKey={personaKey} onDone={() => { const first = !setupResume; setSetupResume(false); setSetupAnswers(null); if (first) setRunTour(true); setStage("dashboard"); }} />;
  }
  if (stage === "landing") {
    content = (
      <LandingScreen
        onSignup={() => { setReturnStage("landing"); setStage("signup"); }}
        onLogin={() => { setReturnStage("landing"); setStage("login"); }}
        onTest={handleTest}
      />
    );
  } else if (stage === "welcome") {
    content = (
      <WelcomeScreen
        onChoose={(mode) => { setReturnStage("welcome"); setStage(mode === "signup" ? "signup" : "login"); }}
        onOpenLegal={(tab) => openLegal(tab, "welcome")}
      />
    );
  } else if (stage === "legal") {
    content = <LegalScreen initialTab={legalTab} onBack={() => setStage(returnStage)} theme={theme} />;
  } else if (stage === "login" || stage === "signup") {
    content = (
      <AuthScreen
        initialMode={stage}
        onBack={() => setStage(returnStage)}
        onError={(msg, type) => pushToast(msg, type || "error")}
        onDone={async (mode, uid, profile) => {
          setUserId(uid);
          try { const em = (await supabaseClient.auth.getUser()).data?.user?.email || ""; setIsDev(em === DEV_EMAIL); setIsAdmin(em === ADMIN_EMAIL); } catch (e) {}
          if (mode === "login") {
            if (profile?.name) {
              const bankRows = await fetchBanks(uid);
              const targetObj = await fetchTargets(uid);
              const txRows = await fetchTransactions(uid);
              const goalRows = await fetchGoals(uid);
              const stmtRows = await fetchStatements(uid);
              setGoals(goalRows);
              setName(profile.name);
              setSignupMonth((profile.created_at || "").slice(0, 7) || null);
              setBanks(bankRows.map((b) => b.bank_name));
              setBankRows(bankRows);
              setTargets(targetObj); fetchAllTargets(uid).then(setAllTargets).catch(() => {});
              setCustomTransactions(txRows);
              setStatements(stmtRows);
              setUploadedFiles(Object.fromEntries(bankRows.map((b) => [b.bank_name, [{ name: "existing", size: 1, id: b.id }]])));
              setOverviewSlots(parseOverviewLayout(profile)); setHomeLayout(parseHomeLayout(profile)); setTheme(normalizeTheme(profile && profile.theme)); setShowSetupBanner(!!profile && profile.setup_completed === false); setPersonaKey((profile && profile.persona) || null);
              setNavViews(parseNavLayout(profile));
              setBillExcludes(parseBillExcludes(profile)); setBillRejects(parseBillRejects(profile)); setBillsSetupDone(!!(profile && profile.bills_setup_done)); { const _cc = parseCategoryConfig(profile); CAT_CONFIG = _cc; setCatConfig(_cc); }
      setPlan(planFromProfile(profile));
              setShowSplash(true);
              setTimeout(() => setShowSplash(false), 2900);
              setStage("dashboard");
            } else {
              setStage("onboarding");
            }
          } else {
            setStage("onboarding");
          }
        }}
        onOpenLegal={(tab) => openLegal(tab, stage)}
      />
    );
  } else if (stage === "onboarding") {
    content = <OnboardingScreen userId={userId} pushToast={pushToast} onLogout={handleLogout} initialName={name} initialBanks={banks} isDev={isDev} onSkipToTour={skipToTour} onDone={(d) => { setName(d.name); setBanks(d.banks); setDemoCurrencies((d.currencies && d.currencies.length ? d.currencies : ["GBP"])); setStage("upload"); }} />;
  } else if (stage === "upload") {
    content = (
      <UploadScreen
        banks={banks}
        userId={userId}
        pushToast={pushToast}
        onBack={() => setStage("onboarding")}
        onSkip={() => setStage("demoUpload")}
        onDone={(files, bal, parsedTxs, newStatements) => {
          setUploadedFiles(files); setBalances(bal);
          const allTx = [...(parsedTxs || []), ...customTransactions];
          const allStmts = [...statements, ...(newStatements || [])];
          if (newStatements && newStatements.length) setStatements(allStmts);
          if (parsedTxs && parsedTxs.length) { setCustomTransactions(parsedTxs); runAiFallback(parsedTxs); }
          if (newStatements && newStatements.length) runReconciliation(allStmts, allTx, null);
          fetchBanks(userId).then((rows) => setBankRows(rows));
          setStage("processing");
        }}
      />
    );
  } else if (stage === "demoUpload") {
    {
      const bankCurs = [...new Set((bankRows || []).map((r) => r.currency || "GBP"))];
      const effDemoCurs = bankCurs.length ? bankCurs.slice(0, 2) : demoCurrencies;
      content = <DemoUploadScreen currencies={effDemoCurs} onUseDemo={startDemo} onSkipEmpty={() => setStage("processing")} onBack={() => setStage("upload")} />;
    }
  } else if (stage === "processing") {
    content = <ProcessingScreen transactions={customTransactions} onDone={() => setStage("confirmCategory")} />;
  } else if (stage === "confirmCategory") {
    content = <ConfirmCategoryScreen transactions={customTransactions} onConfirm={recategorizeDescription} onDone={() => setStage("openingBalance")} />;
  } else if (stage === "openingBalance") {
    content = <OpeningBalanceScreen banks={banks} statements={statements} userId={userId} pushToast={pushToast} onBack={() => setStage("upload")} onDone={async () => { await reloadFxData(); setStage("breakdown"); }} />;
  } else if (stage === "breakdown") {
    content = <MonthlyBreakdownScreen transactions={customTransactions} bankRows={bankRows} onBack={() => setStage("openingBalance")} onDone={() => { setSetupIntroOpen(true); setStage("dashboard"); }} />;
  } else if (stage === "extraQuestions") {
    content = (
      <ExtraQuestionsScreen
        userId={userId}
        pushToast={pushToast}
        onDone={(data) => { setExtraProfile(data); setShowExtraBanner(false); setStage("dashboard"); }}
        onSkip={() => { setShowExtraBanner(false); setStage("dashboard"); }}
      />
    );
  } else if (stage === "planSetup") {
    content = <TargetSettingScreen userId={userId} transactions={customTransactions} pushToast={pushToast} banks={banks} accountData={{ statements, bankRows }} isEdit onBack={() => setStage("dashboard")} onDone={(t, p) => { setTargets(t); setPlan(p || null); if (userId) fetchAllTargets(userId).then(setAllTargets).catch(() => {}); setStage("dashboard"); }} />;
  } else if (stage === "mapping") {
    content = <MappingScreen transactions={customTransactions} onRecategorize={recategorizeDescription} onBack={() => setStage("dashboard")} theme={theme} />;
  } else if (stage === "settings") {
    content = (
      <SettingsScreen
        setupPending={showSetupBanner}
        onResumeSetup={() => { setSetupResume(true); setSetupQuestionsOpen(true); setStage("dashboard"); }}
        extraPending={showExtraBanner}
        onCompleteExtra={() => setStage("extraQuestions")}
        name={name} banks={banks} targets={targets} userId={userId}
        pushToast={pushToast}
        onBack={() => setStage("dashboard")}
        onOpenLegal={(tab) => openLegal(tab, "settings")}
        onLogout={handleLogout}
        onSaveName={handleSaveName}
        onRemoveBank={handleRemoveBank}
        onAddBank={handleAddBank}
        onSaveTargets={handleSaveTargets}
        theme={theme}
        onChangeTheme={handleChangeTheme}
        onSaveCurrency={handleSaveCurrency}
        onSaveFxRate={handleSaveFxRate}
        onEditTargetsPage={() => { setTargetsEditReq(true); setStage("dashboard"); }}
      />
    );
  } else if (stage === "admin") {
    content = <AdminScreen onBack={() => setStage("dashboard")} pushToast={pushToast} />;
  } else {
    content = (
      <DashboardScreen
        name={name}
        signupMonth={signupMonth}
        targets={targets}
        banks={banks}
        bankRows={bankRows}
        hasData={hasData}
        onOpenSettings={() => setStage("settings")}
        onOpenMapping={() => setStage("mapping")}
        plan={plan}
        onEditPlan={() => setStage("planSetup")}
        onRecategorize={recategorizeDescription}
        showExtraBanner={showExtraBanner}
        onCompleteExtra={() => setStage("extraQuestions")}
        onDismissExtra={() => setShowExtraBanner(false)}
        onLogout={handleLogout}
        transactions={customTransactions}
        onAddTransactions={handleAddTransactions}
        usingDemo={usingDemo}
        pushToast={pushToast}
        overviewSlots={overviewSlots}
        homeLayout={homeLayout}
        onChangeHomeLayout={handleChangeHomeLayout}
        setupPending={showSetupBanner}
        onResumeSetup={() => { setSetupResume(true); setSetupQuestionsOpen(true); setStage("dashboard"); }}
        persona={personaKey}
        onSetPersona={handleSetPersona}
        setupIntroOpen={setupIntroOpen}
        setupQuestionsOpen={setupQuestionsOpen}
        setupQuestionsProps={{
          userId: userId,
          pushToast: pushToast,
          onBack: () => { setSetupQuestionsOpen(false); if (!setupResume) setSetupIntroOpen(true); },
          onDone: (ans) => { setSetupAnswers(ans); setShowSetupBanner(false); setSetupQuestionsOpen(false); setStage("targets"); },
        }}
        onSetupStart={() => { setSetupIntroOpen(false); setSetupQuestionsOpen(true); }}
        onSetupSkip={() => {
          setSetupIntroOpen(false);
          setSignupMonth(new Date().toISOString().slice(0, 7));
          setShowSetupBanner(true); setShowExtraBanner(true);
          if (userId) supabaseClient.from("profiles").upsert({ id: userId, setup_completed: false }).then(() => {}, () => {});
          pushToast("No problem — you can finish this anytime from your Profile in Settings", "info");
          setRunTour(true);
        }}
        onChangeOverviewSlots={handleChangeOverviewSlots}
        navViews={navViews}
        onChangeNavViews={handleChangeNavViews}
        allTargets={allTargets}
        billExcludes={billExcludes}
        onToggleBillExclude={handleToggleBillExclude}
        billRejects={billRejects}
        onRejectBill={handleRejectBill}
        billsSetupDone={billsSetupDone}
        billsSetupOpen={billsSetupOpen}
        onOpenBillsSetup={() => setBillsSetupOpen(true)}
        onCloseBillsSetup={() => { setBillsSetupOpen(false); markBillsSetupDone(); }}
        onSaveBillsSetup={handleSaveBillsSetup}
        billsNudgeHidden={billsNudgeHidden}
        onDismissBillsNudge={() => { setBillsNudgeHidden(true); markBillsSetupDone(); }}
        overlayScreen={overlayScreen}
        catConfig={catConfig}
        onSaveCatConfig={handleSaveCatConfig}
        onRescanCategories={rescanCategories}
        goals={goals}
        goalsApi={goalsApi}
        accountData={{ statements, bankRows }}
        isDev={isDev}
        isAdmin={isAdmin}
        onOpenAdmin={() => setStage("admin")}
        onResetDev={handleResetDev}
        runTour={runTour}
        onFinishTour={() => setRunTour(false)}
        theme={theme}
        rollovers={rollovers}
        onOpenReview={openReviewManual}
        onSaveAllTargets={handleSaveAllTargets}
        openTargetsEdit={targetsEditReq}
        onConsumeTargetsEdit={() => setTargetsEditReq(false)}
        userId={userId}
        onOpenLegal={openLegal}
        onSaveName={handleSaveName}
        onRemoveBank={handleRemoveBank}
        onAddBank={handleAddBank}
        onSaveTargets={handleSaveTargets}
        onChangeTheme={handleChangeTheme}
        onSaveCurrency={handleSaveCurrency}
        onSaveFxRate={handleSaveFxRate}
      />
    );
  }

  return (
    <>
      {isAdmin && inApp && !MP_PREVIEW && <AdminBar onOpen={() => setStage("admin")} />}
      {isDev && inApp && !MP_PREVIEW && <TestingBar personaKey={personaKey} onSetPersona={handleSetPersona} />}
      {(isDev || DEV_FLAG) && inApp && !MP_PREVIEW && (
        <div style={{ position: "fixed", bottom: 68, left: 12, zIndex: 9999, background: "#1a1f2b", color: "#e8edf4", padding: "6px 10px", borderRadius: 8, fontSize: 12, display: "flex", gap: 8, alignItems: "center", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
          <span style={{ opacity: 0.7 }}>DEV date:</span>
          <input type="date" value={devNow || ""} onChange={(e) => setDevDate(e.target.value)} style={{ fontSize: 12, padding: "2px 4px", borderRadius: 4, border: "1px solid #3a4356", background: "#0f1420", color: "#e8edf4" }} />
          {devNow && <button onClick={() => setDevDate("")} style={{ fontSize: 11, cursor: "pointer", background: "none", border: "none", color: "#8fa3bd", textDecoration: "underline" }}>reset</button>}
          <button onClick={() => setMobilePreview((v) => !v)} style={{ fontSize: 11, cursor: "pointer", background: mobilePreview ? "#2E5BFF" : "#0f1420", border: "1px solid #3a4356", color: "#e8edf4", borderRadius: 4, padding: "3px 8px" }}>{mobilePreview ? "Exit mobile" : "📱 Mobile"}</button>
        </div>
      )}
      {mobilePreview && inApp && !MP_PREVIEW && (() => {
        const dev = DEVICE_PRESETS[previewDevice] || DEVICE_PRESETS.iphone15;
        const vw = previewLandscape ? dev.h : dev.w;
        const vh = previewLandscape ? dev.w : dev.h;
        const maxH = typeof window !== "undefined" ? window.innerHeight - 170 : 800;
        const scale = Math.min(1, maxH / vh);
        const personaOpts = [...Object.keys(PERSONA_TEMPLATES).map((k) => ({ key: k, name: PERSONA_TEMPLATES[k].name })), { key: "no_targets", name: "Default (no targets)" }];
        const src = (typeof window !== "undefined" ? window.location.origin + window.location.pathname : "") + "?mp=1" + (devNow ? "&devdate=" + devNow : "");
        return (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(10,13,20,0.9)", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px", overflow: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 8 }}>
            <span style={{ color: "#e8edf4", fontSize: 13, fontWeight: 700, marginRight: 2 }}>Mobile preview</span>
            <select value={previewDevice} onChange={(e) => setPreviewDevice(e.target.value)} style={{ fontSize: 12, padding: "4px 6px", borderRadius: 6, background: "#0f1420", color: "#e8edf4", border: "1px solid #3a4356" }}>
              {Object.keys(DEVICE_PRESETS).map((k) => (
                <option key={k} value={k}>{DEVICE_PRESETS[k].name + " · " + DEVICE_PRESETS[k].w + "×" + DEVICE_PRESETS[k].h}</option>
              ))}
            </select>
            <button onClick={() => setPreviewLandscape((v) => !v)} style={{ fontSize: 12, cursor: "pointer", background: previewLandscape ? "#2E5BFF" : "#0f1420", color: "#e8edf4", border: "1px solid #3a4356", borderRadius: 6, padding: "4px 10px" }}>{previewLandscape ? "Landscape" : "Portrait"}</button>
            <button onClick={() => setMpNonce((n) => n + 1)} style={{ fontSize: 12, cursor: "pointer", background: "#0f1420", color: "#e8edf4", border: "1px solid #3a4356", borderRadius: 6, padding: "4px 10px" }}>Reload</button>
            <span style={{ color: "#8fa3bd", fontSize: 11 }}>{vw + "×" + vh + " · @" + dev.dpr + "x" + (scale < 1 ? " · " + Math.round(scale * 100) + "%" : "")}</span>
            <button onClick={() => setMobilePreview(false)} style={{ fontSize: 12, cursor: "pointer", background: "#2E5BFF", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontWeight: 600 }}>Close</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 10 }}>
            <span style={{ color: "#8fa3bd", fontSize: 11, marginRight: 2 }}>Persona:</span>
            {personaOpts.map((o) => (
              <button key={o.key} onClick={() => { handleSetPersona(o.key); setTimeout(() => setMpNonce((n) => n + 1), 350); }} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 999, cursor: "pointer", border: "1px solid rgba(255,255,255,.4)", background: personaKey === o.key ? "#C2410C" : "transparent", color: "#fff", fontWeight: personaKey === o.key ? 700 : 500 }}>{o.name}</button>
            ))}
          </div>
          <div style={{ width: (vw + 24) * scale, height: (vh + 24) * scale, flex: "0 0 auto" }}>
            <div style={{ width: vw, height: vh, transform: "scale(" + scale + ")", transformOrigin: "top left", border: "12px solid #1a1f2b", borderRadius: previewLandscape ? 34 : 42, boxSizing: "content-box", background: "#fff", boxShadow: "0 24px 70px rgba(0,0,0,.6)", overflow: "hidden" }}>
              <iframe
                key={previewDevice + (previewLandscape ? "-l" : "-p") + "-" + mpNonce}
                src={src}
                title="Mobile preview"
                style={{ width: vw, height: vh, border: "none", background: "#fff", display: "block" }}
              />
            </div>
          </div>
          <div style={{ color: "#5f7291", fontSize: 10, marginTop: 16, textAlign: "center", maxWidth: 480, lineHeight: 1.5 }}>Runs the real mobile code path inside the frame: touch input, pointer:coarse, mobile viewport and PWA standalone display are emulated. Not a desktop resize.</div>
        </div>
        );
      })()}
      {isDev && !MP_PREVIEW && stage !== "dashboard" && (
        <button onClick={doSkipToDashboard} title="Load the dummy statement data + Dec £15,000 goal and jump straight to the dashboard" style={{ position: "fixed", bottom: 12, right: 12, zIndex: 9999, background: "#2E5BFF", color: "#fff", padding: "11px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 6px 20px rgba(46,91,255,.4)" }}>⚡ Skip to dashboard</button>
      )}
      {stage === "dashboard" && <NotificationBanner notes={notifications} onDismiss={dismissNote} />}
      {content}
      {reviewMonth && (
        <MonthEndReviewModal
          month={reviewMonth}
          transactions={customTransactions}
          budgets={reviewBudgets}
          goal={goals && goals.length ? goals[0] : null}
          onAction={handleReviewAction}
          onClose={closeReview}
          isManual={reviewManual}
          plan={plan}
          allTargets={allTargets}
        />
      )}
      {showSplash && <LoginSplash />}
      <ToastContainer toasts={toasts} />
    </>
  );
}

/* Remove the pre-React boot shell now that we're about to paint the real UI. */
/* Render into a sibling node rather than #root itself: createRoot() wipes its
   container, which was yanking the boot shell out mid-animation (it just
   flashed and vanished). Mount alongside it, then fade the shell out once the
   logo animation has had time to land. */
(function () {
  const shell = document.getElementById("boot-shell");
  const rootEl = document.getElementById("root");
  const mount = document.createElement("div");
  rootEl.appendChild(mount);
  ReactDOM.createRoot(mount).render(<App />);
  if (shell) {
    const started = window.__bootStart || Date.now();
    /* Only mobile plays the animation, so only mobile waits for it to land.
       Desktop shows a static logo and can drop it as soon as React is up. */
    /* Only returning/logged-in users see the branded loading hold. A brand-new
       visitor (no Supabase session token in storage) should land straight on the
       page with no animated splash. */
    let hasSession = false;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf("-auth-token") !== -1 && localStorage.getItem(k)) { hasSession = true; break; }
      }
    } catch (e) {}
    const animated = hasSession
      && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wait = animated ? Math.max(0, 2000 - (Date.now() - started)) : 0;
    setTimeout(function () {
      shell.style.transition = "opacity .45s ease";
      shell.style.opacity = "0";
      setTimeout(function () { if (shell.parentNode) shell.parentNode.removeChild(shell); }, 480);
    }, wait);
  }
})();
