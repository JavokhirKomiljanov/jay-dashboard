# JOS — UI pass + bug sweep (Fable 5.1, 2026-11-24)

Jay (Telegram, 2026-11-24): «with Fable 5 use it to JayOS both mobile and web, and also there were many bugs in some of the pages, fix them, and make less text with more comfortable UI».

## Scope
- JOS web = this repo `C:\Users\user\Dev\jay-dashboard` (read CLAUDE.md + README first). Pages: `*.plaintext.html` / `src/*.tpl.html` built by `scripts/build_*.py`, encrypted + pushed with `bash scripts/publish.sh -m "<msg>" <page ...>` (index is the shell, other pages load as panels/iframes).
- JOS mobile = `C:\Users\user\Dev\jos-mobile` (WebView shell around the same site + mobile layer). Check it renders the redesigned pages well; rebuild the APK only if the shell itself needs a change.

## What to do
1. Audit EVERY page with headless Chromium (python playwright is installed): desktop 1280x900 and phone 390x844. Collect console errors, broken layouts, overflowing text, dead buttons/links, empty states, tabs that render nothing. Write the list to `docs/AUDIT-2026-11-24.md` (page → bug → fixed?).
2. Fix the bugs at the source (templates / build scripts / data loaders), not by editing generated output.
3. Redesign for less text and more comfort, in one consistent system across pages (reference: the Galereya page done 2026-11-21 — `src/galereya.tpl.html` "minimal v2"): short labels, no emoji spam, filters as dropdowns, actions behind a ⋯ menu, cards = title + one meta line, details on click, generous spacing, readable on a phone.
   STYLE = the NEW W2W Design System v3 (Jay 2026-11-24): read and follow the skill `C:\Users\user\.claude\skills\w2w-design-system\SKILL.md`
   and its `reference/*.css` (tokens, materials, controls, motion) + `assets/fonts` (Onest, self-host the woff2 in the repo, no Google Fonts).
   Turquoise #0ABCF3 brand, Shark #232325 text, Onest only, iOS «Liquid Glass» cards/controls; Green #07E7B7 ONLY as a status signal.
   Put the shared tokens/CSS in ONE file (e.g. assets/w2w-v3.css) that every page links, so the whole JOS changes from one place.
   Stability first: the JOS parent (index) inverts iframe panels in dark mode — check both light and dark.
4. Keep every existing function and the edit layer (localStorage overrides, «everything editable» rule) working. Never drop data, never invent numbers.
5. Before/after screenshots for each page (desktop + phone) into `docs/ui-2026-11-24/`.
6. Publish with scripts/publish.sh, then re-run the audit on the live site.

## Rules
- Do not touch secrets (passphrase lives outside the repo — publish.sh reads it).
- Small commits per page group. If a page needs a decision from Jay, leave it as is and list it.
- When finished, send ONE short message (Russian, ≤6 lines, first line bold) to Jay through the Jay AI bot:
  `python C:\Users\user\Dev\Jay-Telegram-Automation\tools\notify_jay.py "<text>"` if that exists, otherwise POST to Telegram sendMessage with JAY_AI_BOT_TOKEN / JAVOKHIR_TELEGRAM_USER_ID from ~/.claude/.env (parse_mode HTML). Say what changed, how many bugs fixed, what is left.
