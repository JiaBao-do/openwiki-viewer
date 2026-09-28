// Optional live server: rebuilds the viewer on every page load, so regenerated wiki
// pages show up after a browser refresh.
//
//   node serve.js [root] [--port 8899]
//
// root defaults to the current directory (see build.js for how wikis are discovered).
const http = require("http");
const fs = require("fs");
const { build } = require("./build.js");

const argv = process.argv.slice(2);
let root, port = 8899;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--port") port = Number(argv[++i]) || port;
  else if (/^\d+$/.test(argv[i]) && root) port = Number(argv[i]);
  else if (!root) root = argv[i];
}

http
  .createServer((req, res) => {
    const url = req.url.split("?")[0];
    if (url !== "/" && url !== "/index.html") {
      res.writeHead(404).end("not found");
      return;
    }
    try {
      const r = build(root);
      if (!r.outFile) {
        res.writeHead(404).end(`No openwiki/ folders found in or around ${r.root}`);
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      res.end(fs.readFileSync(r.outFile));
    } catch (e) {
      res.writeHead(500).end("build failed: " + e.message);
    }
  })
  .listen(port, "127.0.0.1", () => console.log(`openwiki viewer: http://127.0.0.1:${port}/`));
