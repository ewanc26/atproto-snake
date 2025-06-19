<script lang="ts">
    import { onMount } from 'svelte';
    import { SnakeGame } from '$lib/snake/game';
    import { goto } from '$app/navigation';
    import { isLoggedIn, logout } from '$lib/auth/auth';
    import { setupTouchControls } from '$lib/utils/touchControls';
    import CountdownOverlay from '$lib/components/CountdownOverlay.svelte';
    import GameOverOverlay from '$lib/components/GameOverOverlay.svelte';
    import GameHeader from '$lib/components/GameHeader.svelte';

    let canvasElement: HTMLCanvasElement;
    let game: SnakeGame;
    let isGameOver = false;
    let score = 0;
    let countdown = 0; // New state for countdown

    /**
     * Initialises and starts a new game with a countdown.
     */
    function startGame(): void {
        isGameOver = false;
        countdown = 3; // Start countdown from 3

        const countdownInterval = setInterval(() => {
            countdown -= 1;
            if (countdown === 0) {
                clearInterval(countdownInterval);
                game = new SnakeGame(canvasElement, handleGameOver, updateScore);
                setupTouchControls(canvasElement, game); // Moved here
                game.startGame();
            }
        }, 1000);
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
        if (!isLoggedIn()) {
            goto('/login'); // Redirect to login page if not logged in
        } else {
            startGame();
        }
    });



    /**
     * Handles the logout process.
     */
    function handleLogout() {
        logout();
    }
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white">
     {#if !isGameOver && countdown === 0}
        <GameHeader {score} {handleLogout} />
     {/if}
    <div class="relative w-full max-w-md mx-auto">
        {#if countdown > 0}
             <CountdownOverlay {countdown} />
         {:else if isGameOver}
             <GameOverOverlay {startGame} {handleLogout} />
         {/if}
         <canvas
             bind:this={canvasElement}
             class="border-4 border-green-500 bg-gray-900 w-full aspect-square {isGameOver || countdown > 0 ? 'hidden' : ''}"
         ></canvas>
    </div>
        {#if !isGameOver && countdown === 0}
            <p class="mt-4 text-lg">Use Arrow Keys or swipe to play!</p>
        {/if}
</div>