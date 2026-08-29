<!-- Home splash — redirects based on auth state -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { initAuth } from '$lib/auth/auth';

	// Redirect based on existing session — login page if unauthenticated,
	// game page if already logged in.
	onMount(async () => {
		const agent = await initAuth();
		if (agent) {
			goto('/game');
		} else {
			goto('/login');
		}
	});
</script>

<div class="bg-canvas-950 text-ink-900 flex min-h-screen flex-col items-center justify-center">
	<div class="text-center">
		<div class="border-gold-500 mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
		<p class="text-ink-700 font-mono text-sm tracking-wide uppercase">Loading…</p>
	</div>
</div>
