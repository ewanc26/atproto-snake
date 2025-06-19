<script lang="ts">
    export let startGame: () => void;
    export let handleLogout: () => void;
</script>

<div class="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-75 text-white">
    <h2 class="text-3xl font-bold mb-4">Game Over!</h2>
    <div class="flex space-x-4">
        <button
            on:click={startGame}
            class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition duration-300"
        >
            Play Again
        </button>
        <button
            on:click={handleLogout}
            class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transition duration-300"
        >
            Logout
        </button>
    </div>
</div>