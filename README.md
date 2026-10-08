# Jay OS

**INTERNAL.** Live URL: <https://javokhirkomiljanov.github.io/jay-dashboard/>

Jay's operating system for **W2W only** (IT outsourcing → AI agents → Company Brain). Everything about
Home Alliance / Venture Studios / US work lives behind the single **Archive** link (`archive.html`).

Protected by AES-256 client-side encryption (`staticrypt`, PBKDF2 600k iterations). The encrypted blobs are what
is served publicly; without the passphrase nothing can be decrypted in-browser. The passphrase is **not stored
in this repo** — it is shared person-to-person. All pages share one salt, so "Remember me" on `index.html`
unlocks the others.

## Pages
| Page | What | Source |
|---|---|---|
| `index.html` | Jay OS v7: Сегодня · Стратегия · Советники · Company Brain · W2W · Agents House | `src/jos.tpl.html` + `data/jos/*.json` + `../w2w-strategy/strategy/strategy.json` → `scripts/build_jos.py` |
| `w2w-strategy.html` | Full W2W strategy Q4 2026 – Q4 2027 (12 sections, 3 scenarios, 119 assumptions) | built on the server in `w2w-strategy/site/` |
| `w2w-map.html` | Company map (org, ownership, roles, KPIs, partner program) | `w2w-map.plaintext.html` |
| `archive.html` | The whole previous JOS (v6, 20 tabs): HA, VS, Apollo/US, reports, ROI backlog, IT capacity… | former `index.plaintext.html` |
| `strategy.html`, `pm.html`, `it-architecture.html` | older standalone pages (HA era), linked from the archive | — |

## Architecture
- **Build:** `python scripts/build_jos.py` → `index.plaintext.html` (gitignored). Data is inlined as JSON (`/*__DATA__*/`).
- **Edit layer:** every text with `data-e` is editable in the page (✏️ Править); checkboxes and edits persist in
  `localStorage["jos7-edits"]`; ⬇ Экспорт dumps them as JSON to merge back into `data/jos/`.
- **Publish:** `bash scripts/publish.sh [--no-push] [-m msg] [page…]` — encrypts with the index salt and pushes as
  `JavokhirKomiljanov` via a one-off credential helper (does not switch the global `gh` account).
- **Advisors (4 agents):** `agents/advisors/{cos,hr,mkt,fin}/SKILL.md` + `run_advisors.ps1` (headless Claude Code on
  the Max plan, same pattern as `\Jay\w2w-strategy-run`). They write `data/jos/advisors.json`; publishing stays on the laptop.
- **Company Brain tab:** snapshot of the W2W Brain (MCP) in `data/jos/brain.json`; refresh = re-run the
  `list_entities` / `get_entity` calls listed in that file's `_note`.
- **Agents House:** `data/jos/agents.json` mirrors `Get-ScheduledTask -TaskPath \Jay\` on the server.
- **Hardening:** `robots: noindex,nofollow,noarchive` baked in pre-encryption.

> Do not document the passphrase, internal contents, or anything sensitive in this README.
