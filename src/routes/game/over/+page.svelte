<script lang="ts">
	// Game-over route — reads the score from the URL query param
	// and renders the GameOverOverlay with play-again / logout actions.
	import GameOverOverlay from '$lib/components/GameOverOverlay.svelte';
	import { getStores } from '$app/stores';
	const { page } = getStores();

	let score: number = 0;

	$: {
		const scoreParam = $page.url.searchParams.get('score');
		if (scoreParam) {
			score = parseInt(scoreParam, 10);
		}
	}
</script>

<div class="bg-canvas-950 text-ink-900 flex min-h-screen flex-col">
	<div class="flex flex-1 flex-col items-center justify-center px-4 py-8 pb-20">
		<GameOverOverlay {score} />
	</div>
</div>
