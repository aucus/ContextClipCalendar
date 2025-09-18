# Repository Guidelines

## Project Structure & Module Organization
- Root-level Chrome Extension (Manifest v3).
- Key files: `manifest.json`, `background.js`, `popup.html/js`, `options.html/js`, `content-script.js`.
- Utilities: `calendar-utils.js` (Calendar), `llm-utils.js` (Gemini).
- Assets: `icons/` and marketing images. No `src/` folder.

## Build, Test, and Development Commands
- Load Unpacked: open `chrome://extensions` → enable Developer Mode → Load unpacked → select repo root.
- Reload & Logs: use the “Reload” button; view Background Service Worker logs via the “service worker” link; open DevTools on popup/options for UI logs.
- Node scripts: `package.json` has no build; tests not configured. Avoid adding build steps without discussion.

## Coding Style & Naming Conventions
- Language: modern JavaScript (ES2020+), Manifest v3 APIs.
- Indentation: 4 spaces; Semicolons: required; Quotes: single `'` preferred.
- Filenames: kebab-case (`popup.js`, `calendar-utils.js`).
- Naming: camelCase for vars/functions, PascalCase for classes, UPPER_SNAKE_CASE for constants.
- Keep code modular in the existing files; prefer small, pure functions.

## Testing Guidelines
- Current: manual testing in Chrome. Verify clipboard flow, context menu, OAuth, event creation, and error states.
- If adding tests: place in `tests/`, use `*.spec.js` naming; add minimal tooling (e.g., `vitest`) only after discussion.
- Include reproduction steps in PRs and screenshots/GIFs for UI changes.

## Commit & Pull Request Guidelines
- Commit style: Conventional Commits (`feat:`, `fix:`, `chore:`), English or Korean acceptable.
- PRs must include: clear description, scope, linked issues, screenshots (UI), test steps, and any `manifest.json` changes called out explicitly.
- Keep diffs focused; avoid unrelated formatting churn.

## Security & Configuration Tips
- Do not commit secrets. API keys are entered via the extension UI; OAuth `client_id` lives in `manifest.json`—coordinate before changing.
- Request the least Chrome permissions necessary; document changes in README.

## Agent-Specific Instructions
- Respect this structure; do not introduce bundlers or new dependencies without approval.
- When editing `manifest.json`, validate MV3 compliance and bump `version` when releasing.
- Update README if UX, permissions, or setup steps change.
