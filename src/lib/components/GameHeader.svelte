<script lang="ts">
    export let score: number;
    export let handleLogout: () => void;
</script>

<h1 class="text-4xl font-bold mb-8">Snake Game</h1>
<div class="flex items-center mb-4">
    <p class="text-2xl mr-4">Score: {score}</p>
    <button on:click={handleLogout} class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transition duration-300">Logout</button>
</div>