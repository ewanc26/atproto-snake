<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { isLoggedIn } from '$lib/auth/auth';

    onMount(() => {
        if (!isLoggedIn()) {
            goto('/login');
        } else {
            goto('/game');
        }
    });
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white">
    <p>Loading...</p>
</div>