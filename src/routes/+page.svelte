<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { isLoggedIn, refreshSession } from '$lib/auth/auth';

    onMount(async () => {
        if (!isLoggedIn()) {
            goto('/login');
        } else {
            // Try to refresh the session to ensure it's still valid
            try {
                await refreshSession();
                goto('/game');
            } catch {
                // If refresh fails, redirect to login
                goto('/login');
            }
        }
    });
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white">
    <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p class="text-lg">Loading...</p>
    </div>
</div>