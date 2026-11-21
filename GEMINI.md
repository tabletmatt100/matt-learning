# matt-learning Workspace Overview

Interactive E-ink learning repository published at `https://tabletmatt100.github.io/matt-learning/`.

## Creating or Editing Articles
- **Activate the `write-article` skill** (`/data/data/com.termux/files/home/.gemini/config/skills/write-article/SKILL.md`) before writing, editing, or auditing any article. It holds the complete pedagogical rules, 5-stage architecture, E-ink responsive requirements (`Go 10.3` + `Palma 3`), and pre-publish audit checklist.
- **Reference Template**: Use `template2.html` as the structural pattern.
- **Shared Assets**: Load `common.css` and `common.js` in `<head>` (after local `katex/` with CDN fallback). Define only `var GLOSSARY = {...}`, `var SPACED_CARDS = [...]`, and page-specific interactive widgets in each article.

## Publishing Workflow
1. Add a card/link for any new article to `index.html` (and update `sw.js` cached assets if needed).
2. **Never commit API keys or tokens** (`GEMINI_API_KEY` / GitHub token) into any repo file; store keys only in `~/.secrets` and the private state Gist (`./gist-state.sh set-gemini-key`).
3. Commit and push changes to `main`.
4. Provide the live GitHub Pages URL (`https://tabletmatt100.github.io/matt-learning/<filename>`) in your response (never a `file://` link).
