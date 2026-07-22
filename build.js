/* TwoPockets build step.
   The app source lives in src/*.jsx (compiled as ONE unit so function hoisting
   and shared top-level scope behave exactly like the old single inline block).
   index.html is the page shell. Build: concat src in ORDER, compile with Babel,
   write dist/app.js + dist/index.html, copy the asset allowlist.
   Transitional: if index.html still contains an inline babel block, it is
   replaced with the app.js script tag (kept so mid-migration deploys work). */
const fs = require("fs");
const path = require("path");
const babel = require("@babel/core");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

/* Source modules — ORDER MATTERS. They are concatenated byte-for-byte and
   compiled as a single script, exactly like the original inline block. */
const SRC = [
  "src/00-core-helpers.jsx",
  "src/10-fx-engine-parsers.jsx",
  "src/20-entry-screens.jsx",
  "src/30-dashboard-cards.jsx",
  "src/40-overview.jsx",
  "src/50-shell-app.jsx",
];

let source = "";
for (const f of SRC) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) { console.error("BUILD FAILED: missing source " + f); process.exit(1); }
  source += fs.readFileSync(p, "utf8");
}

const { code } = babel.transformSync(source, {
  presets: [[require("@babel/preset-react"), { runtime: "classic" }]],
  compact: false,
  comments: false,
  sourceType: "script",
  filename: "app.jsx",
});

let out = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const RE = /<script type="text\/babel"[^>]*>[\s\S]*?<\/script>/;
if (RE.test(out)) {
  out = out.replace(RE, '<script defer src="/app.js"></script>');
}
out = out.replace(/<script defer src="[^"]*babel-standalone[^"]*"><\/script>\s*/g, "");

if (out.includes("babel-standalone")) {
  console.error("BUILD FAILED: babel-standalone still referenced");
  process.exit(1);
}
if (!out.includes('src="/app.js"')) {
  console.error("BUILD FAILED: app.js not wired in");
  process.exit(1);
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
const BUILD_ID = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
if (!out.includes("__BUILD_ID__")) { console.error("BUILD FAILED: __BUILD_ID__ placeholder missing in index.html"); process.exit(1); }
out = out.replace("__BUILD_ID__", BUILD_ID);
fs.writeFileSync(path.join(DIST, "index.html"), out);
fs.writeFileSync(path.join(DIST, "version.json"), JSON.stringify({ v: BUILD_ID }));
fs.writeFileSync(path.join(DIST, "app.js"), code);

const ASSETS = ["styles.css", "manifest.webmanifest", "sw.js", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "og-image.png"];
for (const f of ASSETS) {
  const src = path.join(ROOT, f);
  if (!fs.existsSync(src)) { console.error("BUILD FAILED: missing asset " + f); process.exit(1); }
  fs.copyFileSync(src, path.join(DIST, f));
}

const kb = (n) => (n / 1024).toFixed(0) + "kb";
console.log("BUILD OK");
console.log("  dist/index.html " + kb(out.length));
console.log("  dist/app.js     " + kb(code.length));
