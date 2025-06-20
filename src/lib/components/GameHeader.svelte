<script lang="ts">
    import { getCurrentUserHandle } from '$lib/auth/auth';
    
    export let score: number;
    export let handleLogout: () => void;
    
    $: userHandle = getCurrentUserHandle();
</script>

<div class="w-full">
    <!-- Game Title -->
    <h1 class="text-3xl sm:text-4xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
        Snake Game
    </h1>
    
    <!-- Score and User Info Card -->
    <div class="bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-700/50">
        <div class="flex items-center justify-between">
            <!-- Score and User Info -->
            <div class="flex flex-col space-y-1">
                <div class="flex items-center space-x-3">
                    <div class="bg-green-500/20 rounded-lg px-3 py-2">
                        <p class="text-xl sm:text-2xl font-bold text-green-400">
                            Score: <span class="text-white">{score}</span>
                        </p>
                    </div>
                </div>
                {#if userHandle}
                    <p class="text-sm text-gray-400 ml-1">
                        Playing as <span class="text-green-400 font-medium">@{userHandle}</span>
                    </p>
                {/if}
            </div>
            
            <!-- Logout Button -->
            <button 
                on:click={handleLogout} 
                class="flex items-center space-x-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white font-medium rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95"
            >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span class="hidden sm:inline">Logout</span>
            </button>
        </div>
    </div>
</div>