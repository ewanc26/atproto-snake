# Contributing to atproto-snake

Snake game built with SvelteKit, with AT Protocol auth: log in with your handle and app password (optional custom PDS), and high scores save to the AT Protocol network. Thanks for wanting to help!

Independent project; see the [trademark notice](TRADEMARKS.md).

## Getting started

```bash
git clone https://github.com/ewanc26/atproto-snake.git
cd atproto-snake
npm install
npm run dev
```

## Project layout

- `src/lib/auth/` — AT Protocol auth
- `src/lib/snake/` — game logic
- `src/routes/` — login and game pages
- `src/lib/components/` — reusable components
- `static/client-metadata.json` — OAuth client metadata

## Notes for this project

- Keep game logic in `src/lib/snake/` and UI in components: the game should stay testable without a browser and a login.
- Score submission writes to the player's own repo; test with a scratch account, and never log credentials.
- Keep it dependency-light and dependency-light and quick to load: it's a small game and should stay one.
- Touch/mobile (swipe) and keyboard input are both first-class; changes to controls should hold both.

## Before opening a PR

- `npm run build` passes; the game plays cleanly in `npm run dev`.
- Conventional commits; focused PRs; note how you verified (score flow in particular).
- AI-assisted PRs welcome; stand behind every line and run the checks yourself.

## Licence

MIT. Contributions accepted under the same terms.