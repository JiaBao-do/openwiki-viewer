// Builds a single self-contained HTML page (no network needed) for browsing generated
// OpenWiki pages.
//
//   node build.js [root] [--open] [--out <file>]
//
// root   Folder to look in (default: current directory). Wikis are found in:
//          1. root itself, if it has an openwiki/ folder;
//          2. root's direct child folders that have an openwiki/ folder;
//        and, if neither exists, the same check on up to 3 parent folders.
// --open Open the result in the default browser.
// --out  Output file (default: <this folder>/out/<root-name>-<hash>.html, one per root,
//        so different projects never overwrite each other).
//
// Also usable as a module: require("./build.js").build(root, outFile) -> { outFile, repos, pages }.
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");

const SKIP = new Set(["node_modules", ".git", ".idea", ".vscode", "target", "dist", "build"]);

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith(".md")) out.push(p);
  }
  return out;
}

const hasWiki = (dir) => {
  try {
    return fs.statSync(path.join(dir, "openwiki")).isDirectory();
  } catch {
    return false;
  }
};

const MAX_DEPTH = 4; // how many folder levels below root to search
const MAX_DIRS = 5000; // safety cap on folders visited

// Repos (folders containing openwiki/): `dir` itself, else anything up to MAX_DEPTH levels
// below it (breadth-first). A repo's own subfolders are not searched.
function scan(dir) {
  if (hasWiki(dir)) return [dir];
  const found = [];
  let level = [dir];
  let visited = 0;
  for (let depth = 0; depth < MAX_DEPTH && level.length; depth++) {
    const next = [];
    for (const d of level) {
      let entries = [];
      try {
        entries = fs.readdirSync(d, { withFileTypes: true });
      } catch {
        continue; // unreadable folder
      }
      for (const e of entries) {
        if (!e.isDirectory() || e.name.startsWith(".") || SKIP.has(e.name)) continue;
        if (++visited > MAX_DIRS) return found;
        const p = path.join(d, e.name);
        if (hasWiki(p)) found.push(p);
        else next.push(p);
      }
    }
    level = next;
  }
  return found;
}

// Search below root first; if nothing is there, look in up to 3 parent folders
// (so running from inside a repo's subfolder still finds that repo's wiki).
function discover(root) {
  let dir = root;
  for (let i = 0; i < 4; i++) {
    const found = scan(dir);
    if (found.length) return found;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return [];
}

// One stable file per set of wikis, regardless of which subfolder the build started from.
function defaultOut(repoDirs, root) {
  const slug = (repoDirs.length === 1 ? path.basename(repoDirs[0]) : path.basename(root))
    .replace(/[^\w.-]+/g, "_") || "wiki";
  const hash = crypto.createHash("sha1").update(repoDirs.join("|")).digest("hex").slice(0, 6);
  return path.join(__dirname, "out", `${slug}-${hash}.html`);
}

function build(rootArg, outArg) {
  const root = path.resolve(rootArg || process.cwd());
  const repoDirs = discover(root);
  if (!repoDirs.length) return { root, outFile: null, repos: [], pages: 0 };
  const outFile = path.resolve(outArg || defaultOut(repoDirs, root));
  const repos = repoDirs.map((repoDir) => {
    const wikiDir = path.join(repoDir, "openwiki");
    const pages = walk(wikiDir).map((f) => ({
      path: path.relative(wikiDir, f).split(path.sep).join("/"),
      md: fs.readFileSync(f, "utf8"),
    }));
    return { dir: repoDir, name: path.basename(repoDir), pages };
  }).filter((r) => r.pages.length);
  // Same folder name in two places (e.g. two "api" repos): disambiguate with the path under root.
  const seen = new Map();
  for (const r of repos) seen.set(r.name, (seen.get(r.name) || 0) + 1);
  for (const r of repos) {
    if (seen.get(r.name) > 1) r.name = path.relative(root, r.dir).split(path.sep).join("/") || r.name;
    delete r.dir;
  }

  const data = JSON.stringify({ built: new Date().toISOString(), repos }).replace(/</g, "\\u003c");
  const template = fs.readFileSync(path.join(__dirname, "template.html"), "utf8");
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, template.replace("__WIKI_DATA__", () => data));
  return { root, outFile, repos: repos.map((r) => r.name), pages: repos.reduce((a, r) => a + r.pages.length, 0) };
}

function openInBrowser(file) {
  const [cmd, args] =
    process.platform === "win32" ? ["cmd", ["/c", "start", "", file]]
    : process.platform === "darwin" ? ["open", [file]]
    : ["xdg-open", [file]];
  spawn(cmd, args, { detached: true, stdio: "ignore" }).unref();
}

module.exports = { build, openInBrowser };

if (require.main === module) {
  const argv = process.argv.slice(2);
  let root, out, open = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--open") open = true;
    else if (argv[i] === "--out") out = argv[++i];
    else if (!root) root = argv[i];
  }
  const r = build(root, out);
  if (!r.repos.length) {
    console.error(`No openwiki/ folders found in or around ${r.root}. Generate a wiki first.`);
    process.exit(2);
  }
  console.log(`wrote ${r.outFile}: ${r.repos.length} repo(s) [${r.repos.join(", ")}], ${r.pages} pages`);
  if (open) openInBrowser(r.outFile);
}
