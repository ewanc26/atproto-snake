<script lang="ts">
	// Game route — the main game loop. On mount it checks auth, then
	// starts a 3-second countdown before the SnakeGame engine begins.
	// Scores are submitted to AT Protocol on game over.
	import { onMount } from 'svelte';
	import { SnakeGame } from '$lib/snake/game';
	import { goto } from '$app/navigation';
	import { isLoggedIn, submitScore, logout } from '$lib/auth/auth';
	import { setupTouchControls } from '$lib/utils/touchControls';
	import CountdownOverlay from '$lib/components/CountdownOverlay.svelte';
	import GameHeader from '$lib/components/GameHeader.svelte';

	let canvasElement: HTMLCanvasElement | undefined;
	let game: SnakeGame;

	let score = 0;
	let countdown = 0;

	/**
	 * Initialises and starts a new game with a countdown.
	 */
	function startGame(): void {
		countdown = 3;

		const countdownInterval = setInterval(() => {
			countdown -= 1;
			if (countdown === 0) {
				clearInterval(countdownInterval);
				if (canvasElement) {
					game = new SnakeGame(canvasElement, handleGameOver, (score: number) =>
						updateScore(score)
					);
					setupTouchControls(canvasElement, game);
				}
				game.startGame();
			}
		}, 1000);
	}

	/**
	 * Handles the game over event, setting the game over state and storing the final score.
	 */
	const handleGameOver: () => void = async () => {
		const finalScore = game.score;

		if (finalScore > 0) {
			try {
				await submitScore(finalScore);
				console.log('Score submitted successfully!');
			} catch (error) {
				console.error('Failed to submit score:', error);
			}
		}
		goto(`/game/over?score=${finalScore}`);
	};

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
</script>

<div class="bg-canvas-950 text-ink-900 flex min-h-screen flex-col">
	<!-- Main Content Container -->
	<div class="flex flex-1 flex-col items-center justify-center px-4 py-8 pb-20">
		<!-- Game Header - Only show when game is active -->
		{#if countdown === 0}
			<div class="mb-6 flex w-full max-w-md items-center justify-between">
				<GameHeader {score} />
			</div>
		{/if}

		<!-- Game Canvas Container -->
		<div class="relative mx-auto w-full max-w-md">
			<!-- Canvas with improved styling -->
			<div class="bg-canvas-900 border-gold-500/40 relative overflow-hidden rounded-lg border">
				<canvas
					bind:this={canvasElement}
					class="bg-canvas-900 block aspect-square w-full {countdown > 0 ? 'opacity-50' : ''}"
				></canvas>

				<!-- Overlays -->
				{#if countdown > 0}
					<div class="absolute inset-0">
						<CountdownOverlay {countdown} />
					</div>
				{/if}
			</div>
		</div>

		<!-- Game Instructions - Only show when game is active -->
		{#if countdown === 0}
			<div class="mt-6 max-w-md text-center">
				<p class="text-ink-700 mb-2 text-lg">Use Arrow Keys or swipe to play!</p>
				<div class="text-ink-500 flex flex-wrap justify-center gap-2 font-mono text-sm">
					<span class="bg-canvas-800 border-canvas-line rounded-full border px-3 py-1"
						>↑ ↓ ← → Arrow Keys</span
					>
					<span class="bg-canvas-800 border-canvas-line rounded-full border px-3 py-1"
						>📱 Touch & Swipe</span
					>
				</div>
			</div>
		{/if}
	</div>
</div>
