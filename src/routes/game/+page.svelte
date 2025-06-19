<script lang="ts">
    import { onMount } from 'svelte';
    import { SnakeGame } from '$lib/snake/game';
    import { goto } from '$app/navigation';

    let canvasElement: HTMLCanvasElement;
    let game: SnakeGame;
    let isGameOver = false;
    let score = 0;

    /**
     * Initialises and starts a new game.
     */
    function startGame(): void {
        isGameOver = false;
        game = new SnakeGame(canvasElement, handleGameOver, updateScore);
        game.startGame();
    }

    /**
     * Handles the game over event, setting the game over state.
     */
    function handleGameOver(): void {
        isGameOver = true;
    }

    /**
     * Updates the displayed score.
     * @param newScore The new score value.
     */
    function updateScore(newScore: number): void {
        score = newScore;
    }

    onMount(() => {
        // Check if the user is logged in
        const loggedIn = localStorage.getItem('loggedIn');
        if (!loggedIn) {
            goto('/login'); // Redirect to login page if not logged in
        } else {
            startGame();
            setupTouchControls();
        }
    });

    /**
     * Sets up touch controls for the game on the canvas.
     */
    function setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;

        canvasElement.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        canvasElement.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;

            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal swipe
                if (dx > 0) {
                    game.changeDirection('right');
                } else {
                    game.changeDirection('left');
                }
            } else {
                // Vertical swipe
                if (dy > 0) {
                    game.changeDirection('down');
                } else {
                    game.changeDirection('up');
                }
            }
        });
    }

    /**
     * Handles the logout process.
     * Clears the 'loggedIn' flag from localStorage and redirects to the login page.
     */
    function handleLogout() {
        localStorage.removeItem('loggedIn');
        goto('/login');
    }
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white">
     <h1 class="text-4xl font-bold mb-8">Snake Game</h1>
     <div class="flex items-center mb-4">
         <p class="text-2xl mr-4">Score: {score}</p>
         <button on:click={handleLogout} class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transition duration-300">Logout</button>
     </div>
    <div class="relative w-full max-w-md mx-auto">
        <canvas
            bind:this={canvasElement}
            class="border-4 border-green-500 bg-gray-900 w-full aspect-square {isGameOver ? 'hidden' : ''}"
        ></canvas>
        {#if isGameOver}
            <div class="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-75 text-white">
                <h2 class="text-3xl font-bold mb-4">Game Over!</h2>
                <button
                    on:click={startGame}
                    class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition duration-300"
                >
                    Play Again
                </button>
            </div>
        {/if}
    </div>
        <p class="mt-4 text-lg">Use Arrow Keys to play!</p>
</div>