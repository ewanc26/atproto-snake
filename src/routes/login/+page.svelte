<script lang="ts">
    import { login } from '$lib/auth/auth';

    let username = '';
    let password = '';
    let errorMessage = '';

    /**
     * Handles the login form submission.
     */
    async function handleLogin(): Promise<void> {
        errorMessage = ''; // Clear previous error messages
        const success = await login(username, password);
        if (!success) {
            errorMessage = 'Invalid username or password.';
        }
    }
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white">
    <h1 class="text-4xl font-bold mb-8">Login</h1>
    <form on:submit|preventDefault={handleLogin} class="bg-gray-700 p-8 rounded-lg shadow-lg w-96">
        <div class="mb-4">
            <label for="username" class="block text-lg font-medium mb-2">Username:</label>
            <input
                type="text"
                id="username"
                bind:value={username}
                class="w-full p-3 rounded-md bg-gray-600 border border-gray-500 text-white focus:outline-none focus:border-green-500"
                required
            />
        </div>
        <div class="mb-6">
            <label for="password" class="block text-lg font-medium mb-2">Password:</label>
            <input
                type="password"
                id="password"
                bind:value={password}
                class="w-full p-3 rounded-md bg-gray-600 border border-gray-500 text-white focus:outline-none focus:border-green-500"
                required
            />
        </div>
        {#if errorMessage}
            <p class="text-red-400 mb-4">{errorMessage}</p>
        {/if}
        <button
            type="submit"
            class="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition duration-300"
        >
            Login
        </button>
    </form>
</div>