<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { initAuth } from '$lib/auth/auth';

	onMount(async () => {
		const agent = await initAuth();
		if (agent) {
			goto('/game');
		} else {
			goto('/login');
		}
	});
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-gray-800 text-white">
	<div class="text-center">
		<div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-green-500"></div>
		<p class="text-lg">Loading...</p>
	</div>
</div>
