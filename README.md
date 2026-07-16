# Snake for AT Protocol

Snake game built with SvelteKit, auth via AT Protocol.

> Independent project; see the [trademark notice](TRADEMARKS.md).

> Also available on [Tangled](https://tangled.org/ewancroft.uk/atproto-snake)

## Features

- Log in with your AT Protocol handle (e.g., `ewancroft.uk`)
- High scores saved to the AT Protocol
- Arrow keys on desktop, swipe on mobile

## Getting started

```bash
git clone https://github.com/ewanc26/atproto-snake.git
cd atproto-snake
npm install
npm run dev
```

### Build

```bash
npm run build
```

## How to play

1. Log in with your AT Protocol handle, app password, and optional PDS URL
2. Arrow keys to steer the snake
3. Eat the food (green squares), grow longer, don't hit walls or yourself
4. Score auto-submits if it's greater than zero

## Project layout

- `src/lib/auth/` — AT Protocol auth
- `src/lib/snake/` — Game logic
- `src/routes/` — Login and game pages
- `src/lib/components/` — Reusable components
- `static/client-metadata.json` — OAuth client metadata

## Licence

MIT
