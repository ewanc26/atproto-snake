<script lang="ts">
    export let startGame: () => void;
    export let handleLogout: () => void;
    export let score: number;
</script>

<div class="game-overlay">
    <h1>Game Over!</h1>
    <p>Final Score: {score}</p>
    <button on:click={startGame}>Play Again</button>
    <button on:click={handleLogout} class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transition duration-300">Logout</button>
</div>

<style>
    .game-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: white;
        font-size: 2em;
        z-index: 10;
    }

    .game-overlay h1 {
        margin-bottom: 20px;
    }

    .game-overlay p {
        margin-bottom: 20px;
        font-size: 0.8em;
    }


</style>