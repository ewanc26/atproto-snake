# AGENTS.md

Guidance for agents working on Snake for AT Protocol, a client-only SvelteKit 5 canvas game that writes `uk.ewancroft.snake.score` records to the signed-in player's repository.

## Read First

- Read `README.md`, `package.json`, and the touched source before changing behavior. The README is intentionally brief; source is authoritative.
- `src/lib/snake/` owns the 20-by-20 engine, interval-driven movement, collision, food placement, speed scaling, and canvas renderer.
- `src/routes/game/+page.svelte` owns countdown, game construction, score submission, and navigation to the game-over page. `src/lib/utils/touchControls.ts` translates canvas swipes.
- `src/lib/auth/` contains two browser-side paths: OAuth through `@atproto/oauth-client-browser`, and legacy app-password login through Slingshot identity resolution plus `AtpAgent`.
- `static/client-metadata.json` is the production OAuth metadata. There is currently no checked-in score lexicon and no server route or backend.

## Current Reality and Risks

- Treat all authentication and repository writes as browser operations. The app-password session, including access and refresh tokens, is persisted in `localStorage` under `atproto_session`; never add logging or telemetry that exposes it.
- Keep the OAuth scope and production metadata aligned: `atproto repo:uk.ewancroft.snake.score`, root redirect URI, public client, and DPoP-bound access tokens.
- `logout()` only clears the module agent and app-password storage. It does not revoke or clear the browser OAuth client's stored session, so verify OAuth logout/return behavior before claiming it is complete.
- `isLoggedIn()` accepts the mere presence of the local-storage key, while full validation happens later in `initAuth()`. Preserve redirects carefully and test corrupt and expired sessions.
- Score submission is best-effort: failures are logged, but the game-over overlay currently says every positive score was submitted. Do not preserve or extend that false-success behavior when touching submission UX.
- There is no leaderboard, server-side score validation, automated test suite, or generated lexicon validation. Records contain only `$type`, numeric `score`, and ISO `createdAt`; keep collection identifiers exact and regard URL/query scores as display-only untrusted input.
- `SnakeGame` and `GameRenderer` register document/window/touch listeners and timers without a destroy path. Repeated construction or route teardown can leak handlers. Clear intervals/timeouts and remove listeners when adding lifecycle work.
- Movement uses `setInterval`, not elapsed-time simulation. Direction buffering compares against `currentDirection`; collision handling does not return early from the tick. Test rapid turns, speed changes, and terminal ticks rather than assuming deterministic behavior.

## Change Rules

- Keep game state in the engine and DOM/navigation/auth state in Svelte routes. Do not make canvas classes depend on Svelte stores.
- Prevent 180-degree turns and food-on-body placement. Keep keyboard/WASD and swipe controls equivalent, and retain non-passive touch handlers so the page does not scroll during play.
- A game over must submit at most once, suppress zero-score writes, wait for the write attempt, and report the actual result to the player. Never trust a score copied from `?score=` as proof of a write.
- Preserve the distinction between handles, DIDs, PDS service URLs, OAuth sessions, and app-password sessions. Prefer OAuth for new work; do not broaden its repository scope casually.
- Use browser-only APIs behind client lifecycle boundaries. Maintain responsive square-canvas behavior and keyboard, touch, focus, and accessible-control usability.

## Validation

- Use the lockfile-compatible npm workflow: `npm install` (or `npm ci` from a clean checkout), then `npm run check`, `npm run lint`, and `npm run build`. There is no `test` script.
- Manually exercise OAuth callback/restore/logout, app-password login/restore/logout, malformed and expired storage, resolver/PDS failures, and production client-metadata redirects.
- Exercise countdown, restart, space pause, rapid queued turns, wall/self collision, near-full food placement, repeated navigation, resize, narrow mobile swipe input, zero score, successful record creation, and write failure. Inspect the created record in the user's repository and ensure the UI never reports success after failure.
- Do not commit `.env` files, credentials, `.svelte-kit/`, or build output. Both npm and pnpm lockfiles are currently tracked; avoid changing package-manager state incidentally.
