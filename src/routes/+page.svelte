<script lang="ts">
    import { onMount } from 'svelte';
    import { SnakeGame } from '$lib/snake/game';

    let canvasElement: HTMLCanvasElement;
    let game: SnakeGame;

    onMount(() => {
        game = new SnakeGame(canvasElement);
        game.startGame();
    });
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white">
    <h1 class="text-4xl font-bold mb-8">Snake Game</h1>
    <canvas bind:this={canvasElement} class="border-4 border-green-500 bg-gray-900"></canvas>
    <p class="mt-4 text-lg">Use Arrow Keys to play!</p>
</div>

<style>
    canvas {
        display: block;
        margin: 0 auto;
    }
</style>
