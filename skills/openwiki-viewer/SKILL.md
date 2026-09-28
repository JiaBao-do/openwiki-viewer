---
name: openwiki-viewer
description: Build and open a browsable HTML viewer for a project's generated OpenWiki pages (<repo>/openwiki/**/*.md). Works from any project or workspace folder. Use when the user asks to view, read, browse, open or start the wiki / OpenWiki viewer, or wants to refresh it after an OpenWiki init or update.
---

# OpenWiki viewer

Zero-dependency Node tool (plain `node` only; install nothing). It reads the generated `openwiki/` folders and writes one self-contained HTML page (all pages embedded, no network, works from `file://`). It is project-agnostic: run it against whatever folder you are working in.

Scripts live in `~/.claude/skills/openwiki-viewer/`:

- `build.js [root] [--open] [--out <file>]` — build the page. Prints the output path and what it found.
- `serve.js [root] [--port N]` — optional live server on `http://127.0.0.1:8899/` that rebuilds on each page load.

## How wikis are found

Starting at `root` (default: the current directory):

1. `root` itself has `openwiki/` → that single project is shown.
2. otherwise every folder up to **4 levels below** `root` that has `openwiki/` is shown as a separate repo (breadth-first; hidden folders, `node_modules`, `target`, `dist`, `build` are skipped; a repo's own subfolders are not searched; capped at 5000 folders).
3. if nothing is found below, the same search is repeated on up to 3 parent folders.

So from inside a repo (or one of its subfolders) you get that repo's wiki; from a parent or workspace folder — even the Desktop or a projects folder — you get every repo's wiki beneath it. Repos with the same folder name are labelled by their path under `root`. Only pass `root` when you want something other than the current directory.

## Output

By default each root gets its own file, `~/.claude/skills/openwiki-viewer/out/<root-name>-<hash>.html`, so different projects never overwrite each other. Use `--out <file>` to choose a location.

## How to use

1. Decide the root: the current project folder, or the workspace folder the user names.
2. Build and open:
   ```
   node ~/.claude/skills/openwiki-viewer/build.js "<root>" --open
   ```
   (omit `"<root>"` to use the current directory). In PowerShell use `$HOME` instead of `~`.
3. Report the output path and the repos/pages count it printed. If it exits with "No openwiki/ folders found", the wiki hasn't been generated yet — run the `openwiki` skill first, or pick another root.

## Notes

- The page is a **snapshot**: rebuild after every OpenWiki generation or update. An old page shows old content.
- Never hand-edit generated pages; edit `template.html` for viewer changes and rebuild.
- For live refresh instead of rebuilding, start `serve.js` in the background and give the user the URL (localhost only).
