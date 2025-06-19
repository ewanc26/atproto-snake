<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { handleOAuthCallback } from '$lib/auth/atproto';

    let loading = true;
    let error = '';

    onMount(async () => {
        const urlParams = $page.url.searchParams;
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const errorParam = urlParams.get('error');

        if (errorParam) {
            error = `OAuth error: ${errorParam}`;
            loading = false;
            return;
        }

        if (!code || !state) {
            error = 'Missing OAuth parameters';
            loading = false;
            return;
        }

        try {
            await handleOAuthCallback(code, state);
            // Successful login, redirect to game
            goto('/game');
        } catch (err) {
            console.error('OAuth callback error:', err);
            error = err instanceof Error ? err.message : 'Authentication failed';
            loading = false;
        }
    });

    function handleRetry() {
        goto('/login');
    }
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white">
    {#if loading}
        <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <h1 class="text-2xl font-bold mb-2">Completing Login...</h1>
            <p class="text-gray-300">Please wait while we finish setting up your session.</p>
        </div>
    {:else if error}
        <div class="text-center max-w-md">
            <div class="bg-red-900 border border-red-700 rounded-lg p-6 mb-6">
                <h1 class="text-2xl font-bold mb-4 text-red-300">Authentication Failed</h1>
                <p class="text-red-200 mb-4">{error}</p>
                <button
                    on:click={handleRetry}
                    class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition duration-300"
                >
                    Try Again
                </button>
            </div>
        </div>
    {/if}
</div>