<script lang="ts">
    import { getCurrentUserHandle } from '$lib/auth/auth';
    
    export let score: number;
    export let handleLogout: () => void;
    
    $: userHandle = getCurrentUserHandle();
</script>

<div class="w-full max-w-md">
    <h1 class="text-4xl font-bold mb-4 text-center">Snake Game</h1>
    <div class="flex items-center justify-between mb-4">
        <div class="flex flex-col">
            <p class="text-2xl font-bold">Score: {score}</p>
            {#if userHandle}
                <p class="text-sm text-gray-400">Playing as @{userHandle}</p>
            {/if}
        </div>
        <button 
            on:click={handleLogout} 
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transition duration-300"
        >
            Logout
        </button>
    </div>
</div>