# ATProto Snake Game

A classic Snake game built with SvelteKit and integrated with the AT Protocol for user authentication.

## Features

* **Classic Snake Gameplay**: Enjoy the timeless game of Snake.
* **AT Protocol Authentication**: Log in using your AT Protocol handle (e.g., bsky.social).
* **Responsive Design**: Play on various devices.
* **SvelteKit Frontend**: Fast and modern user interface.
* **High Score Saving**: Automatically saves your high score to the AT Protocol.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

* Node.js (LTS recommended)
* npm (comes with Node.js)

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/ewanc26/atproto-snake.git
    cd atproto-snake
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

### Running the Development Server

```bash
npm run dev
```

This will start the development server, usually at `http://localhost:5173`.

### Building for Production

```bash
npm run build
```

This will create a `build` directory with the production-ready files.

## How to Play

1. **Login**: Enter your AT Protocol handle (e.g., `yourhandle.bsky.social`) on the login page.
2. **Start Game**: Once logged in, the game will start after a short countdown.
3. **Controls**: Use the arrow keys (Up, Down, Left, Right) on your keyboard to control the snake. On touch devices, swipe in the desired direction.
4. **Objective**: Guide the snake to eat the food (green squares) to grow longer and increase your score. Avoid hitting the walls or your own tail.
5. **Game Over**: The game ends when the snake hits a wall or its own tail. Your score will be automatically submitted to the AT Protocol if it's greater than zero.

## Project Structure

* `src/lib/auth/`: Contains all AT Protocol authentication logic.
* `src/lib/snake/`: Core Snake game logic.
* `src/routes/`: SvelteKit routes for different pages (login, game, callback).
* `src/lib/components/`: Reusable Svelte components.
* `static/client-metadata.json`: OAuth client metadata for AT Protocol.

## Technologies Used

* [SvelteKit](https://kit.svelte.dev/): Web framework for building the frontend.
* [AT Protocol](https://atproto.com/): Decentralised social networking protocol for authentication.
* [Tailwind CSS](https://tailwindcss.com/): Utility-first CSS framework for styling.
* [Vite](https://vitejs.dev/): Next-generation frontend tooling.

## License

This project is open-source and available under the MIT License.
