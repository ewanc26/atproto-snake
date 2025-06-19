<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    onMount(() => {
        const loggedIn = localStorage.getItem('loggedIn');
        if (!loggedIn) {
            goto('/login');
        } else {
            goto('/game');
        }
    });
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white">
    <p>Loading...</p>
</div>