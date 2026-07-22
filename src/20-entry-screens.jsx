function LandingScreen({ onSignup, onLogin, onSkip, onTest }) {
  const showTest = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("dev") === "1";
  const revealRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -5% 0px" });
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page stage-fade">
      <div className="blob blob1" /><div className="blob blob2" /><div className="blob blob3" />

      <div className="lp-nav">
        <div className="brand"><span className="brand-word">Two<span className="brand-word-2">Pockets</span></span></div>
        <div className="lp-nav-actions">
          <button className="btn btn-ghost" onClick={onLogin}>Log in</button>
          <button className="btn btn-primary" onClick={onSignup}>Start free trial</button>
          {showTest && <button className="btn btn-ghost" onClick={onTest} style={{ border: "1px dashed #f59e0b", color: "#b45309", fontWeight: 700 }}>TEST</button>}
        </div>
      </div>

      <div className="lp-hero lp-wrap">
        <div className="lp-hero-copy">
          <span className="hero-eyebrow">Built in Dubai for UAE expats</span>
          <h1>Your money here <em style={{fontStyle:"normal", color:"var(--accent)"}}>and</em> back home. One clear picture.</h1>
          <p>One salary, two countries &mdash; your UAE and home-country banks in one clear total. No bank login, no spreadsheets.</p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-large" onClick={onSignup}>Start free trial</button>
            <button className="btn btn-ghost btn-large" onClick={() => document.getElementById("lp-how").scrollIntoView({ behavior: "smooth" })}>See how it works</button>
          </div>
          <p className="hero-try-note">Want a look first? Try it with sample data &mdash; no statements needed.</p>
        </div>
      </div>

      <div className="lp-trust-strip reveal">
        <div className="lp-trust-facts">
          <span className="lp-trust-fact"><Icon name="file" size={16} /> Works with PDF &amp; CSV</span>
          <span className="lp-trust-dot" />
          <span className="lp-trust-fact"><Icon name="income" size={16} /> AED + your home currency</span>
          <span className="lp-trust-dot" />
          <span className="lp-trust-fact"><Icon name="sparkles" size={16} /> UAE &amp; UK banks &middot; more currencies soon</span>
        </div>
        <p className="lp-trust-note">No bank login, ever &mdash; not here, not back home.</p>
      </div>

      <div className="lp-section lp-wrap" id="lp-how">
        <div className="section-head reveal"><h2>How it works</h2><p>From two countries&rsquo; worth of statements to one clear picture &mdash; in three steps. No syncing, no permissions.</p></div>

        <div className="lp-step reveal">
          <div className="lp-step-copy">
            <div className="step-num">1</div>
            <h3>Drop in your statements</h3>
            <p>Add statements from your UAE bank and your home-country bank &mdash; Emirates NBD, HSBC, Monzo, any bank. PDF or CSV. No login, ever.</p>
          </div>
          <LpUploadDemo />
        </div>

        <div className="lp-step lp-step-flip reveal">
          <div className="lp-step-copy">
            <div className="step-num">2</div>
            <h3>AI sorts every transaction</h3>
            <p>Groceries, bills, dining, subscriptions — categorised automatically the moment your statement lands. Correct one merchant once and it's remembered everywhere.</p>
          </div>
          <LpCategoriseDemo />
        </div>

        <div className="lp-step reveal">
          <div className="lp-step-copy">
            <div className="step-num">3</div>
            <h3>Your dashboard fills in</h3>
            <p>Spending, budgets and trends populate instantly across both countries &mdash; your whole picture, live from your real data.</p>
          </div>
          <LpViewsDemo />
        </div>

      </div>

      <div className="lp-section lp-wrap">
        <div className="section-head reveal"><h2>The parts people love</h2><p>Built around the reality of a life &mdash; and money &mdash; in two countries.</p></div>

        <div className="lp-step reveal">
          <div className="lp-step-copy">
            <div className="step-num lpd-cur-num">&pound;/&#65284;</div>
            <h3>Two currencies. One life. One total.</h3>
            <p>Your dirham salary and home-country account, side by side &mdash; each in its own currency, all converting into whichever home currency you pick, at a rate locked per month. <b>GBP today, USD &amp; EUR on the way.</b></p>
          </div>
          <LpCurrencyDemo />
        </div>

        <div className="lp-step lp-step-flip reveal">
          <div className="lp-step-copy">
            <div className="step-num lpd-cur-num"><Icon name="star4" size={17} /></div>
            <h3>Just ask, in plain English</h3>
            <p>&ldquo;How much did I spend on coffee last month?&rdquo; Ask a question and get a straight answer worked out from your own transactions &mdash; no filters, no formulas.</p>
          </div>
          <LpAskDemo />
        </div>

        <div className="lp-step reveal">
          <div className="lp-step-copy">
            <div className="step-num lpd-cur-num"><Icon name="star4" size={17} /></div>
            <h3>It notices things for you</h3>
            <p>TwoPockets surfaces what changed before you go looking &mdash; overspends, savings on track, your biggest merchant this month.</p>
          </div>
          <LpInsightsDemo />
        </div>


      </div>

      <div className="lp-section lp-wrap">
        <div className="section-head reveal"><h2>Everything you get</h2><p>A clean dashboard built around how you actually think about money.</p></div>
        <div className="features">
          <div className="feature-card reveal">
            <div className="feature-icon"><Icon name="sparkles" size={18} /></div>
            <h4>Ask about your money</h4>
            <p>Ask a plain-English question and get an answer from your own transactions.</p>
            <div className="fc-viz fc-viz-ask">
              <span className="fc-q">How much on coffee?</span>
              <span className="fc-a">AED 318 &middot; 19 visits</span>
            </div>
          </div>
          <div className="feature-card reveal">
            <div className="feature-icon"><Icon name="calendar" size={18} /></div>
            <h4>Month-end review</h4>
            <p>Close out each month, then catch up or roll over what you didn&rsquo;t spend.</p>
            <div className="fc-viz fc-viz-roll">
              <span className="fc-roll-from">June &middot; &pound;63 left</span>
              <span className="fc-roll-arrow">&rarr;</span>
              <span className="fc-roll-to">July +&pound;63</span>
            </div>
          </div>
          <div className="feature-card reveal">
            <div className="feature-icon"><Icon name="trending" size={18} /></div>
            <h4>Long-term plan</h4>
            <p>Plan months ahead and reconcile your actual spending against the plan.</p>
            <div className="fc-viz fc-viz-roll">
              <span className="fc-roll-from">Today &middot; AED 8,400</span>
              <span className="fc-roll-arrow">&rarr;</span>
              <span className="fc-roll-to">Dec &middot; AED 19,600</span>
            </div>
          </div>
          <div className="feature-card reveal">
            <div className="feature-icon"><Icon name="income" size={18} /></div>
            <h4>Multi-currency</h4>
            <p>Track GBP and AED accounts together, converted into your home currency.</p>
            <div className="fc-viz fc-viz-cur">
              <span className="fc-chip">&pound; GBP</span>
              <span className="fc-chip">AED</span>
              <span className="fc-chip fc-chip-soft">1 view</span>
            </div>
          </div>
          <div className="feature-card reveal">
            <div className="feature-icon"><Icon name="target" size={18} /></div>
            <h4>Goals &amp; targets</h4>
            <p>Set budgets and savings goals, and track how you&rsquo;re pacing toward them.</p>
            <div className="fc-viz fc-viz-goal">
              <div className="fc-bar"><span style={{ width: "68%" }} /></div>
              <span className="fc-bar-label">68%</span>
            </div>
          </div>
          <div className="feature-card reveal">
            <div className="feature-icon"><Icon name="bills" size={18} /></div>
            <h4>Bills &amp; subscriptions</h4>
            <p>Keep track of recurring payments and due dates in one place.</p>
            <div className="fc-viz fc-viz-bills">
              <span className="fc-bill fc-bill-paid">Netflix &middot; paid</span>
              <span className="fc-bill fc-bill-paid">Spotify &middot; paid</span>
              <span className="fc-bill fc-bill-due">DEWA &middot; due</span>
            </div>
          </div>
        </div>
      </div>

      <div className="lp-section lp-wrap">
        <div className="section-head reveal"><h2>Simple pricing</h2><p>Start free. Upgrade whenever you're ready.</p></div>
        <div className="pricing">
          <div className="price-card reveal">
            <div className="price-tag">Free trial</div>
            <div className="price-amount">£0</div>
            <div className="price-period">for 28 days &middot; both countries</div>
            <ul className="price-features"><li>3 statement uploads</li><li>10 &ldquo;Ask about your money&rdquo; questions</li><li>Full dashboard access</li></ul>
            <button className="btn btn-ghost" style={{ width: "100%" }} onClick={onSignup}>Start free trial</button>
          </div>
          <div className="price-card highlight reveal">
            <div className="price-tag">Pro</div>
            <div className="price-amount">AED 23</div>
            <div className="price-period">per month &middot; approx &pound;4.99</div>
            <ul className="price-features"><li>Unlimited uploads</li><li>Unlimited &ldquo;Ask about your money&rdquo; questions</li><li>Full dashboard access</li><li>Priority support</li></ul>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={onSignup}>Start free trial</button>
          </div>
        </div>
      </div>

      <div className="lp-final-cta lp-wrap reveal">
        <h2>Ready to see your whole picture &mdash; here and back home?</h2>
        <p>No bank login required, in either country. Cancel anytime.</p>
        <button className="btn btn-primary btn-large" onClick={onSignup}>Start your free trial</button>
      </div>

      <footer className="lp-footer">
        <a className="lp-ig" href="https://instagram.com/twopockets.ae" target="_blank" rel="noopener noreferrer" aria-label="TwoPockets on Instagram">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
          </svg>
          <span>@twopockets.ae</span>
        </a>
      </footer>
    </div>
  );
}

/* ---------------- Welcome (entry) ---------------- */

function WelcomeScreen({ onChoose, onSkip, onOpenLegal }) {
  return (
    <div className="page stage-fade">
      <div className="blob blob1" /><div className="blob blob2" /><div className="blob blob3" />
      <div className="glass-card welcome-card">
        <div className="brand-row" style={{ justifyContent: "center", marginBottom: 8 }}>
          <div className="brand-dot" /><span className="brand-name">{APP_NAME}</span>
        </div>
        <h1 className="title" style={{ textAlign: "center" }}>Welcome</h1>
        <p className="subtitle" style={{ textAlign: "center" }}>Are you new here, or already have an account?</p>
        <div className="welcome-btn-col">
          <button className="glass-btn primary" onClick={() => onChoose("signup")}>New customer</button>
          <button className="glass-btn ghost welcome-ghost" onClick={() => onChoose("login")}>Existing customer</button>
        </div>
        <p className="legal-note">
          By continuing you agree to our{" "}
          <button className="link-btn inline" onClick={() => onOpenLegal("terms")}>Terms</button> and{" "}
          <button className="link-btn inline" onClick={() => onOpenLegal("privacy")}>Privacy Policy</button>
        </p>
      </div>
    </div>
  );
}

/* ---------------- Legal (privacy / terms) ---------------- */

function LegalScreen({ initialTab, onBack, theme }) {
  const [tab, setTab] = useState(initialTab || "privacy");
  const sections = tab === "privacy" ? PRIVACY_SECTIONS : TERMS_SECTIONS;
  return (
    <div className="page stage-fade app-shell" data-theme={normalizeTheme(theme)}>
      <div className="blob blob1" /><div className="blob blob2" /><div className="blob blob3" />
      <div className="glass-card legal-card">
        <div className="brand-row">
          <button className="icon-btn back-btn" onClick={onBack} aria-label="Back">←</button>
          <span className="brand-name">Legal</span>
        </div>
        <div className="legal-tabs">
          <button className={"legal-tab " + (tab === "privacy" ? "legal-tab-active" : "")} onClick={() => setTab("privacy")}>Privacy Policy</button>
          <button className={"legal-tab " + (tab === "terms" ? "legal-tab-active" : "")} onClick={() => setTab("terms")}>Terms of Service</button>
        </div>
        <p className="test-banner">Test copy for development only — not yet reviewed by a lawyer.</p>
        <div className="legal-scroll">
          {sections.map((s, i) => (
            <div className="legal-section" key={i}>
              <h3 className="legal-heading">{s.h}</h3>
              <p className="legal-body">{s.b}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Toasts ---------------- */

function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={"toast toast-" + (t.type || "info")}>{t.message}</div>
      ))}
    </div>
  );
}

/* ---------------- Upload statement modal ---------------- */

function UploadStatementModal({ onClose, onImport, pushToast, banks }) {
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [bank, setBank] = useState(banks && banks.length === 1 ? banks[0] : null);
  const [pending, setPending] = useState(null); // { transactions, meta, fileName } awaiting manual balances
  const [openingInput, setOpeningInput] = useState("");
  const [closingInput, setClosingInput] = useState("");
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!bank) { pushToast("Pick which bank this statement is from first", "error"); return; }
    const vErr = validateFile(file);
    if (vErr) { pushToast(vErr, "error"); return; }
    const lower = file.name.toLowerCase();
    setBusy(lower.endsWith(".pdf") ? "AI is reading your PDF…" : "Reading file…");
    try {
      const { transactions, meta } = await parseStatementFile(file);
      if (!transactions.length) throw new Error("No transactions found in that file — check it’s a bank statement with a transaction list.");
      setBusy(false);
      if (meta.opening !== null && meta.closing !== null) {
        onImport(transactions, bank, meta, file.name, file);
      } else {
        setOpeningInput(meta.opening !== null ? String(meta.opening) : "");
        setClosingInput(meta.closing !== null ? String(meta.closing) : "");
        setPending({ transactions, meta, fileName: file.name, rawFile: file });
      }
    } catch (e) {
      setBusy(false);
      pushToast(e.message || "Couldn't read that file — check the format.", "error");
    }
  };

  const finishPending = (withBalances) => {
    const meta = { ...pending.meta };
    if (withBalances) {
      meta.opening = openingInput === "" ? null : Number(openingInput);
      meta.closing = closingInput === "" ? null : Number(closingInput);
    }
    onImport(pending.transactions, bank, meta, pending.fileName, pending.rawFile);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-card modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="brand-row" style={{ marginBottom: 12, justifyContent: "space-between" }}>
          <span className="brand-name">Upload statement</span>
          <button className="icon-btn" onClick={onClose} aria-label="Close" style={{ color: "var(--ink)" }}>×</button>
        </div>

        {!pending && (
          <>
            <p className="subtitle">Which bank is this statement from?</p>
            <div className="modal-bank-row">
              {(banks && banks.length ? banks : []).map((b) => (
                <button key={b} className={"chip " + (bank === b ? "chip-selected" : "")} onClick={() => setBank(b)}>
                  <span>{b}</span>
                  {bank === b && <span className="check-badge"><Icon name="check" size={11} strokeWidth={3.2} /></span>}
                </button>
              ))}
            </div>
            <div
              className={"dropzone " + (dragActive ? "dropzone-active" : "") + (!bank ? " dropzone-disabled" : "")}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => bank && inputRef.current?.click()}
            >
              <p className="dropzone-text">{busy ? busy : bank ? "Drag & drop a PDF or CSV here, or click to browse" : "Select a bank above to enable upload"}</p>
              <input ref={inputRef} type="file" accept=".csv,.pdf" style={{ display: "none" }}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
            <p className="summary-note" style={{ marginTop: 14 }}>CSV needs Date, Description and Amount (or Debit/Credit) columns. PDFs are read by AI.</p>
          </>
        )}

        {pending && (
          <>
            <p className="subtitle">
              We couldn't find the opening and closing balances on this statement
              {pending.meta.periodStart ? " (" + pending.meta.periodStart + " → " + pending.meta.periodEnd + ")" : ""}.
              Enter them so we can check nothing is missing.
            </p>
            <div className="balance-row" style={{ marginBottom: 6 }}>
              <div className="balance-field">
                <label className="field-label">Opening balance</label>
                <div className="target-input-wrap" style={{ width: "100%" }}>
                  <span className="target-currency">{curSym(FX.bankCurrency[bank] || "GBP")}</span>
                  <input className="target-input" style={{ width: "100%" }} type="number" placeholder="0"
                    value={openingInput} onChange={(e) => setOpeningInput(e.target.value)} />
                </div>
              </div>
              <div className="balance-field">
                <label className="field-label">Closing balance</label>
                <div className="target-input-wrap" style={{ width: "100%" }}>
                  <span className="target-currency">{curSym(FX.bankCurrency[bank] || "GBP")}</span>
                  <input className="target-input" style={{ width: "100%" }} type="number" placeholder="0"
                    value={closingInput} onChange={(e) => setClosingInput(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="nav-row">
              <button className="glass-btn ghost" onClick={() => finishPending(false)}>Skip check</button>
              <button className="glass-btn primary" disabled={openingInput === "" || closingInput === ""} onClick={() => finishPending(true)}>Import & check</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- Auth ---------------- */

function AuthScreen({ onDone, onSkip, initialMode, onOpenLegal, onError, onBack }) {
  const [mode, setMode] = useState(initialMode || "login");
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const isLogin = mode === "login", isSignup = mode === "signup", isForgot = mode === "forgot";
  const canSubmit = isForgot
    ? email.trim().length > 0
    : isSignup
    ? email.trim().length > 0 && password.length > 0 && password === confirmPassword
    : email.trim().length > 0 && password.length > 0;

  return (
    <div className="page stage-fade">
      <div className="blob blob1" /><div className="blob blob2" /><div className="blob blob3" />
      <div className="glass-card auth-card">
        <div className="brand-row">{onBack && <button className="icon-btn back-btn" onClick={onBack} aria-label="Back">←</button>}<div className="brand-dot" /><span className="brand-name">{APP_NAME}</span></div>
        {isForgot ? (
          <><h1 className="title">Reset your password</h1><p className="subtitle">We'll send a reset link to your email.</p></>
        ) : (
          <><h1 className="title">{isLogin ? "Welcome back" : "Create your account"}</h1>
          <p className="subtitle">{isLogin ? "Log in to keep tracking your finances." : "Let's get you set up."}</p></>
        )}
        <div className="field-group">
          <label className="field-label">Email</label>
          <input className="glass-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {!isForgot && (
          <div className="field-group">
            <label className="field-label">Password</label>
            <input className="glass-input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        )}
        {isSignup && (
          <div className="field-group">
            <label className="field-label">Confirm password</label>
            <input className="glass-input" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        )}
        {isLogin && <button className="link-btn" onClick={() => setMode("forgot")}>Forgot password?</button>}
        <button className="glass-btn primary" disabled={!canSubmit || submitting} onClick={async () => {
          setSubmitting(true);
          try {
            if (isForgot) {
              const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
              setSubmitting(false);
              if (error) return onError(error.message);
              onError("Check your email for a reset link.", "success");
              return;
            }
            if (mode === "signup") {
              const { data, error } = await supabaseClient.auth.signUp({ email, password });
              if (error) { setSubmitting(false); return onError(error.message); }
              if (!data.session) {
                setSubmitting(false);
                onError("Account created. Check your email to confirm before logging in.", "success");
                return;
              }
              onDone(mode, data.user?.id, null);
            } else {
              const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
              if (error) { setSubmitting(false); return onError(error.message); }
              const profile = await fetchProfile(data.user.id);
              onDone(mode, data.user.id, profile);
            }
          } catch (e) {
            setSubmitting(false);
            onError("Something went wrong: " + (e?.message || "please try again"));
          }
        }}>
          {submitting ? <span className="btn-spinner" /> : isForgot ? "Send reset link" : isLogin ? "Log in" : "Sign up"}
        </button>
        <div className="switch-row">
          {isForgot ? (
            <span>Remembered it? <button className="link-btn inline" onClick={() => setMode("login")}>Log in</button></span>
          ) : isLogin ? (
            <span>New here? <button className="link-btn inline" onClick={() => setMode("signup")}>Sign up</button></span>
          ) : (
            <span>Already have an account? <button className="link-btn inline" onClick={() => setMode("login")}>Log in</button></span>
          )}
        </div>
        <p className="legal-note">
          By continuing you agree to our{" "}
          <button className="link-btn inline" onClick={() => onOpenLegal("terms")}>Terms</button> and{" "}
          <button className="link-btn inline" onClick={() => onOpenLegal("privacy")}>Privacy Policy</button>
        </p>
      </div>
    </div>
  );
}

/* ---------------- Onboarding ---------------- */

function OnboardingScreen({ onDone, userId, pushToast, onLogout, initialName, initialBanks, isDev, onSkipToTour }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName || "");
  const [baseKey, setBaseKey] = useState("UAE");
  const [homeKey, setHomeKey] = useState("UK");
  // Step 1 lead question: "expat" | "uk_only" | null. Drives the currency defaults.
  const [expatChoice, setExpatChoice] = useState(null);
  const [singleCurrency, setSingleCurrency] = useState(false);
  const [displayCur, setDisplayCur] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const base = countryByKey(LIVE_COUNTRIES, baseKey);
  const localCur = base ? base.cur : "AED";
  const home = countryByKey(HOME_COUNTRIES, homeKey);
  const homeCur = home ? home.cur : "GBP";
  const isDual = !singleCurrency && homeCur !== localCur;
  const effectiveDisplay = isDual ? (displayCur || localCur) : localCur;

  // currencies the user actually banks in (local first)
  const activeCurrencies = isDual ? [localCur, homeCur] : [localCur];

  const [bankCurrency, setBankCurrency] = useState(() => {
    const m = {}; (initialBanks || []).forEach((b) => { m[b] = UAE_BANKS.includes(b) ? "AED" : "GBP"; }); return m;
  });
  // Custom bank names entered via the "Other" chip, keyed by currency (e.g. { AED: "Ajman Bank" })
  const [otherBankName, setOtherBankName] = useState({});
  const banks = Object.keys(bankCurrency);

  // "Other" is tracked per-currency (independent of bankCurrency, which keys by unique bank name)
  const [otherCur, setOtherCur] = useState({}); // { AED: true, GBP: true }
  const toggleBankCur = (b, cur) => {
    if (b === "Other") {
      setOtherCur((prev) => { const next = { ...prev }; if (next[cur]) delete next[cur]; else next[cur] = true; return next; });
      return;
    }
    setBankCurrency((prev) => {
      const next = { ...prev };
      if (next[b] === cur) delete next[b]; else next[b] = cur;
      return next;
    });
  };

  // drop any selected banks / Other flags whose currency is no longer active
  React.useEffect(() => {
    setBankCurrency((prev) => {
      const next = {}; let changed = false;
      Object.entries(prev).forEach(([b, c]) => { if (activeCurrencies.includes(c)) next[b] = c; else changed = true; });
      return changed ? next : prev;
    });
    setOtherCur((prev) => {
      const next = {}; let changed = false;
      Object.entries(prev).forEach(([c, v]) => { if (activeCurrencies.includes(c)) next[c] = v; else changed = true; });
      return changed ? next : prev;
    });
  }, [baseKey, homeKey, singleCurrency]);

  // reset chosen display currency whenever the currency pair changes
  React.useEffect(() => { setDisplayCur(null); }, [baseKey, homeKey, singleCurrency]);

  const activeOtherCurs = Object.keys(otherCur).filter((c) => otherCur[c] && activeCurrencies.includes(c));
  const otherNeedsName = activeOtherCurs.some((c) => !(otherBankName[c] || "").trim());
  const totalBankSelections = banks.length + activeOtherCurs.length;
  const canContinue = [
    name.trim().length > 0,
    !!expatChoice,
    singleCurrency || !!homeKey,
    !!effectiveDisplay,
    totalBankSelections > 0 && !otherNeedsName,
  ][step];

  const goNext = () => {
    let n = step + 1;
    if (n === 3 && !isDual) n = 4; // single-currency: skip the dashboard-currency choice
    setStep(n);
  };
  const goBack = () => {
    let n = step - 1;
    if (n === 3 && !isDual) n = 2;
    setStep(Math.max(n, 0));
  };

  const finish = async () => {
    setSubmitting(true);
    const homeCurrencyToSave = effectiveDisplay;
    const { error: pErr } = await supabaseClient.from("profiles").upsert({ id: userId, name: name.trim(), home_currency: homeCurrencyToSave });
    // Named banks + one custom entry per currency where "Other" was chosen
    const bankRows = banks.map((b) => ({ name: b, cur: bankCurrency[b] }));
    activeOtherCurs.forEach((c) => {
      const typed = (otherBankName[c] || "").trim();
      if (typed) bankRows.push({ name: typed, cur: c });
    });
    const banksResolved = bankRows.map((r) => r.name);
    const curForBank = {}; bankRows.forEach((r) => { curForBank[r.name] = r.cur; });
    const existingBanks = await fetchBanks(userId);
    const existingNames = existingBanks.map((r) => r.bank_name);
    const toAdd = banksResolved.filter((b) => !existingNames.includes(b));
    const toRemove = existingNames.filter((n) => !banksResolved.includes(n));
    let bErr = null;
    if (toAdd.length) { const { error } = await supabaseClient.from("banks").insert(toAdd.map((b) => ({ user_id: userId, bank_name: b, currency: curForBank[b] || localCur }))); bErr = error; }
    if (toRemove.length) { try { await supabaseClient.from("banks").delete().eq("user_id", userId).in("bank_name", toRemove); } catch (e) {} }
    const check = await fetchProfile(userId);
    const savedBanks = await fetchBanks(userId);
    const banksOk = banksResolved.every((b) => savedBanks.some((r) => r.bank_name === b));
    if (pErr || bErr || !check?.name || !banksOk) {
      const msg = (pErr || bErr)?.message
        || (!check?.name ? "your profile didn't save (profiles table permissions)"
        : "your banks didn't save (banks table permissions)");
      pushToast("Couldn't save: " + msg, "error");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    // Re-initialise FX with the freshly-saved profile so the chosen display currency
    // takes effect immediately — otherwise FX.home stays on the boot default (e.g. AED)
    // and the breakdown summary + dashboard render in the wrong currency.
    try {
      const freshProfile = await fetchProfile(userId);
      const freshBanks = await fetchBanks(userId);
      await initFx(userId, freshProfile, freshBanks);
    } catch (e) { console.error("FX init after onboarding failed (non-fatal):", e); }
    onDone({ name: name.trim(), banks: banksResolved, currencies: activeCurrencies });
  };

  const next = async () => {
    if (step === ONBOARD_STEPS - 1) { await finish(); }
    else goNext();
  };
  const back = () => goBack();

  const bankGroups = [{ cur: localCur, label: (base ? base.label : "Local") + " bank", flag: base ? base.flag : "" }];
  if (isDual) bankGroups.push({ cur: homeCur, label: (home ? home.label : "Home") + " bank", flag: home ? home.flag : "" });

  return (
    <div className="page stage-fade">
      <div className="blob blob1" /><div className="blob blob2" /><div className="blob blob3" />
      <div className={"glass-card onboard-card" + (step === 0 ? " onboard-compact" : "")}>
        <div className="progress-dots">
          {Array.from({ length: ONBOARD_STEPS }).map((_, i) => (
            <div key={i} className={"dot " + (i <= step ? "dot-active" : "")} />
          ))}
        </div>

        {step === 0 && (
          <div className="step">
            <h1 className="title">Nice to meet you, what's your name?</h1>
            <p className="subtitle">Just so we know what to call you — nothing formal.</p>
            <input className="glass-input" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            {isDev && onSkipToTour && (
              <button className="glass-btn ghost" style={{ marginTop: 16, width: "100%", flex: "none", fontSize: 14 }}
                onClick={() => onSkipToTour(name.trim() || "Tester")}>
                {"\u26A1"} Testing: skip to dashboard tour (loads sample data)
              </button>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="step">
            <h1 className="title">Are you an expat in the UAE?</h1>
            <p className="subtitle">TwoPockets is built for people living in the UAE with money back home. Pick what fits you best.</p>
            <div className="segmented">
              <button className={"segment " + (expatChoice === "expat" ? "segment-active" : "")}
                onClick={() => { setExpatChoice("expat"); setBaseKey("UAE"); setSingleCurrency(false); }}>
                <span>{"\uD83C\uDDE6\uD83C\uDDEA"} Yes — I live in the UAE<span className="segment-sub">Track AED, plus your home currency</span></span>
                {expatChoice === "expat" && <span className="check-badge"><Icon name="check" size={11} strokeWidth={3.2} /></span>}
              </button>
              <button className={"segment " + (expatChoice === "single" ? "segment-active" : "")}
                onClick={() => { setExpatChoice("single"); setSingleCurrency(true); }}>
                <span>No — but I want to use the app<span className="segment-sub">Track one currency of your choice</span></span>
                {expatChoice === "single" && <span className="check-badge"><Icon name="check" size={11} strokeWidth={3.2} /></span>}
              </button>
            </div>
            <p className="currency-note" style={{ textAlign: "center", marginTop: 14 }}>Don't worry — you can change any of this later in Settings.</p>
          </div>
        )}

        {step === 2 && expatChoice === "single" && (
          <div className="step">
            <h1 className="title">Which currency do you want to track?</h1>
            <p className="subtitle">Pick the currency your everyday spending is in.</p>
            <div className="segmented">
              {SINGLE_CURRENCIES.map((c) => (
                <button key={c.key} className={"segment " + (baseKey === c.key ? "segment-active" : "")}
                  onClick={() => setBaseKey(c.key)}>
                  <span>{c.flag} {c.label}<span className="segment-sub">{c.cur}</span></span>
                  {baseKey === c.key && <span className="check-badge"><Icon name="check" size={11} strokeWidth={3.2} /></span>}
                </button>
              ))}
            </div>
            <p className="currency-note" style={{ textAlign: "center", marginTop: 14 }}>You can change this any time in Settings.</p>
          </div>
        )}

        {step === 2 && expatChoice !== "single" && (
          <div className="step">
            <h1 className="title">And where's home?</h1>
            <p className="subtitle">Most people here still have money in another country — a salary, savings, or family back home. We'll track both currencies for you.</p>
            <div className="segmented">
              {HOME_COUNTRIES.map((c) => (
                <button key={c.key} className={"segment " + (!singleCurrency && homeKey === c.key ? "segment-active" : "")}
                  style={singleCurrency ? { opacity: 0.45, pointerEvents: "none" } : null}
                  onClick={() => setHomeKey(c.key)}>
                  <span>{c.flag} {c.label}<span className="segment-sub">{c.cur}</span></span>
                  {!singleCurrency && homeKey === c.key && <span className="check-badge"><Icon name="check" size={11} strokeWidth={3.2} /></span>}
                </button>
              ))}
            </div>
            <label className="currency-multi">
              <input type="checkbox" checked={singleCurrency} onChange={(e) => setSingleCurrency(e.target.checked)} />
              <span>I only bank in {base ? base.label : localCur}</span>
            </label>
            <p className="currency-note">You can add or change this any time in Settings.</p>
          </div>
        )}

        {step === 3 && (
          <div className="step">
            <h1 className="title">Which currency should your dashboard show in?</h1>
            <p className="subtitle">Your totals, budgets and charts all display in this one currency.</p>
            <div className="segmented">
              <button className={"segment " + (effectiveDisplay === localCur ? "segment-active" : "")} onClick={() => setDisplayCur(localCur)}>
                <span>{localCur} — where you live<span className="segment-sub">Your local currency</span></span>
                {effectiveDisplay === localCur && <span className="check-badge"><Icon name="check" size={11} strokeWidth={3.2} /></span>}
              </button>
              <button className={"segment " + (effectiveDisplay === homeCur ? "segment-active" : "")} onClick={() => setDisplayCur(homeCur)}>
                <span>{homeCur} — where you're from<span className="segment-sub">Your home currency</span></span>
                {effectiveDisplay === homeCur && <span className="check-badge"><Icon name="check" size={11} strokeWidth={3.2} /></span>}
              </button>
            </div>
            <p className="currency-note">Spending in your other currency is automatically converted in — so everything adds up in one place, using a rate locked for each month.</p>
          </div>
        )}

        {step === 4 && (
          <div className="step">
            <h1 className="title">{isDual ? "Which banks do you use?" : "Who's your bank?"}</h1>
            <p className="subtitle">{isDual ? "Pick your bank in each country. No bank login needed — just your statements later." : "Select all that apply. Don't see yours? Add more later in Settings."}</p>
            {bankGroups.map((g) => (
              <div className="currency-bank-group" key={g.cur}>
                {isDual && <div className="currency-bank-head">{g.flag} Your {g.label}</div>}
                <div className="bank-grid">
                  {(CURRENCY_BANKS[g.cur] || BANKS).map((b) => {
                    const sel = b === "Other" ? !!otherCur[g.cur] : bankCurrency[b] === g.cur;
                    return (
                      <button key={g.cur + b} className={"chip bank-chip " + (sel ? "chip-selected" : "")} onClick={() => toggleBankCur(b, g.cur)}>
                        <span>{b}</span>
                        {sel && <span className="check-badge"><Icon name="check" size={11} strokeWidth={3.2} /></span>}
                      </button>
                    );
                  })}
                </div>
                {otherCur[g.cur] && (
                  <input className="glass-input other-bank-input" type="text" autoFocus
                    placeholder={"Type your " + g.cur + " bank name"}
                    value={otherBankName[g.cur] || ""}
                    onChange={(e) => setOtherBankName((p) => ({ ...p, [g.cur]: e.target.value }))} />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="nav-row">
          {step > 0 && <button className="glass-btn ghost" onClick={back} disabled={submitting}>Back</button>}
          <button className="glass-btn primary" disabled={!canContinue || submitting} onClick={next}>
            {submitting ? <span className="btn-spinner" /> : step === ONBOARD_STEPS - 1 ? "Finish" : "Continue"}
          </button>
        </div>
        <button className="onboard-escape" onClick={onLogout} disabled={submitting}>Log out / start over</button>
      </div>
    </div>
  );
}

/* ---------------- Per-bank statement upload ---------------- */

const VALID_EXTENSIONS = [".pdf", ".csv"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function validateFile(file) {
  const lower = file.name.toLowerCase();
  const validExt = VALID_EXTENSIONS.some((ext) => lower.endsWith(ext));
  if (!validExt) return "Only PDF or CSV files are supported.";
  if (file.size > MAX_FILE_SIZE) return "File too large (max 10MB).";
  return null;
}

function BankUploadBlock({ bank, files, error, onAdd, onRemove }) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault(); setDragActive(false);
    if (e.dataTransfer.files?.length) onAdd(e.dataTransfer.files);
  };

  return (
    <div className="bank-upload-block">
      <div className="bank-upload-head">
        <span className="bank-upload-name">{bank}</span>
        <span className={"bank-upload-count " + (files.length >= 3 ? "count-good" : "")}>
          {files.length} file{files.length !== 1 ? "s" : ""} added
        </span>
      </div>
      <div
        className={"dropzone dropzone-compact " + (dragActive ? "dropzone-active" : "") + (error ? " dropzone-error" : "")}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <p className="dropzone-text">Drag & drop, or click to browse</p>
        <input ref={inputRef} type="file" multiple accept=".pdf,.csv" style={{ display: "none" }}
          onChange={(e) => e.target.files?.length && onAdd(e.target.files)} />
      </div>
      {error && <p className="error-text">{error}</p>}
      {files.length > 0 && (
        <div className="file-list">
          {files.map((f) => (
            <div key={f.id} className="file-row">
              <div className="file-info"><span className="file-name">{f.name}</span><span className="file-size">{formatSize(f.size)}</span></div>
              <button className="file-remove" onClick={() => onRemove(f.id)}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UploadScreen({ banks, onDone, pushToast, userId, onBack, onSkip }) {
  const [filesByBank, setFilesByBank] = useState(() => Object.fromEntries(banks.map((b) => [b, []])));
  const [balanceByBank, setBalanceByBank] = useState(() => Object.fromEntries(banks.map((b) => [b, { balance: "", date: "" }])));
  const [errorsByBank, setErrorsByBank] = useState(() => Object.fromEntries(banks.map((b) => [b, null])));
  const [submitting, setSubmitting] = useState(false);

  const addFiles = (bank, fileList) => {
    const incoming = [];
    let firstError = null;
    Array.from(fileList).forEach((f) => {
      const err = validateFile(f);
      if (err) { if (!firstError) firstError = err; return; }
      incoming.push({ name: f.name, size: f.size, id: f.name + f.size + Math.random(), rawFile: f });
    });
    if (firstError) {
      setErrorsByBank((prev) => ({ ...prev, [bank]: firstError }));
      pushToast(firstError, "error");
      setTimeout(() => setErrorsByBank((prev) => ({ ...prev, [bank]: null })), 4000);
    }
    if (incoming.length) {
      setFilesByBank((prev) => ({ ...prev, [bank]: [...prev[bank], ...incoming] }));
      pushToast(incoming.length > 1 ? "Files added" : "File added", "success");
    }
  };
  const removeFile = (bank, id) => {
    setFilesByBank((prev) => ({ ...prev, [bank]: prev[bank].filter((f) => f.id !== id) }));
    pushToast("File removed", "info");
  };

  const allHaveAtLeastOne = banks.every((b) => filesByBank[b].length > 0);

  const handleContinue = async (skip) => {
    setSubmitting(true);
    const allParsed = [];
    const savedStatements = [];
    let totalSkipped = 0;
    for (const bank of banks) {
      const bal = balanceByBank[bank];
      if (bal.balance || bal.date) {
        try {
          await supabaseClient.from("banks").update({
            starting_balance: bal.balance ? Number(bal.balance) : null,
            as_of_date: bal.date || null,
          }).eq("user_id", userId).eq("bank_name", bank);
        } catch (e) {}
      }
      if (skip) continue;
      for (const f of filesByBank[bank]) {
        try {
          const path = userId + "/" + bank + "/" + Date.now() + "_" + f.name;
          await supabaseClient.storage.from("statements").upload(path, f.rawFile);
        } catch (e) { pushToast("Couldn't archive " + f.name + " to storage — continuing anyway", "info"); }
        try {
          const { transactions: parsed, meta } = await parseStatementFile(f.rawFile);
          parsed.forEach((t) => { t.bank = bank; });
          if (!parsed.length) { pushToast("No transactions found in " + f.name, "error"); continue; } /* TS5 fix: don't insert an orphan statements row for a file with no transactions */
          const { kept, skipped, stmtRow } = await importStatementUnit({ userId, bank, txs: parsed, meta, fileName: f.name, existing: allParsed, pushToast });
          totalSkipped += skipped;
          if (stmtRow) savedStatements.push(stmtRow);
          kept.forEach((t) => { t._stmtId = stmtRow ? stmtRow.id : null; });
          allParsed.push(...kept);
        } catch (e) {
          pushToast("Couldn't read " + f.name + " — " + (e.message || "check the format"), "error");
        }
      }
    }
    if (!skip && !allParsed.length && totalSkipped === 0) {
      setSubmitting(false);
      pushToast("None of the files could be read — nothing was imported. Try different files, or Skip for now.", "error");
      return;
    }
    let saved = allParsed;
    if (allParsed.length) {
      try {
        saved = [];
        const byStmt = {};
        allParsed.forEach((t) => { (byStmt[t._stmtId || "none"] = byStmt[t._stmtId || "none"] || []).push(t); });
        for (const [stmtId, group] of Object.entries(byStmt)) {
          const rows = await saveTransactionsToDb(userId, null, group, stmtId === "none" ? null : stmtId);
          saved.push(...rows);
        }
      } catch (e) { saved = allParsed; pushToast("Transactions parsed but couldn't be saved to your account", "error"); }
      pushToast(importToast(allParsed.length, totalSkipped), "success");
    }
    setSubmitting(false);
    onDone(filesByBank, balanceByBank, saved, savedStatements);
  };

  return (
    <div className="page stage-fade">
      <div className="blob blob1" /><div className="blob blob2" /><div className="blob blob3" />
      <div className="glass-card upload-card">
        <div className="brand-row"><div className="brand-dot" /><span className="brand-name">{APP_NAME}</span></div>
        <h1 className="title">Upload your bank statements</h1>
        <p className="subtitle">Add at least 3 months per bank so we can spot regular patterns.</p>
        <div className="bank-upload-list">
          {banks.map((b) => (
            <div key={b}>
              <BankUploadBlock
                bank={b}
                files={filesByBank[b]}
                error={errorsByBank[b]}
                onAdd={(fl) => addFiles(b, fl)}
                onRemove={(id) => removeFile(b, id)}
              />
            </div>
          ))}
        </div>

        <div className="nav-row">
          {onBack && <button className="glass-btn ghost" disabled={submitting} onClick={onBack}>Back</button>}
          <button className="glass-btn ghost" disabled={submitting} onClick={() => (onSkip ? onSkip() : handleContinue(true))}>Skip for now</button>
          <button className="glass-btn primary" disabled={!allHaveAtLeastOne || submitting} onClick={() => handleContinue(false)}>
            {submitting ? <span className="btn-spinner" /> : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DemoUploadScreen({ currencies, onUseDemo, onSkipEmpty, onBack }) {
  const curs = (currencies && currencies.length ? currencies : ["GBP"]).slice(0, 2);
  const multi = curs.length > 1;
  const [dropped, setDropped] = useState({});
  const [over, setOver] = useState(false);
  const [touchDrag, setTouchDrag] = useState(null);
  const dropRef = React.useRef(null);
  const touchStartRef = React.useRef(null);
  const isOverDrop = (x, y) => {
    const el = dropRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };
  const onFileTouchStart = (c) => (e) => {
    if (dropped[c]) return;
    const t = e.touches[0];
    touchStartRef.current = { c, x: t.clientX, y: t.clientY };
    setTouchDrag({ c, dx: 0, dy: 0 });
  };
  const onFileTouchMove = (e) => {
    const s = touchStartRef.current;
    if (!s) return;
    const t = e.touches[0];
    setTouchDrag({ c: s.c, dx: t.clientX - s.x, dy: t.clientY - s.y });
    setOver(isOverDrop(t.clientX, t.clientY));
  };
  const onFileTouchEnd = (e) => {
    const s = touchStartRef.current;
    if (!s) return;
    const t = e.changedTouches[0];
    if (t && isOverDrop(t.clientX, t.clientY)) markDropped(s.c);
    touchStartRef.current = null;
    setTouchDrag(null);
    setOver(false);
  };
  const allDone = curs.every((c) => dropped[c]);
  const doneCount = curs.filter((c) => dropped[c]).length;
  const markDropped = (c) => {
    if (dropped[c]) return;
    setDropped((prev) => {
      const next = { ...prev, [c]: true };
      if (curs.every((x) => next[x])) setTimeout(() => onUseDemo(curs), 650);
      return next;
    });
  };
  const onDropZone = (e) => {
    e.preventDefault(); setOver(false);
    const c = e.dataTransfer.getData("text/plain");
    if (c && curs.includes(c)) markDropped(c);
    else { const nextC = curs.find((x) => !dropped[x]); if (nextC) markDropped(nextC); }
  };
  return (
    <div className="page stage-fade">
      <div className="blob blob1" /><div className="blob blob2" /><div className="blob blob3" />
      <div className="glass-card upload-card">
        <div className="brand-row"><div className="brand-dot" /><span className="brand-name">{APP_NAME}</span></div>
        <h1 className="title">{multi ? "No statements handy? Try it with sample data" : "No statement handy? Try it with sample data"}</h1>
        <p className="subtitle">{multi
          ? "Drag both files into the box (or click each). We'll load a statement for each of your currencies so you can see how conversion works."
          : "Drag the file into the box (or just click it) and we'll run the full setup on a demo statement, so you can see exactly how everything works."}</p>

        <div className="demo-sim">
          <div className="demo-file-stack">
            {curs.map((c) => (
              <div key={c}
                   className={"demo-file" + (multi ? " demo-file-sm" : "") + (dropped[c] ? " demo-file-gone" : "")}
                   draggable={!dropped[c]}
                   onDragStart={(e) => { e.dataTransfer.setData("text/plain", c); e.dataTransfer.effectAllowed = "copy"; }}
                   onTouchStart={onFileTouchStart(c)}
                   onTouchMove={onFileTouchMove}
                   onTouchEnd={onFileTouchEnd}
                   onTouchCancel={onFileTouchEnd}
                   style={touchDrag && touchDrag.c === c ? { transform: "translate(" + touchDrag.dx + "px, " + touchDrag.dy + "px)", transition: "none", zIndex: 5, position: "relative" } : undefined}
                   onClick={() => markDropped(c)}
                   title="Drag me into the box, or click">
                <div className="demo-file-icon"><Icon name="file" size={18} /></div>
                <div className="demo-file-name">Sample_{c}_Statement.csv</div>
                <div className="demo-file-hint">{multi ? c + " account" : "drag me → or click"}</div>
              </div>
            ))}
          </div>
          <div className="demo-arrow">→</div>
          <div ref={dropRef} className={"demo-drop" + (over ? " demo-drop-over" : "") + (allDone ? " demo-drop-done" : "")}
               onDragOver={(e) => { e.preventDefault(); setOver(true); }}
               onDragLeave={() => setOver(false)}
               onDrop={onDropZone}
               onClick={() => { const nextC = curs.find((x) => !dropped[x]); if (nextC) markDropped(nextC); }}>
            {allDone ? "Got it ✓" : multi ? (doneCount + " of " + curs.length + " added") : "Drop the file here"}
          </div>
        </div>

        <div className="nav-row">
          {onBack && <button className="glass-btn ghost" onClick={onBack}>Back</button>}
          <button className="glass-btn ghost demo-skip-empty" style={{ flex: 1 }} onClick={onSkipEmpty}>Start empty instead</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Processing simulation ---------------- */

function ProcessingScreen({ onDone, transactions }) {
  const sample = React.useMemo(() => {
    const spend = (transactions || []).filter((t) => t.amount < 0 && t.name);
    const seen = new Set();
    const uniq = [];
    for (const t of spend) {
      const k = t.name.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k); uniq.push(t);
      if (uniq.length >= 10) break;
    }
    if (uniq.length < 4) {
      const demo = [
        { name: "SPINNEYS DUBAI", category: "Groceries", amount: -184 },
        { name: "CAREEM RIDE", category: "Transport", amount: -32 },
        { name: "NETFLIX.COM", category: "Subscriptions", amount: -46 },
        { name: "STARBUCKS", category: "Dining", amount: -28 },
        { name: "AMAZON.AE", category: "Shopping", amount: -220 },
        { name: "DEWA", category: "Bills", amount: -310 },
      ];
      for (const d of demo) { if (uniq.length >= 6) break; uniq.push(d); }
    }
    return uniq;
  }, [transactions]);

  const [revealed, setRevealed] = useState(0);
  const [pct, setPct] = useState(0);

  const startedRef = React.useRef(false);
  useEffect(() => {
    if (startedRef.current) return undefined;
    startedRef.current = true;
    const total = sample.length || 1;
    let i = 0;
    let doneTimer = null;
    const tick = setInterval(() => {
      i += 1;
      setRevealed(Math.min(i, total));
      setPct(Math.min(100, Math.round((i / total) * 100)));
      if (i >= total) {
        clearInterval(tick);
        doneTimer = setTimeout(onDone, 900);
      }
    }, 420);
    return () => { clearInterval(tick); if (doneTimer) clearTimeout(doneTimer); };
  }, []);

  return (
    <div className="page stage-fade">
      <div className="blob blob1" /><div className="blob blob2" /><div className="blob blob3" />
      <div className="glass-card processing-card processing-anim-card">
        <div className="spinner" />
        <h1 className="title" style={{ marginTop: 18 }}>Coding up your transactions</h1>
        <p className="subtitle">Sorting each one into a category. This usually takes a few seconds.</p>

        <div className="code-feed">
          {sample.slice(0, revealed).map((t, i) => (
            <div className="code-row" key={i}>
              <span className="code-name">{t.name}</span>
              <span className="code-arrow">→</span>
              <span className="code-cat" style={{ background: catColor(t.category) + "22", color: catColor(t.category), borderColor: catColor(t.category) + "66" }}>
                <span className="code-cat-dot" style={{ background: catColor(t.category) }} />
                {t.category}
              </span>
            </div>
          ))}
        </div>

        <div className="progress-track" style={{ marginTop: 18 }}>
          <div className="progress-fill" style={{ width: pct + "%" }} />
        </div>
        <p className="summary-note">{pct}%</p>
      </div>
    </div>
  );
}

/* ---------------- Confirm one categorization (trust builder) ---------------- */

function ConfirmCategoryScreen({ transactions, onConfirm, onDone }) {
  const candidate = React.useMemo(() => {
    const spend = (transactions || []).filter((t) => t.amount < 0 && t.name);
    const known = (cat) => spend.find((t) => t.category === cat);
    return known("Groceries") || spend.find((t) => t.category && !["Uncategorized", "Income", "Other"].includes(t.category)) || spend[0]
      || { name: "SPINNEYS DUBAI", category: "Groceries", amount: -184 };
  }, [transactions]);

  const [choice, setChoice] = useState(candidate.category && candidate.category !== "Uncategorized" ? candidate.category : "Groceries");
  const [submitting, setSubmitting] = useState(false);
  const options = ALL_CATEGORIES.filter((c) => c !== "Uncategorized");

  const handleConfirm = async () => {
    setSubmitting(true);
    try { if (choice !== candidate.category && onConfirm) await onConfirm(candidate.name, choice); } catch (e) {}
    setSubmitting(false);
    onDone();
  };

  return (
    <div className="page stage-fade">
      <div className="blob blob1" /><div className="blob blob2" /><div className="blob blob3" />
      <div className="glass-card size-md">
        <div className="brand-row"><div className="brand-dot" /><span className="brand-name">{APP_NAME}</span></div>
        <h1 className="title">Quick check</h1>
        <p className="subtitle">We sorted your transactions automatically. Help us confirm one so we know we've got it right.</p>

        <div className="confirm-tx-card">
          <span className="confirm-tx-name">{candidate.name}</span>
          <span className="confirm-tx-amount">{formatMoney2(candidate.amount)}</span>
        </div>

        <div className="field-group" style={{ marginTop: 16 }}>
          <label className="field-label">We think this is</label>
          <div className="target-input-wrap" style={{ width: "100%", padding: "4px 8px" }}>
            <span className="cat-dot" style={{ background: catColor(choice), marginLeft: 4 }} />
            <select className="confirm-select" value={choice} onChange={(e) => setChoice(e.target.value)}>
              {options.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="nav-row">
          <button className="glass-btn primary" disabled={submitting} onClick={handleConfirm}>
            {submitting ? <span className="btn-spinner" /> : "Looks right"}
          </button>
        </div>
        <p className="summary-note" style={{ marginTop: 10 }}>You'll be able to review and change any categorisation later.</p>
      </div>
    </div>
  );
}

/* ---------------- Opening balance ---------------- */

function OpeningBalanceScreen({ banks, statements, userId, pushToast, onDone, onBack }) {
  const perBank = React.useMemo(() => {
    return banks.map((b) => {
      const stmts = (statements || []).filter((s) => s.bank === b && s.periodStart).sort((x, y) => (x.periodStart < y.periodStart ? -1 : 1));
      const first = stmts[0];
      return { bank: b, currency: (FX.bankCurrency && FX.bankCurrency[b]) || (UAE_BANKS.includes(b) ? "AED" : FX.home), start: first ? first.periodStart : null, suggested: first && first.opening !== null && first.opening !== undefined ? first.opening : null };
    });
  }, [banks, statements]);

  const [vals, setVals] = useState(() => Object.fromEntries(perBank.map((p) => [p.bank, { balance: p.suggested !== null && p.suggested !== undefined ? String(p.suggested) : "", date: p.start || "" }])));
  const [submitting, setSubmitting] = useState(false);
  const setV = (bank, field, value) => setVals((prev) => ({ ...prev, [bank]: { ...prev[bank], [field]: value } }));

  const handleContinue = async () => {
    setSubmitting(true);
    for (const p of perBank) {
      const v = vals[p.bank];
      if (v && (v.balance !== "" || v.date)) {
        try {
          await supabaseClient.from("banks").update({
            starting_balance: v.balance !== "" ? Number(v.balance) : null,
            as_of_date: v.date || null,
          }).eq("user_id", userId).eq("bank_name", p.bank);
        } catch (e) {}
      }
    }
    setSubmitting(false);
    onDone(vals);
  };

  return (
    <div className="page stage-fade">
      <div className="blob blob1" /><div className="blob blob2" /><div className="blob blob3" />
      <div className="glass-card upload-card">
        <div className="brand-row"><div className="brand-dot" /><span className="brand-name">{APP_NAME}</span></div>
        <h1 className="title">Your opening balance</h1>
        <p className="subtitle">What was the balance in each account at the start of the period you uploaded? This anchors your running balance and forecasts.</p>

        <div className="bank-upload-list">
          {perBank.map((p) => (
            <div className="bank-upload-block" key={p.bank}>
              <div className="bank-upload-head">
                <span className="bank-upload-name">{p.bank}</span>
                {p.suggested !== null && p.suggested !== undefined && <span className="bank-upload-count count-good">detected from statement</span>}
              </div>
              <div className="balance-row">
                <div className="balance-field">
                  <label className="field-label">Opening balance</label>
                  <div className="target-input-wrap balance-input-wrap" style={{ width: "100%", padding: "10px 12px", marginTop: 4 }}>
                    <span className="target-currency">{curSym(p.currency)}</span>
                    <input className="target-input" style={{ width: "100%", fontSize: 14 }} type="text" inputMode="decimal" placeholder="0"
                      value={fmtBalInput(vals[p.bank].balance)} onChange={(e) => setV(p.bank, "balance", e.target.value.replace(/[^0-9.\-]/g, ""))} />
                  </div>
                </div>
                <div className="balance-field">
                  <label className="field-label">As of date</label>
                  <input className="glass-input" style={{ padding: "10px 12px", fontSize: 14, marginTop: 4 }} type="date"
                    value={vals[p.bank].date} onChange={(e) => setV(p.bank, "date", e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="nav-row">
          {onBack && <button className="glass-btn ghost" disabled={submitting} onClick={onBack}>Back</button>}
          <button className="glass-btn ghost" disabled={submitting} onClick={() => onDone(vals)}>Skip</button>
          <button className="glass-btn primary" disabled={submitting} onClick={handleContinue}>
            {submitting ? <span className="btn-spinner" /> : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Monthly breakdown table ---------------- */

function MonthlyBreakdownScreen({ onDone, transactions, onBack, bankRows }) {
  const startingBal = (bankRows || []).reduce((s, r) => s + convStartingBal(r), 0);
  const hasReal = transactions && transactions.length > 0;
  let categories, monthLabels, byCatByMonth, incomeByMonth, openingByMonth, closingByMonth;
  if (hasReal) {
    const dataKeys = [...new Set(transactions.map((t) => (t.date || "").slice(0, 7)).filter((k) => /^\d{4}-\d{2}$/.test(k)))].sort();
    const keys = dataKeys.length ? dataKeys.slice(-3) : lastNMonthKeys(latestMonthKey(transactions), 1);
    monthLabels = keys.map(monthLabelFromKey);
    const perMonth = keys.map((k) => spendByCategoryForMonth(transactions, k));
    const catSet = new Set();
    perMonth.forEach((o) => Object.keys(o).forEach((c) => catSet.add(c)));
    categories = [...TX_CATEGORIES, ...[...catSet].filter((c) => !TX_CATEGORIES.includes(c))];
    if (!categories.length) categories = ["Uncategorized"];
    byCatByMonth = Object.fromEntries(categories.map((c) => [c, perMonth.map((o) => (o[c] || 0))]));
    incomeByMonth = keys.map((k) => incomeForMonth(transactions, k));
  } else {
    categories = Object.keys(CATEGORY_MONTHLY);
    monthLabels = MONTH_LABELS;
    byCatByMonth = CATEGORY_MONTHLY;
    incomeByMonth = INCOME_MONTHLY;
  }
  const nMonths = monthLabels.length;
  openingByMonth = Array(nMonths).fill(0); closingByMonth = Array(nMonths).fill(0);
  const totalsByMonth = monthLabels.map((_, mi) =>
    categories.reduce((s, c) => s + byCatByMonth[c][mi], 0)
  );
  const netByMonth = monthLabels.map((_, mi) => incomeByMonth[mi] - totalsByMonth[mi]);
  for (let mi = 0; mi < nMonths; mi++) { openingByMonth[mi] = mi === 0 ? startingBal : closingByMonth[mi - 1]; closingByMonth[mi] = openingByMonth[mi] + netByMonth[mi]; }

  return (
    <div className="page stage-fade">
      <div className="blob blob1" /><div className="blob blob2" /><div className="blob blob3" />
      <div className="glass-card breakdown-screen-card">
        <div className="brand-row"><div className="brand-dot" /><span className="brand-name">{APP_NAME}</span></div>
        <h1 className="title">{monthLabels.length === 1 ? "Your spending" : "Your spending, last " + monthLabels.length + " months"}</h1>
        <p className="subtitle">{hasReal ? "Built from your uploaded statements." : "Simulated from your uploaded statements."}</p>

        <div className="table-wrap">
          <table className="month-table">
            <thead>
              <tr>
                <th className="row-label-head">Category</th>
                {monthLabels.map((m) => <th key={m}>{m}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr className="opening-row">
                <td className="row-label">Opening balance</td>
                {openingByMonth.map((v, i) => <td key={i}>{formatMoney(v)}</td>)}
              </tr>
              {categories.map((c) => (
                <tr key={c}>
                  <td className="row-label">
                    <span className="cat-dot" style={{ background: catColor(c) }} />
                    {displayCat(c)}
                  </td>
                  {byCatByMonth[c].map((v, i) => <td key={i}>{formatMoney(v)}</td>)}
                </tr>
              ))}
              <tr className="totals-row">
                <td className="row-label">Total spent</td>
                {totalsByMonth.map((v, i) => <td key={i}>{formatMoney(v)}</td>)}
              </tr>
              <tr className="income-row">
                <td className="row-label">Income</td>
                {incomeByMonth.map((v, i) => <td key={i}>{formatMoney(v)}</td>)}
              </tr>
              <tr className="net-row">
                <td className="row-label">Net inflow / outflow</td>
                {netByMonth.map((v, i) => (
                  <td key={i} className={v >= 0 ? "net-positive" : "net-negative"}>
                    {v >= 0 ? "+" : ""}{formatMoney(v)}
                  </td>
                ))}
              </tr>
              <tr className="closing-row">
                <td className="row-label">Closing balance</td>
                {closingByMonth.map((v, i) => <td key={i}>{formatMoney(v)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="nav-row">
          {onBack && <button className="glass-btn ghost" onClick={onBack}>Back</button>}
          <button className="glass-btn primary" onClick={onDone}>Take me to my dashboard</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Target setting ---------------- */

function TargetSettingScreen({ onDone, pushToast, userId, transactions, onBack, banks, accountData, isEdit, overlay }) {
  const wrapCls = overlay ? "modal-overlay" : "page stage-fade";
  const categories = TX_CATEGORIES;
  const avg = React.useMemo(() => avgSpendByCategory(transactions), [transactions]);
  const typInc = React.useMemo(() => Math.round(typicalIncome(transactions, null)) || 0, [transactions]);
  const balEst = React.useMemo(() => {
    /* Balance at the START of the current month. Built the SAME way as the
       "last 3 months" summary screen (opening balances + net over the same
       trailing window), so the number here always reconciles with what the
       customer just saw — then back out the current month's net to land on
       the opening. Using the per-bank estimate here diverged from the summary
       whenever a bank had no starting balance or a mismatched tag. */
    const bankRows = (accountData && accountData.bankRows) || [];
    const startingBal = bankRows.reduce((s, r) => s + convStartingBal(r), 0);
    const hasTx = transactions && transactions.length > 0;
    const hasStart = bankRows.some((r) => r.starting_balance !== null && r.starting_balance !== undefined && r.starting_balance !== "");
    if (!hasTx && !hasStart) return null;
    const keys = hasTx ? lastNMonthKeys(latestMonthKey(transactions), 3) : [];
    const netWindow = keys.reduce((s, k) => s + (incomeForMonth(transactions, k) - spendForMonth(transactions, k)), 0);
    const runningNow = startingBal + netWindow;
    const ck = currentMonthKey();
    const curNet = incomeForMonth(transactions || [], ck) - spendForMonth(transactions || [], ck);
    return Math.round(runningNow - curNet);
  }, [banks, accountData, transactions]);
  const curKey = currentMonthKey();

  const [step, setStep] = useState("method");
  const [method, setMethod] = useState(null);
  const [curBal, setCurBal] = useState(balEst != null ? String(balEst) : "");
  const [goalBalance, setGoalBalance] = useState("");
  const [goalMonth, setGoalMonth] = useState(addMonths(curKey, 5));
  const [saveAmount, setSaveAmount] = useState("");
  const [saveMonths, setSaveMonths] = useState(6);
  const [months, setMonths] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const monthChoices = React.useMemo(() => { const out = []; for (let i = 2; i <= 23; i++) out.push(addMonths(curKey, i)); return out; }, [curKey]);
  const toMonthList = (keys) => keys.map((k) => ({ key: k, label: monthLabelFromKey(k) + " " + k.slice(0, 4), current: k === curKey }));

  const startGrid = (keys, seed) => { setMonths(toMonthList(keys)); setBudgets(seed); setStep("grid"); };
  const chooseMethod = (m) => {
    setMethod(m);
    if (m === "manual") {
      const keys = monthKeysBetween(curKey, addMonths(curKey, 6));
      const seed = {}; keys.forEach((k) => { seed[k] = { ...avg, Income: typInc }; });
      startGrid(keys, seed);
    } else setStep("goal");
  };
  const buildFromGoal = () => {
    const bal = Number(curBal) || 0;
    let keys, targetSave;
    if (method === "balance") {
      keys = monthKeysBetween(curKey, goalMonth);
      targetSave = Math.round((Number(goalBalance) || 0) - bal);
    } else {
      keys = monthKeysBetween(curKey, addMonths(curKey, Math.max(1, Number(saveMonths) || 6) - 1));
      targetSave = Math.round(Number(saveAmount) || 0);
    }
    /* Spread the target so the SUM is exact — individual months may differ by £1, final total lands on the goal. */
    const n = keys.length || 1;
    const base = Math.trunc(targetSave / n);
    let rem = targetSave - base * n;
    const step = rem >= 0 ? 1 : -1;
    rem = Math.abs(rem);
    const saves = keys.map((_, i) => base + (i < rem ? step : 0));
    startGrid(keys, buildProportionalPlan(transactions, keys, saves, typInc || undefined));
  };

  const monthNet = (k) => (Number(budgets[k] && budgets[k].Income) || 0) - categories.reduce((s, c) => s + (Number(budgets[k][c]) || 0), 0);
  const totalSave = months.reduce((s, m) => s + monthNet(m.key), 0);
  const projectedEnd = (Number(curBal) || 0) + totalSave;
  const lastKey = months.length ? months[months.length - 1].key : goalMonth;
  const monthTotal = (k) => categories.reduce((s, c) => s + (Number(budgets[k][c]) || 0), 0);
  const applyToAll = () => {
    const first = budgets[months[0].key];
    setBudgets((prev) => Object.fromEntries(months.map((m) => [m.key, { ...first }])));
    pushToast("First month applied to all months", "success");
  };

  const balanceMonths = method === "balance" ? monthKeysBetween(curKey, goalMonth).length : 0;
  const balancePerMonth = balanceMonths ? Math.round(((Number(goalBalance) || 0) - (Number(curBal) || 0)) / balanceMonths) : 0;
  const savingsPerMonth = Math.round((Number(saveAmount) || 0) / Math.max(1, Number(saveMonths) || 6));
  const savingsEndKey = addMonths(curKey, Math.max(1, Number(saveMonths) || 6) - 1);
  const goalReady = method === "balance" ? (Number(goalBalance) > 0) : (Number(saveAmount) > 0);

  const handleFinish = async () => {
    setSubmitting(true);
    // The user's stated goal is the anchor. For a balance goal, save the exact figure
    // they entered — NOT projectedEnd, which re-sums the ±£1-spread monthly budgets and
    // can drift a few pounds (e.g. £15,000 entered showing as £14,994).
    const enteredGoal = method === "balance" ? Math.round(Number(goalBalance) || 0) : 0;
    const targetBalanceToSave = enteredGoal > 0 ? enteredGoal : Math.round(projectedEnd);
    const plan = { targetBalance: targetBalanceToSave, targetMonth: lastKey, method: method || "manual", openingBalance: Number(curBal) || 0 };
    try {
      const keys = months.map((m) => m.key);
      await supabaseClient.from("targets").delete().eq("user_id", userId).in("month", keys);
      const rows = [];
      keys.forEach((k) => {
        categories.forEach((c) => rows.push({ user_id: userId, category: c, month: k, monthly_target: Number(budgets[k][c]) || 0 }));
        rows.push({ user_id: userId, category: "Income", month: k, monthly_target: Number(budgets[k].Income) || 0 });
      });
      const { error } = await supabaseClient.from("targets").insert(rows);
      if (error) throw error;
      pushToast("Plan saved", "success");
    } catch (e) {
      pushToast("Couldn't save your plan — make sure your targets table has a 'month' column", "error");
    }
    try { await savePlanToDb(userId, plan); } catch (e) {}
    setSubmitting(false);
    onDone(budgets[curKey] || budgets[months[0].key] || {}, plan);
  };

  if (step === "method") return (
    <div className={wrapCls}>
      <div className="blob blob1" /><div className="blob blob2" /><div className="blob blob3" />
      <div className="glass-card size-md">
        <div className="brand-row"><div className="brand-dot" /><span className="brand-name">{APP_NAME}</span></div>
        <h1 className="title">{isEdit ? "Update your plan" : "Set your plan"}</h1>
        <p className="subtitle">Pick the way that feels most natural — whichever you choose, we turn it into a simple monthly plan you can tweak.</p>
        <div className="pw-methods">
          <button className="pw-method" onClick={() => chooseMethod("balance")}>
            <span className="pw-method-title">I have a balance in mind</span>
            <span className="pw-method-sub">"I want my balance to be X by a certain month" — we work out the monthly plan for you.</span>
          </button>
          <button className="pw-method" onClick={() => chooseMethod("savings")}>
            <span className="pw-method-title">I have a savings amount in mind</span>
            <span className="pw-method-sub">"I want to save X over the next few months" — we spread it out and tell you where you land.</span>
          </button>
          <button className="pw-method" onClick={() => chooseMethod("manual")}>
            <span className="pw-method-title">I will set my own budgets</span>
            <span className="pw-method-sub">Set a monthly amount per category yourself — we tell you what that adds up to.</span>
          </button>
        </div>
        <div className="nav-row">
          {onBack && <button className="glass-btn ghost" onClick={onBack}>Back</button>}
        </div>
      </div>
    </div>
  );

  if (step === "goal") return (
    <div className={wrapCls}>
      <div className="blob blob1" /><div className="blob blob2" /><div className="blob blob3" />
      <div className="glass-card size-md">
        <div className="brand-row"><div className="brand-dot" /><span className="brand-name">{APP_NAME}</span></div>
        <h1 className="title">{method === "balance" ? "Where do you want to be?" : "How much do you want to save?"}</h1>
        <p className="subtitle">Amounts are in your home currency, across all your accounts.</p>
        <div className="field-group">
          <label className="field-label">Your balance at the start of {currentMonthName()} {balEst != null ? "(estimated from your statements)" : ""}</label>
          <input className="glass-input" type="text" inputMode="decimal" placeholder={"e.g. " + (CURRENCY_SYMBOLS[FX.home] || "£") + "9,000"} value={curBal === "" ? "" : (CURRENCY_SYMBOLS[FX.home] || "£") + fmtBalInput(curBal)} onChange={(e) => setCurBal(e.target.value.replace(/[^0-9.]/g, ""))} />
        </div>
        {method === "balance" && (
          <>
            <div className="field-group">
              <label className="field-label">Balance you want to reach</label>
              <input className="glass-input" type="text" inputMode="decimal" placeholder={"e.g. " + (CURRENCY_SYMBOLS[FX.home] || "£") + "15,000"} value={goalBalance === "" ? "" : (CURRENCY_SYMBOLS[FX.home] || "£") + fmtBalInput(goalBalance)} onChange={(e) => setGoalBalance(e.target.value.replace(/[^0-9.]/g, ""))} />
            </div>
            <div className="field-group">
              <label className="field-label">By the end of</label>
              <select className="glass-input" value={goalMonth} onChange={(e) => setGoalMonth(e.target.value)}>
                {monthChoices.map((k) => <option key={k} value={k}>{monthLabelFromKey(k) + " " + k.slice(0, 4)}</option>)}
              </select>
            </div>
            {goalReady && <p className="pw-goal-line">That means saving about <b>{formatMoney(balancePerMonth)}/month</b> for {balanceMonths} months. Next, we will split that into category budgets based on how you actually spend.</p>}
          </>
        )}
        {method === "savings" && (
          <>
            <div className="field-group">
              <label className="field-label">Amount to save</label>
              <input className="glass-input" type="text" inputMode="decimal" placeholder={"e.g. " + (CURRENCY_SYMBOLS[FX.home] || "£") + "6,000"} value={saveAmount === "" ? "" : (CURRENCY_SYMBOLS[FX.home] || "£") + fmtBalInput(saveAmount)} onChange={(e) => setSaveAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
            </div>
            <div className="field-group">
              <label className="field-label">Over the next</label>
              <select className="glass-input" value={saveMonths} onChange={(e) => setSaveMonths(Number(e.target.value))}>
                {[3, 6, 9, 12, 18, 24].map((n) => <option key={n} value={n}>{n} months</option>)}
              </select>
            </div>
            {goalReady && <p className="pw-goal-line">That is about <b>{formatMoney(savingsPerMonth)}/month</b>{Number(curBal) ? <> — you would reach <b>{formatMoney((Number(curBal) || 0) + (Number(saveAmount) || 0))}</b> by the end of {monthLabelFromKey(savingsEndKey)} {savingsEndKey.slice(0, 4)}</> : null}. Next, we will split that into category budgets based on how you actually spend.</p>}
          </>
        )}
        <div className="nav-row">
          <button className="glass-btn ghost" onClick={() => setStep("method")}>Back</button>
          <button className="glass-btn primary" disabled={!goalReady} onClick={buildFromGoal}>Build my plan</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={wrapCls}>
      <div className="blob blob1" /><div className="blob blob2" /><div className="blob blob3" />
      <div className="glass-card target-card">
        <div className="brand-row"><div className="brand-dot" /><span className="brand-name">{APP_NAME}</span></div>
        <h1 className="title">{method === "manual" ? "Set your budgets" : "Here is your plan — adjust anything"}</h1>
        <p className="subtitle">{method === "manual" ? "Pre-filled from your recent averages. Adjust any cell — categories down the side, months across the top." : "Built from your goal, split across categories in proportion to your last few months of spending. Change any cell — your goal updates with it, so the numbers always agree."}</p>

        <div className="budget-table-wrap">
          <table className="budget-table">
            <thead>
              <tr>
                <th className="bt-corner">Category</th>
                {months.map((m) => (
                  <th key={m.key} className={"bt-month-head " + (m.current ? "bt-month-current" : "")}>
                    {monthLabelFromKey(m.key)}{m.current ? " •" : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="bt-income-row">
                <td className="bt-cat"><span className="cat-dot" style={{ background: catColor("Income") }} />Income</td>
                {months.map((m) => (
                  <td key={m.key} className="bt-cell">
                    <span className="bt-input-wrap"><span className="bt-cur">{homeSym()}</span>
                      <input className="bt-input" type="text" inputMode="numeric" value={fmtBalInput(budgets[m.key].Income)}
                        onChange={(e) => setBudgets((prev) => ({ ...prev, [m.key]: { ...prev[m.key], Income: e.target.value.replace(/[^0-9.]/g, "") } }))} />
                    </span>
                  </td>
                ))}
              </tr>
              {categories.map((c) => (
                <tr key={c}>
                  <td className="bt-cat"><span className="cat-dot" style={{ background: CATEGORY_COLORS[c] }} />{c}</td>
                  {months.map((m) => (
                    <td key={m.key} className="bt-cell">
                      <span className="bt-input-wrap"><span className="bt-cur">{homeSym()}</span>
                        <input className="bt-input" type="text" inputMode="numeric" value={fmtBalInput(budgets[m.key][c])}
                          onChange={(e) => setBudgets((prev) => ({ ...prev, [m.key]: { ...prev[m.key], [c]: e.target.value.replace(/[^0-9.]/g, "") } }))} />
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bt-total-row">
                <td className="bt-cat">Total spend</td>
                {months.map((m) => <td key={m.key} className="bt-cell bt-total-cell"><span className="bt-total-disp"><span className="bt-total-num">{formatMoney(monthTotal(m.key))}</span></span></td>)}
              </tr>
              <tr className="bt-total-row">
                <td className="bt-cat">Saved</td>
                {months.map((m) => <td key={m.key} className={"bt-cell bt-total-cell " + (monthNet(m.key) >= 0 ? "bt-net-pos" : "bt-net-neg")}><span className="bt-total-disp"><span className="bt-total-num">{formatMoney(monthNet(m.key))}</span></span></td>)}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pw-summary">At these targets you will save about <b>{formatMoney(totalSave)}</b> over {months.length} months — that is <b>{formatMoney(projectedEnd)}</b> by the end of {monthLabelFromKey(lastKey)} {lastKey.slice(0, 4)}. This becomes your goal, and every number in the app ties back to this plan.</div>

        <button className="link-btn inline apply-all-btn" onClick={applyToAll}>Apply the first month to all months</button>

        <div className="nav-row">
          <button className="glass-btn ghost" disabled={submitting} onClick={() => setStep(method === "manual" ? "method" : "goal")}>Back</button>
          <button className="glass-btn primary" disabled={submitting} onClick={handleFinish}>
            {submitting ? <span className="btn-spinner" /> : (isEdit ? "Save my plan" : "Finish setup")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- In-app overview setup (post-CWJ) ---------------- */

/* ---------------- Persona engine ---------------- */

function scorePersona({ savvy, tracking, balanceCheck, goals }) {
  let lit = 0;
  if (savvy === "intermediate") lit += 1; else if (savvy === "confident") lit += 2;
  if (tracking === "sometimes") lit += 1; else if (tracking === "yes") lit += 2;
  if (balanceCheck === "weekly") lit += 1; else if (balanceCheck === "daily") lit += 2;
  const literacy = lit <= 2 ? "beginner" : (lit <= 4 ? "comfortable" : "pro");
  const g = goals || [];
  let focus = "organiser";
  if (g.includes("Save more each month") || g.includes("Plan for a big purchase")) focus = "saver";
  else if (g.includes("Pay off debt")) focus = "debt";
  else if (g.includes("Track my spending") || g.includes("Just stay organised")) focus = "budgeter";
  else if (g.includes("Build an investment portfolio") || g.includes("Grow my business")) focus = "optimiser";
  if (literacy === "beginner") return "fresh_start";
  if (focus === "saver" || focus === "debt") return "goal_getter";
  if (literacy === "pro" && focus === "optimiser") return "power_view";
  return "budget_hawk";
}

const PERSONA_TEMPLATES = {
  fresh_start: {
    name: "Fresh Start",
    blurb: "A clear, visual view — what you can spend, how each budget is doing, and what's coming up.",
    layout: { month: ["breakdown_mini", "bills_checklist"], big: ["goal_ring", "net_worth"] },
  },
  goal_getter: {
    name: "Goal Getter",
    blurb: "Everything points at your goal — what this month adds, your pace, and the projected finish date.",
    layout: { month: ["money_flow", "savings_rate", "breakdown_wide"], big: ["goal_ring", "contribution_bars", "net_worth"] },
  },
  budget_hawk: {
    name: "Budget Hawk",
    blurb: "Full control — the worked maths behind every number, pacing deltas, and what's about to leave your account.",
    layout: { month: ["category_vs_target", "spend_by_week", "pace_outlook"], big: ["month_end_projection", "net_worth"] },
  },
  power_view: {
    name: "Power View",
    blurb: "Maximum signal — deltas vs your averages, merchant concentration, long trends and the multi-currency picture.",
    layout: { month: ["breakdown_mini", "merchants_pro", "biggest_movers", "net_saved"], big: ["net_worth", "goal_ring"] },
  },
};

function BuildingDashboardScreen({ personaKey, onDone, overlay }) {
  const t = PERSONA_TEMPLATES[personaKey] || PERSONA_TEMPLATES.budget_hawk;
  const [phase, setPhase] = useState(0);
  React.useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1400);
    const t2 = setTimeout(() => setPhase(2), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div className={overlay ? "modal-overlay" : "page stage-fade"}>
      <div className="blob blob1" /><div className="blob blob2" /><div className="blob blob3" />
      <div className="glass-card size-md" style={{ minHeight: 0, textAlign: "center" }}>
        {phase < 2 ? (
          <>
            <div className="bdg-spinner"><span className="btn-spinner" style={{ width: 26, height: 26 }} /></div>
            <h1 className="title" style={{ marginTop: 18 }}>{phase === 0 ? "Reading your answers\u2026" : "Building your dashboard\u2026"}</h1>
            <p className="subtitle">Shaping your overview around your goals.</p>
          </>
        ) : (
          <>
            <div className="bdg-badge"><Icon name="sliders" size={15} /> {t.name}</div>
            <h1 className="title" style={{ marginTop: 14 }}>We've set you up with the {t.name} view</h1>
            <p className="subtitle">{t.blurb}</p>
            <p className="subtitle" style={{ fontSize: 13, opacity: 0.85 }}>Don't worry {"—"} you can change any widget later with "Edit view" on your overview.</p>
            <div className="nav-row" style={{ marginTop: 18 }}>
              <button className="glass-btn primary" onClick={onDone}>Show me around</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SetupIntroModal({ name, onStart, onSkip }) {
  return (
    <div className="modal-overlay setup-intro-overlay">
      <div className="glass-card modal-card" style={{ maxWidth: 480 }}>
        <h1 className="title" style={{ marginTop: 4, marginBottom: 12 }}>Hi {name || "there"}, welcome to {APP_NAME}</h1>
        <p className="subtitle" style={{ marginBottom: 12, lineHeight: 1.5 }}>This is your overview {"—"} here's a first look behind this card.</p>
        <p className="subtitle" style={{ marginBottom: 0, lineHeight: 1.5 }}>Let's take 3 minutes to shape it around your financial goals: a few quick questions, then your monthly targets.</p>
        <div className="nav-row" style={{ marginTop: 24 }}>
          <button className="glass-btn ghost" onClick={onSkip}>I'll fill this in later</button>
          <button className="glass-btn primary" onClick={onStart}>Let's go</button>
        </div>
      </div>
    </div>
  );
}

const SETUP_STEPS = 4;
function SetupQuestionsScreen({ userId, pushToast, onDone, onBack }) {
  const [step, setStep] = useState(0);
  const [savvy, setSavvy] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [balanceCheck, setBalanceCheck] = useState(null);
  const [goals, setGoals] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const toggleGoal = (g) => setGoals((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  const canContinue = [savvy !== null, tracking !== null, balanceCheck !== null, goals.length > 0][step];
  const next = async () => {
    if (step === SETUP_STEPS - 1) {
      setSubmitting(true);
      try {
        const { error } = await supabaseClient.from("profiles").upsert({
          id: userId, savvy, tracking, balance_check: balanceCheck, fin_goals: goals, setup_completed: true,
        });
        if (error) throw error;
      } catch (e) { pushToast("Couldn't save your answers — " + (e.message || e), "error"); setSubmitting(false); return; }
      setSubmitting(false);
      onDone({ savvy, tracking, balanceCheck, goals });
    } else setStep((s) => s + 1);
  };
  return (
    <div className="modal-overlay setup-intro-overlay">
      <div className="glass-card onboard-card" style={{ maxWidth: 520, minHeight: 0 }}>
        <div className="progress-row">
          {Array.from({ length: SETUP_STEPS }).map((_, i) => (
            <span key={i} className={"progress-dot " + (i <= step ? "progress-dot-on" : "")} />
          ))}
        </div>
        {step === 0 && (
          <div className="step">
            <h1 className="title">How smart are you with your finances?</h1>
            <div className="segmented">
              {SAVVY_OPTIONS.map((opt) => (
                <button key={opt.key} className={"segment " + (savvy === opt.key ? "segment-active" : "")} onClick={() => setSavvy(opt.key)}>
                  <span>{opt.label}</span>
                  {savvy === opt.key && <span className="check-badge"><Icon name="check" size={11} strokeWidth={3.2} /></span>}
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="step">
            <h1 className="title">Do you currently track your spending?</h1>
            <div className="segmented">
              {TRACKING_OPTIONS.map((opt) => (
                <button key={opt.key} className={"segment " + (tracking === opt.key ? "segment-active" : "")} onClick={() => setTracking(opt.key)}>
                  <span>{opt.label}</span>
                  {tracking === opt.key && <span className="check-badge"><Icon name="check" size={11} strokeWidth={3.2} /></span>}
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="step">
            <h1 className="title">How often do you check your bank balance?</h1>
            <div className="segmented">
              {BALANCE_OPTIONS.map((opt) => (
                <button key={opt.key} className={"segment " + (balanceCheck === opt.key ? "segment-active" : "")} onClick={() => setBalanceCheck(opt.key)}>
                  <span>{opt.label}</span>
                  {balanceCheck === opt.key && <span className="check-badge"><Icon name="check" size={11} strokeWidth={3.2} /></span>}
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="step">
            <h1 className="title">What do you want to achieve?</h1>
            <p className="subtitle">Pick as many as apply.</p>
            <div className="goal-wrap">
              {GOALS.map((g) => (
                <button key={g} className={"chip goal-chip " + (goals.includes(g) ? "chip-selected" : "")} onClick={() => toggleGoal(g)}>
                  <span>{g}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="nav-row">
          <button className="glass-btn ghost" disabled={submitting} onClick={() => (step === 0 ? onBack() : setStep((s) => s - 1))}>Back</button>
          <button className="glass-btn primary" disabled={!canContinue || submitting} onClick={next}>
            {submitting ? <span className="btn-spinner" /> : step === SETUP_STEPS - 1 ? "Continue to targets" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Extra questions (post-signup) ---------------- */

const SALARY_RANGES = ["Under £50k", "£50k–£100k", "£100k–£200k", "£200k+", "Prefer not to say"];
const EMPLOYMENT_TYPES = ["Employed", "Self-employed", "Business owner", "Student", "Other"];

function ExtraQuestionsScreen({ onDone, onSkip, pushToast, userId }) {
  const [occupation, setOccupation] = useState("");
  const [salary, setSalary] = useState(null);
  const [employment, setEmployment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await supabaseClient.from("profiles").upsert({
        id: userId, occupation, salary_range: salary, employment_type: employment,
      });
      pushToast("Saved", "success");
    } catch (e) {
      pushToast("Couldn't save", "error");
    }
    setSubmitting(false);
    onDone({ occupation, salary, employment });
  };

  return (
    <div className="page stage-fade">
      <div className="blob blob1" /><div className="blob blob2" /><div className="blob blob3" />
      <div className="glass-card size-md">
        <h1 className="title">A few more details</h1>
        <p className="subtitle">Optional — helps us personalize things further. Skip anytime.</p>

        <div className="field-group">
          <label className="field-label">Occupation</label>
          <input className="glass-input" type="text" placeholder="e.g. Marketing Manager" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
        </div>

        <div className="field-group">
          <label className="field-label">Salary range</label>
          <div className="segmented" style={{ marginTop: 4 }}>
            {SALARY_RANGES.map((s) => (
              <button key={s} className={"segment " + (salary === s ? "segment-active" : "")} onClick={() => setSalary(s)}>
                <span>{s}</span>
                {salary === s && <span className="check-badge"><Icon name="check" size={11} strokeWidth={3.2} /></span>}
              </button>
            ))}
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">Employment type</label>
          <div className="segmented" style={{ marginTop: 4 }}>
            {EMPLOYMENT_TYPES.map((e) => (
              <button key={e} className={"segment " + (employment === e ? "segment-active" : "")} onClick={() => setEmployment(e)}>
                <span>{e}</span>
                {employment === e && <span className="check-badge"><Icon name="check" size={11} strokeWidth={3.2} /></span>}
              </button>
            ))}
          </div>
        </div>

        <div className="nav-row">
          <button className="glass-btn ghost" disabled={submitting} onClick={() => { pushToast("Skipped", "info"); onSkip(); }}>Skip</button>
          <button className="glass-btn primary" disabled={submitting} onClick={handleSave}>
            {submitting ? <span className="btn-spinner" /> : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}


/* ---------------- Dashboard ---------------- */

