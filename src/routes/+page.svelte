<script lang="ts">
    import { onMount } from 'svelte';
    import { SnakeGame } from '$lib/snake/game';

    let canvasElement: HTMLCanvasElement;
    let game: SnakeGame;
    let isGameOver = false;

    /**
     * Initialises and starts a new game.
     */
    function startGame(): void {
        isGameOver = false;
        game = new SnakeGame(canvasElement, handleGameOver);
        game.startGame();
    }

    /**
     * Handles the game over event, setting the game over state.
     */
    function handleGameOver(): void {
        isGameOver = true;
    }

    onMount(() => {
        startGame();
    });
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white">
    <h1 class="text-4xl font-bold mb-8">Snake Game</h1>
    {#if isGameOver}
        <div class="text-center">
            <h2 class="text-3xl font-bold mb-4">Game Over!</h2>
            <button
                on:click={startGame}
                class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition duration-300"
            >
                Play Again
            </button>
        </div>
    {:else}
        <canvas bind:this={canvasElement} class="border-4 border-green-500 bg-gray-900"></canvas>
        <p class="mt-4 text-lg">Use Arrow Keys to play!</p>
    {/if}
</div>

<style>
    canvas {
        display: block;
        margin: 0 auto;
    }
</style>
