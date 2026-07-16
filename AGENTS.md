# AGENTS.md

Guidance for agents working on Snake for AT Protocol, a SvelteKit game with AT Protocol authentication and high-score records.

## Boundaries

- `src/lib/snake/` owns deterministic game state, movement, collision, food placement, and scoring.
- `src/lib/auth/` and server routes own PDS login/session behavior and score publication.
- `src/routes/` composes UI and endpoints; keep credentials and privileged network calls server-side.
- Static icons/assets live in `static/`.

## Invariants

- Game logic should be independently testable and must not depend on frame rate. Prevent 180-degree turns, duplicate input races, invalid food placement, and multiple game-over submissions.
- Desktop keyboard and mobile swipe controls must produce equivalent direction changes without scrolling the page during play.
- Scores are untrusted client input. Validate record shape and bounds before writing, and never claim submission success on PDS failure.
- Keep handles, DIDs, AT URIs, and session data distinct. Do not log app passwords or tokens.
- Preserve responsive layout and accessible controls.

## Validation

Use npm and run `npm run check`, `npm run lint`, and `npm run build`. Exercise start/restart, pause/focus loss, rapid turns, wall/self collision, narrow mobile view, swipe input, login failure, expired session, zero-score suppression, successful score write, and network failure. Do not commit `.env` files or generated output.
