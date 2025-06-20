<script lang="ts">
    import GameOverOverlay from "$lib/components/GameOverOverlay.svelte";
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

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col">
    <div class="flex-1 flex flex-col items-center justify-center px-4 py-8 pb-20">
        <GameOverOverlay {score} />
    </div>
</div>