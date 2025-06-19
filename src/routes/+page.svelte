<script lang="ts">
    import { onMount } from 'svelte';
    import { SnakeGame } from '$lib/snake/game';

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
        startGame();
    });
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white">
    <h1 class="text-4xl font-bold mb-8">Snake Game</h1>
    <p class="text-2xl mb-4">Score: {score}</p>
    <div class="relative">
        <canvas
            bind:this={canvasElement}
            class="border-4 border-green-500 bg-gray-900 {isGameOver ? 'hidden' : ''}"
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

<style>
    canvas {
        display: block;
        margin: 0 auto;
    }
</style>
