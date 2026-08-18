<script lang="ts">
	// GameOverOverlay: displays final score with Play Again / Logout buttons.
	// Score is passed via URL param from the game route after submission.
	import { goto } from '$app/navigation';
	import { logout } from '$lib/auth/auth';

	export let score: number;
</script>

<div class="text-ink-950 absolute inset-0 flex flex-col items-center justify-center rounded-lg p-8">
	<div class="mx-auto w-full max-w-md text-center">
		<!-- Game Over Title -->
		<div class="mb-6">
			<h1 class="text-ember-400 mb-2 text-3xl font-extrabold sm:text-5xl">Game Over!</h1>
			<div class="bg-ember-500 mx-auto h-px w-16"></div>
		</div>

		<!-- Score Display -->
		<div class="bg-canvas-800 border-canvas-line mb-8 rounded-lg border p-6">
			<p class="text-ink-500 mb-2 text-lg">Final Score</p>
			<div class="text-gold-400 text-4xl font-bold sm:text-5xl">
				{score}
			</div>
			{#if score > 0}
				<p class="text-ink-500 mt-2 text-sm">Score submitted to AT Protocol!</p>
			{/if}
		</div>

		<!-- Action Buttons -->
		<div class="w-full space-y-3">
			<button
				on:click={() => goto('/game')}
				class="bg-gold-500 hover:bg-gold-400 text-canvas-950 w-full rounded-md px-6 py-3 font-bold transition-colors duration-200"
			>
				<div class="flex items-center justify-center space-x-2">
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>Play Again</span>
				</div>
			</button>
			<button
				on:click={logout}
				class="border-ember-500/40 text-ember-400 hover:bg-ember-500/10 w-full rounded-md border px-6 py-3 font-bold transition-colors duration-200"
			>
				Logout
			</button>
		</div>
	</div>
</div>
