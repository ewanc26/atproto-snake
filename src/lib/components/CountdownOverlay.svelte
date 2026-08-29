<script lang="ts">
	// Countdown overlay shown at game start (3, 2, 1, Go!)
	export let countdown: number;
</script>

<div
	class="bg-canvas-950/90 text-ink-950 absolute inset-0 flex flex-col items-center justify-center rounded-lg"
>
	<div class="text-center">
		<!-- Animated countdown number -->
		<div class="relative mb-4">
			<div class="text-gold-400 animate-pulse text-8xl font-extrabold sm:text-9xl">
				{countdown}
			</div>
			<!-- Glow effect -->
			<div class="text-gold-400/30 absolute inset-0 text-8xl font-extrabold blur-xl sm:text-9xl">
				{countdown}
			</div>
		</div>

		<!-- Get ready text -->
		<p class="text-ink-700 animate-bounce text-xl font-medium sm:text-2xl">Get Ready!</p>

		<!-- Progress dots -->
		<div class="mt-6 flex justify-center space-x-2">
			{#each Array(3) as _, i}
				<div
					class="h-3 w-3 rounded-full transition-all duration-300 {i < 3 - countdown
						? 'bg-gold-400'
						: 'bg-canvas-700'}"
				></div>
			{/each}
		</div>
	</div>
</div>
