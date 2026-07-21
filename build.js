/* MyBudgetPal build step.
   Reads index.html (the single source of truth), compiles the inline
   <script type="text/babel"> block ahead of time, and writes a dist/ folder
   containing an index.html that loads a plain app.js instead of shipping
   babel-standalone to every visitor. Source file is never modified. */
const fs = require("fs");
const path = require("path");
const babel = require("@babel/core");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

const RE = /<script type="text\/babel"[^>]*>([\s\S]*?)<\/script>/;
const m = html.match(RE);
if (!m) {
  console.error("BUILD FAILED: no <script type=\"text/babel\"> block found in index.html");
  process.exit(1);
}

const { code } = babel.transformSync(m[1], {
  presets: [[require("@babel/preset-react"), { runtime: "classic" }]],
  compact: false,
  comments: false,
  sourceType: "script",
  filename: "app.jsx",
});

// Swap the inline babel block for a normal deferred script.
let out = html.replace(RE, '<script defer src="/app.js"></script>');
// babel-standalone is now dead weight — drop it.
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
fs.writeFileSync(path.join(DIST, "index.html"), out);
fs.writeFileSync(path.join(DIST, "app.js"), code);

// Copy the static assets across untouched. Explicit allowlist so nothing
// unexpected in the working directory ever ends up published.
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
