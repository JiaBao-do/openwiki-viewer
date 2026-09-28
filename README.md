# openwiki-viewer

A Claude Code skill that builds a single self-contained HTML page for browsing generated
OpenWiki pages (`<repo>/openwiki/**/*.md`). No dependencies — only Node.js is required.

## Install

### Option A — copy the skill (simplest)

Copy the `skills/openwiki-viewer` folder into your personal skills folder:

- macOS / Linux: `~/.claude/skills/openwiki-viewer`
- Windows: `%USERPROFILE%\.claude\skills\openwiki-viewer`

Or, to share it with a whole project, copy it to `<project>/.claude/skills/openwiki-viewer`
and commit it. It loads in the next Claude Code session.

### Option B — as a plugin (after publishing this repo to GitHub)

```
/plugin marketplace add <github-user>/<repo>
/plugin install openwiki-viewer@openwiki-viewer-marketplace
```

(Edit `owner.name` in `.claude-plugin/marketplace.json` first.)

## Use

Ask Claude to "open the OpenWiki viewer", or run it yourself from any project or workspace folder:

```
node <path-to>/skills/openwiki-viewer/build.js --open
node <path-to>/skills/openwiki-viewer/build.js "<folder>" --open
```

PowerShell: use `$HOME` instead of `~` (e.g. `node "$HOME\.claude\skills\openwiki-viewer\build.js" --open`).

It searches the given folder (default: current directory) for `openwiki/` folders — the folder itself,
up to 4 levels below it, then up to 3 parents — and writes one HTML file per project under the
skill's `out/` folder. See `skills/openwiki-viewer/SKILL.md` for details.
