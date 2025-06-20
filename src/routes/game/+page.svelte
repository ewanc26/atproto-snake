<script lang="ts">
    import { onMount } from 'svelte';
    import { SnakeGame } from '$lib/snake/game';
    import { goto } from '$app/navigation';
    import { isLoggedIn, logout, submitScore } from '$lib/auth/auth';
    import { setupTouchControls } from '$lib/utils/touchControls';
    import CountdownOverlay from '$lib/components/CountdownOverlay.svelte';
    import GameOverOverlay from '$lib/components/GameOverOverlay.svelte';
    import GameHeader from '$lib/components/GameHeader.svelte';

    let canvasElement: HTMLCanvasElement;
    let game: SnakeGame;
    let isGameOver = false;
    let score = 0;
    let countdown = 0;

    /**
     * Initialises and starts a new game with a countdown.
     */
    function startGame(): void {
        isGameOver = false;
        countdown = 3;

        const countdownInterval = setInterval(() => {
            countdown -= 1;
            if (countdown === 0) {
                clearInterval(countdownInterval);
                game = new SnakeGame(canvasElement, handleGameOver, (score: number) => updateScore(score));
                setupTouchControls(canvasElement, game);
                game.startGame();
            }
        }, 1000);
    }

    let finalScore = 0;

    /**
     * Handles the game over event, setting the game over state and storing the final score.
     */
    const handleGameOver: () => void = async () => {
        finalScore = game.score;
        isGameOver = true;

        if (finalScore > 0) {
            try {
                await submitScore(finalScore);
                console.log('Score submitted successfully!');
            } catch (error) {
                console.error('Failed to submit score:', error);
            }
        }
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
            goto('/login');
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

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col">
    <!-- Main Content Container -->
    <div class="flex-1 flex flex-col items-center justify-center px-4 py-8 pb-20">
        <!-- Game Header - Only show when game is active -->
        {#if !isGameOver && countdown === 0}
            <div class="w-full max-w-md mb-6">
                <GameHeader {score} {handleLogout} />
            </div>
        {/if}

        <!-- Game Canvas Container -->
        <div class="relative w-full max-w-md mx-auto">
            <!-- Canvas with improved styling -->
            <div class="relative overflow-hidden rounded-xl shadow-2xl bg-gray-900 border-4 border-green-500/50">
                <canvas
                    bind:this={canvasElement}
                    class="w-full aspect-square block bg-gray-900 {isGameOver || countdown > 0 ? 'opacity-50' : ''}"
                ></canvas>
                
                <!-- Overlays -->
                {#if countdown > 0}
                    <div class="absolute inset-0">
                        <CountdownOverlay {countdown} />
                    </div>
                {/if}
                
                {#if isGameOver}
                    <div class="absolute inset-0">
                        <GameOverOverlay {startGame} {handleLogout} score={finalScore} />
                    </div>
                {/if}
            </div>
        </div>

        <!-- Game Instructions - Only show when game is active -->
        {#if !isGameOver && countdown === 0}
            <div class="mt-6 text-center max-w-md">
                <p class="text-lg text-gray-300 mb-2">Use Arrow Keys or swipe to play!</p>
                <div class="flex flex-wrap justify-center gap-2 text-sm text-gray-400">
                    <span class="px-3 py-1 bg-gray-700 rounded-full">↑ ↓ ← → Arrow Keys</span>
                    <span class="px-3 py-1 bg-gray-700 rounded-full">📱 Touch & Swipe</span>
                </div>
            </div>
        {/if}
    </div>
</div>