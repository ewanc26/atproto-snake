<script lang="ts">
    export let startGame: () => void;
    export let handleLogout: () => void;
    export let score: number;
</script>

<div class="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-sm text-white rounded-xl p-6">
    <div class="text-center max-w-sm w-full">
        <!-- Game Over Title -->
        <div class="mb-6">
            <h1 class="text-4xl sm:text-5xl font-bold text-red-400 mb-2">Game Over!</h1>
            <div class="h-1 w-16 bg-gradient-to-r from-red-400 to-red-600 mx-auto rounded-full"></div>
        </div>
        
        <!-- Score Display -->
        <div class="bg-gray-800/80 rounded-xl p-6 mb-8 border border-gray-700/50">
            <p class="text-lg text-gray-400 mb-2">Final Score</p>
            <div class="text-4xl sm:text-5xl font-bold text-green-400">
                {score}
            </div>
            {#if score > 0}
                <p class="text-sm text-gray-500 mt-2">Score submitted to AT Protocol!</p>
            {/if}
        </div>
        
        <!-- Action Buttons -->
        <div class="space-y-3 w-full">
            <button 
                on:click={startGame}
                class="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95"
            >
                <div class="flex items-center justify-center space-x-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-6-4V6a2 2 0 112 2h2a2 2 0 012 2v4M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Play Again</span>
                </div>
            </button>
            
            <button 
                on:click={handleLogout}
                class="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl border border-gray-600/50"
            >
                <div class="flex items-center justify-center space-x-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                </div>
            </button>
        </div>
    </div>
</div>